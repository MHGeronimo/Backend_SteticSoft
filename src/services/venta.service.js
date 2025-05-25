// src/services/venta.service.js
"use strict";

const db = require("../models");
const { Op } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors"); // Asegúrate que la ruta sea correcta
const moment = require("moment-timezone"); // Para formatear fechas si es necesario para el correo

// IMPORTACIONES PARA CORREO
// Asumiendo que tienes un VentaEmailTemplate.js similar a CitaEmailTemplate.js
const { enviarCorreoVenta } = require("../utils/VentaEmailTemplate.js"); // ¡ASEGÚRATE QUE ESTA RUTA Y FUNCIÓN EXISTAN!
const { formatDate, formatDateTime } = require("../utils/dateHelpers.js"); // Para formatear fechas

const TASA_IVA_POR_DEFECTO = 0.19;

/**
 * Obtener una venta por su ID con todos los detalles necesarios para notificaciones.
 * Esta es una función helper interna.
 */
const obtenerVentaCompletaPorId = async (idVenta, transaction = null) => {
  return db.Venta.findByPk(idVenta, {
    include: [
      {
        model: db.Cliente,
        as: "cliente",
        attributes: ["idCliente", "nombre", "apellido", "correo", "estado"],
      },
      {
        model: db.Dashboard,
        as: "dashboard",
        attributes: ["idDashboard", "nombreDashboard"],
      },
      {
        model: db.Estado,
        as: "estadoDetalle",
        attributes: ["idEstado", "nombreEstado"],
      },
      {
        model: db.Producto,
        as: "productosVendidos",
        attributes: ["idProducto", "nombre", "descripcion"], // No necesitamos precio aquí, ya está en el detalle
        through: {
          model: db.ProductoXVenta,
          as: "detalleProductoVenta",
          attributes: ["cantidad", "valorUnitario"],
        },
      },
      {
        model: db.Servicio,
        as: "serviciosVendidos",
        attributes: ["idServicio", "nombre", "descripcion"], // No necesitamos precio aquí, ya está en el detalle
        through: {
          model: db.VentaXServicio,
          as: "detalleServicioVenta",
          attributes: ["valorServicio", "citaId"],
        },
      },
    ],
    transaction,
  });
};

const crearVenta = async (datosVenta) => {
  const {
    fecha,
    clienteId,
    dashboardId,
    estadoVentaId,
    productos = [],
    servicios = [],
    estado,
  } = datosVenta;

  if (productos.length === 0 && servicios.length === 0) {
    throw new BadRequestError(
      "Una venta debe tener al menos un producto o un servicio."
    );
  }

  const cliente = await db.Cliente.findOne({
    where: { idCliente: clienteId, estado: true },
  });
  if (!cliente)
    throw new BadRequestError(
      `Cliente con ID ${clienteId} no encontrado o inactivo.`
    );

  const estadoProcesoVenta = await db.Estado.findByPk(estadoVentaId);
  if (!estadoProcesoVenta)
    throw new BadRequestError(
      `Estado de venta con ID ${estadoVentaId} no encontrado.`
    );

  if (dashboardId) {
    const dashboard = await db.Dashboard.findByPk(dashboardId);
    if (!dashboard)
      throw new BadRequestError(
        `Dashboard con ID ${dashboardId} no encontrado.`
      );
  }

  let subtotalCalculadoProductos = 0;
  let subtotalCalculadoServicios = 0;
  const productosParaCrearDetalle = [];
  const serviciosParaCrearDetalle = [];

  const transaction = await db.sequelize.transaction();
  try {
    for (const itemP of productos) {
      const productoDB = await db.Producto.findByPk(itemP.productoId, {
        transaction,
      });
      if (!productoDB)
        throw new BadRequestError(
          `Producto con ID ${itemP.productoId} no encontrado.`
        );
      if (!productoDB.estado)
        throw new BadRequestError(
          `Producto '${productoDB.nombre}' (ID: ${itemP.productoId}) no está activo.`
        );
      if (productoDB.existencia < itemP.cantidad) {
        throw new ConflictError(
          `No hay suficiente existencia para el producto '${productoDB.nombre}'. Solicitado: ${itemP.cantidad}, Disponible: ${productoDB.existencia}.`
        );
      }
      productosParaCrearDetalle.push({
        productoId: itemP.productoId,
        cantidad: itemP.cantidad,
        valorUnitario: productoDB.precio,
        dbInstance: productoDB,
        nombre: productoDB.nombre, // Para el correo
        descripcion: productoDB.descripcion, // Para el correo
      });
      subtotalCalculadoProductos += itemP.cantidad * productoDB.precio;
    }

    for (const itemS of servicios) {
      const servicioDB = await db.Servicio.findByPk(itemS.servicioId, {
        transaction,
      });
      if (!servicioDB)
        throw new BadRequestError(
          `Servicio con ID ${itemS.servicioId} no encontrado.`
        );
      if (!servicioDB.estado)
        throw new BadRequestError(
          `Servicio '${servicioDB.nombre}' (ID: ${itemS.servicioId}) no está activo.`
        );
      if (itemS.citaId) {
        const citaDB = await db.Cita.findByPk(itemS.citaId, { transaction });
        if (!citaDB)
          throw new BadRequestError(
            `Cita con ID ${itemS.citaId} no encontrada para el servicio '${servicioDB.nombre}'.`
          );
      }
      serviciosParaCrearDetalle.push({
        servicioId: itemS.servicioId,
        valorServicio: servicioDB.precio,
        citaId: itemS.citaId || null,
        nombre: servicioDB.nombre, // Para el correo
        descripcion: servicioDB.descripcion, // Para el correo
      });
      subtotalCalculadoServicios += servicioDB.precio;
    }

    const subtotalGeneral =
      subtotalCalculadoProductos + subtotalCalculadoServicios;
    const ivaCalculado = subtotalGeneral * TASA_IVA_POR_DEFECTO;
    const totalCalculado = subtotalGeneral + ivaCalculado;

    const nuevaVenta = await db.Venta.create(
      {
        fecha: fecha || new Date(),
        clienteId,
        dashboardId: dashboardId || null,
        estadoVentaId,
        total: parseFloat(totalCalculado).toFixed(2),
        iva: parseFloat(ivaCalculado).toFixed(2),
        estado: typeof estado === "boolean" ? estado : true,
      },
      { transaction }
    );

    for (const itemP of productosParaCrearDetalle) {
      await db.ProductoXVenta.create(
        {
          ventaId: nuevaVenta.idVenta,
          productoId: itemP.productoId,
          cantidad: itemP.cantidad,
          valorUnitario: parseFloat(itemP.valorUnitario).toFixed(2),
          dashboardId: dashboardId || null,
        },
        { transaction }
      );
      if (
        nuevaVenta.estado &&
        (estadoProcesoVenta.nombreEstado === "Completado" ||
          estadoProcesoVenta.nombreEstado === "En proceso")
      ) {
        await itemP.dbInstance.decrement("existencia", {
          by: itemP.cantidad,
          transaction,
        });
      }
    }

    for (const itemS of serviciosParaCrearDetalle) {
      await db.VentaXServicio.create(
        {
          ventaId: nuevaVenta.idVenta,
          servicioId: itemS.servicioId,
          valorServicio: parseFloat(itemS.valorServicio).toFixed(2),
          citaId: itemS.citaId,
        },
        { transaction }
      );
    }

    await transaction.commit();
    const ventaCreadaConDetalles = await obtenerVentaCompletaPorId(
      nuevaVenta.idVenta
    );

    // --- ENVÍO DE CORREO AL CREAR VENTA ---
    if (
      ventaCreadaConDetalles &&
      ventaCreadaConDetalles.cliente &&
      ventaCreadaConDetalles.cliente.correo &&
      ventaCreadaConDetalles.estado
    ) {
      try {
        await enviarCorreoVenta({
          // Asume que esta función existe en VentaEmailTemplate.js
          correoCliente: ventaCreadaConDetalles.cliente.correo,
          nombreCliente:
            ventaCreadaConDetalles.cliente.nombre || "Cliente Estimado",
          ventaInfo: {
            idVenta: ventaCreadaConDetalles.idVenta,
            accion: "registrada", // O 'procesada', 'confirmada'
            fecha: formatDate(ventaCreadaConDetalles.fecha), // Usar formatDate para solo fecha
            estado: ventaCreadaConDetalles.estadoDetalle
              ? ventaCreadaConDetalles.estadoDetalle.nombreEstado
              : "Desconocido",
            productos: ventaCreadaConDetalles.productosVendidos.map((p) => ({
              nombre: p.nombre,
              cantidad: p.ProductoXVenta.cantidad, // Accediendo a través del alias del through
              valorUnitario: p.ProductoXVenta.valorUnitario,
              descripcion: p.descripcion,
            })),
            servicios: ventaCreadaConDetalles.serviciosVendidos.map((s) => ({
              nombre: s.nombre,
              valorServicio: s.VentaXServicio.valorServicio, // Accediendo a través del alias del through
              descripcion: s.descripcion,
            })),
            subtotal: subtotalGeneral, // Para el template
            iva: ivaCalculado, // Para el template
            total: totalCalculado, // Para el template
            // mensajeAdicional: 'Gracias por tu compra!'
          },
        });
      } catch (emailError) {
        console.error(
          `Error al enviar correo de notificación de nueva venta ${nuevaVenta.idVenta} a ${cliente.correo}:`,
          emailError
        );
      }
    }
    // --- FIN ENVÍO DE CORREO ---

    return ventaCreadaConDetalles;
  } catch (error) {
    await transaction.rollback();
    if (
      error instanceof NotFoundError ||
      error instanceof BadRequestError ||
      error instanceof ConflictError
    )
      throw error;
    console.error(
      "Error al crear la venta en el servicio:",
      error.message,
      error.stack
    );
    throw new CustomError(`Error al crear la venta: ${error.message}`, 500);
  }
};

const actualizarEstadoProcesoVenta = async (idVenta, datosActualizar) => {
  const { estadoVentaId, estado } = datosActualizar;
  if (estadoVentaId === undefined && estado === undefined)
    throw new BadRequestError(
      "Se requiere 'estadoVentaId' o 'estado' para actualizar."
    );

  const transaction = await db.sequelize.transaction();
  try {
    let venta = await db.Venta.findByPk(idVenta, {
      include: [
        {
          model: db.Producto,
          as: "productosVendidos",
          through: {
            model: db.ProductoXVenta,
            as: "detalleProductoVenta",
            attributes: ["cantidad"],
          },
        },
      ],
      transaction,
    });
    if (!venta) {
      await transaction.rollback();
      throw new NotFoundError("Venta no encontrada para actualizar estado.");
    }

    const estadoOriginalBooleano = venta.estado;
    const estadoProcesoOriginal = venta.estadoVentaId
      ? await db.Estado.findByPk(venta.estadoVentaId)
      : null;

    const camposParaActualizar = {};
    if (estadoVentaId !== undefined) {
      /* ... (como lo tenías) ... */ camposParaActualizar.estadoVentaId =
        estadoVentaId;
    }
    if (estado !== undefined) camposParaActualizar.estado = estado;

    if (Object.keys(camposParaActualizar).length > 0) {
      await venta.update(camposParaActualizar, { transaction });
      venta = await obtenerVentaCompletaPorId(idVenta, transaction); // Recargar con todos los includes
    }

    // Lógica de ajuste de inventario si el estado BOLEANO de la Venta cambió
    if (
      datosActualizar.hasOwnProperty("estado") &&
      estadoOriginalBooleano !== venta.estado
    ) {
      const estadoProcesoActual = venta.estadoDetalle; // Ya lo tenemos del obtenerVentaCompletaPorId
      if (
        estadoProcesoActual &&
        (estadoProcesoActual.nombreEstado === "Completado" ||
          estadoProcesoActual.nombreEstado === "En proceso")
      ) {
        if (venta.productosVendidos && venta.productosVendidos.length > 0) {
          for (const pV of venta.productosVendidos) {
            const pDB = await db.Producto.findByPk(pV.idProducto, {
              transaction,
            });
            const cantVendida = pV.detalleProductoVenta.cantidad; // Usando el alias correcto
            if (pDB && cantVendida > 0) {
              if (venta.estado)
                await pDB.decrement("existencia", {
                  by: cantVendida,
                  transaction,
                });
              else
                await pDB.increment("existencia", {
                  by: cantVendida,
                  transaction,
                });
            }
          }
        }
      }
    }

    await transaction.commit();

    // --- ENVÍO DE CORREO AL ACTUALIZAR ESTADO DE VENTA ---
    if (venta && venta.cliente && venta.cliente.correo && venta.estado) {
      // Enviar si la venta está activa
      // Decidir cuándo enviar: ¿siempre que se actualiza o solo en cambios de estadoVentaId importantes?
      const estadoProcesoNuevo = venta.estadoDetalle;
      let accionCorreo = "actualizada";
      if (
        estadoProcesoNuevo &&
        estadoProcesoOriginal &&
        estadoProcesoNuevo.idEstado !== estadoProcesoOriginal.idEstado
      ) {
        accionCorreo = `actualizada (estado: ${estadoProcesoNuevo.nombreEstado})`;
      } else if (estadoOriginalBooleano !== venta.estado) {
        accionCorreo = venta.estado ? "reactivada" : "anulada";
      }

      try {
        await enviarCorreoVenta({
          correoCliente: venta.cliente.correo,
          nombreCliente: venta.cliente.nombre || "Cliente Estimado",
          ventaInfo: {
            idVenta: venta.idVenta,
            accion: accionCorreo,
            fecha: formatDate(venta.fecha),
            estado: estadoProcesoNuevo
              ? estadoProcesoNuevo.nombreEstado
              : "Desconocido",
            productos: venta.productosVendidos.map((p) => ({
              nombre: p.nombre,
              cantidad: p.detalleProductoVenta.cantidad,
              valorUnitario: p.detalleProductoVenta.valorUnitario,
              descripcion: p.descripcion,
            })),
            servicios: venta.serviciosVendidos.map((s) => ({
              nombre: s.nombre,
              valorServicio: s.detalleServicioVenta.valorServicio,
              descripcion: s.descripcion,
            })),
            total: venta.total,
            iva: venta.iva,
            subtotal: Number(venta.total) - Number(venta.iva), // Recalcular subtotal para el correo
            // mensajeAdicional: 'El estado de tu venta ha cambiado.'
          },
        });
      } catch (emailError) {
        console.error(
          `Error al enviar correo de actualización de venta ${venta.idVenta}:`,
          emailError
        );
      }
    }
    // --- FIN ENVÍO DE CORREO ---

    return venta;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError || error instanceof BadRequestError)
      throw error;
    console.error(
      `Error al actualizar estado de la venta con ID ${idVenta}:`,
      error.message,
      error.stack
    );
    throw new CustomError(
      `Error al actualizar estado de la venta: ${error.message}`,
      500
    );
  }
};

// Las funciones anularVenta, habilitarVenta y eliminarVentaFisica
// ya llaman a actualizarEstadoProcesoVenta o manejan su propia lógica de correo/inventario.
// Solo hay que asegurarse que la lógica de correo se dispare si es necesario desde ellas,
// o confiar en que actualizarEstadoProcesoVenta lo haga si el estado booleano cambia.

const anularVenta = async (idVenta) => {
  // actualizarEstadoProcesoVenta ya maneja el correo si el estado booleano cambia
  return actualizarEstadoProcesoVenta(idVenta, { estado: false });
};
const habilitarVenta = async (idVenta) => {
  // actualizarEstadoProcesoVenta ya maneja el correo si el estado booleano cambia
  return actualizarEstadoProcesoVenta(idVenta, { estado: true });
};

const eliminarVentaFisica = async (idVenta) => {
  // ... (lógica de eliminarVentaFisica como la tenías, con ajuste de inventario)
  // Generalmente no se envía correo al eliminar físicamente, pero se podría añadir si es necesario.
  const transaction = await db.sequelize.transaction();
  try {
    const venta = await db.Venta.findByPk(idVenta, {
      include: [
        { model: db.Cliente, as: "cliente", attributes: ["nombre", "correo"] }, // Para correo si decides notificar
        { model: db.Estado, as: "estadoDetalle" },
        {
          model: db.Producto,
          as: "productosVendidos",
          through: {
            model: db.ProductoXVenta,
            as: "detalleProductoVenta",
            attributes: ["cantidad"],
          },
        },
      ],
      transaction,
    });
    if (!venta) {
      await transaction.rollback();
      throw new NotFoundError("Venta no encontrada para eliminar.");
    }

    if (
      venta.estado &&
      venta.estadoDetalle &&
      (venta.estadoDetalle.nombreEstado === "Completado" ||
        venta.estadoDetalle.nombreEstado === "En proceso")
    ) {
      if (venta.productosVendidos && venta.productosVendidos.length > 0) {
        for (const pV of venta.productosVendidos) {
          const pDB = await db.Producto.findByPk(pV.idProducto, {
            transaction,
          });
          const cantVendida = pV.detalleProductoVenta.cantidad;
          if (pDB && cantVendida > 0)
            await pDB.increment("existencia", { by: cantVendida, transaction });
        }
      }
    }
    const filasEliminadas = await db.Venta.destroy({
      where: { idVenta },
      transaction,
    });
    await transaction.commit();

    // Opcional: Enviar correo de "Venta eliminada" (menos común)
    // if (venta.cliente && venta.cliente.correo) { ... }

    return filasEliminadas;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al eliminar físicamente la venta con ID ${idVenta}:`,
      error.message,
      error.stack
    );
    throw new CustomError(
      `Error al eliminar físicamente la venta: ${error.message}`,
      500
    );
  }
};

// Asegúrate de exportar todas las funciones
module.exports = {
  crearVenta,
  obtenerTodasLasVentas,
  obtenerVentaPorId,
  actualizarEstadoProcesoVenta,
  anularVenta,
  habilitarVenta,
  eliminarVentaFisica,
};
