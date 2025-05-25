// src/services/venta.service.js
"use strict";

const db = require("../models");
const { Op } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors");
const moment = require("moment-timezone");
const { enviarCorreoVenta } = require("../utils/VentaEmailTemplate.js");
const { formatDate } = require("../utils/dateHelpers.js");

const TASA_IVA_POR_DEFECTO = 0.19;

/**
 * Función helper interna para obtener una venta por su ID con todos los detalles.
 */
const obtenerVentaCompletaPorIdInterno = async (
  idVenta,
  transaction = null
) => {
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
        attributes: ["idProducto", "nombre", "descripcion", "precio"], // precio del producto base
        through: {
          model: db.ProductoXVenta,
          as: "detalleProductoVenta",
          attributes: ["cantidad", "valorUnitario"],
        },
      },
      {
        model: db.Servicio,
        as: "serviciosVendidos",
        attributes: ["idServicio", "nombre", "descripcion", "precio"], // precio del servicio base
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
        nombre: productoDB.nombre,
        descripcion: productoDB.descripcion,
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
        nombre: servicioDB.nombre,
        descripcion: servicioDB.descripcion,
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
    const ventaCreadaConDetalles = await obtenerVentaCompletaPorIdInterno(
      nuevaVenta.idVenta
    );

    if (
      ventaCreadaConDetalles &&
      ventaCreadaConDetalles.cliente &&
      ventaCreadaConDetalles.cliente.correo &&
      ventaCreadaConDetalles.estado
    ) {
      try {
        await enviarCorreoVenta({
          correoCliente: ventaCreadaConDetalles.cliente.correo,
          nombreCliente:
            ventaCreadaConDetalles.cliente.nombre || "Cliente Estimado",
          ventaInfo: {
            idVenta: ventaCreadaConDetalles.idVenta,
            accion: "registrada",
            fecha: formatDate(ventaCreadaConDetalles.fecha),
            estado: ventaCreadaConDetalles.estadoDetalle
              ? ventaCreadaConDetalles.estadoDetalle.nombreEstado
              : "Desconocido",
            productos: ventaCreadaConDetalles.productosVendidos.map((p) => ({
              nombre: p.nombre,
              cantidad: p.detalleProductoVenta.cantidad,
              valorUnitario: p.detalleProductoVenta.valorUnitario,
              descripcion: p.descripcion,
            })),
            servicios: ventaCreadaConDetalles.serviciosVendidos.map((s) => ({
              nombre: s.nombre,
              valorServicio: s.detalleServicioVenta.valorServicio,
              descripcion: s.descripcion,
            })),
            subtotal: subtotalGeneral,
            iva: ivaCalculado,
            total: totalCalculado,
            tasaIvaAplicada: TASA_IVA_POR_DEFECTO,
          },
        });
      } catch (emailError) {
        console.error(
          `Error al enviar correo de nueva venta ${nuevaVenta.idVenta}:`,
          emailError
        );
      }
    }
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

const obtenerTodasLasVentas = async (opcionesDeFiltro = {}) => {
  try {
    const whereClause = {};
    if (opcionesDeFiltro.hasOwnProperty("estado"))
      whereClause.estado = opcionesDeFiltro.estado;
    if (opcionesDeFiltro.clienteId)
      whereClause.clienteId = opcionesDeFiltro.clienteId;
    if (opcionesDeFiltro.dashboardId)
      whereClause.dashboardId = opcionesDeFiltro.dashboardId;
    if (opcionesDeFiltro.estadoVentaId)
      whereClause.estadoVentaId = opcionesDeFiltro.estadoVentaId;

    return await db.Venta.findAll({
      where: whereClause,
      include: [
        {
          model: db.Cliente,
          as: "cliente",
          attributes: ["idCliente", "nombre", "apellido"],
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
          attributes: ["idProducto", "nombre"],
          through: {
            model: db.ProductoXVenta,
            as: "detalleProductoVenta",
            attributes: ["cantidad", "valorUnitario"],
          },
        },
        {
          model: db.Servicio,
          as: "serviciosVendidos",
          attributes: ["idServicio", "nombre"],
          through: {
            model: db.VentaXServicio,
            as: "detalleServicioVenta",
            attributes: ["valorServicio", "citaId"],
          },
        },
      ],
      order: [
        ["fecha", "DESC"],
        ["idVenta", "DESC"],
      ],
    });
  } catch (error) {
    console.error("Error al obtener todas las ventas:", error.message);
    throw new CustomError(`Error al obtener ventas: ${error.message}`, 500);
  }
};

const obtenerVentaPorId = async (idVenta) => {
  const venta = await obtenerVentaCompletaPorIdInterno(idVenta); // Usando la función helper
  if (!venta) {
    throw new NotFoundError("Venta no encontrada.");
  }
  return venta;
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
    // const estadoProcesoOriginal = venta.estadoVentaId ? await db.Estado.findByPk(venta.estadoVentaId, {transaction}) : null; // No es necesario cargarlo para el correo si usamos obtenerVentaCompletaPorIdInterno al final

    const camposParaActualizar = {};
    if (estadoVentaId !== undefined) {
      const nuevoEstadoProcesoDB = await db.Estado.findByPk(estadoVentaId, {
        transaction,
      });
      if (!nuevoEstadoProcesoDB) {
        await transaction.rollback();
        throw new BadRequestError(
          `El nuevo estado de proceso con ID ${estadoVentaId} no existe.`
        );
      }
      camposParaActualizar.estadoVentaId = estadoVentaId;
    }
    if (estado !== undefined) camposParaActualizar.estado = estado;

    if (Object.keys(camposParaActualizar).length > 0) {
      await venta.update(camposParaActualizar, { transaction });
      // No es necesario el reload aquí si vamos a llamar a obtenerVentaCompletaPorIdInterno al final
    }

    // Lógica de ajuste de inventario si el estado BOLEANO de la Venta cambió
    // Para que esta lógica funcione bien, 'venta' debe tener los datos actualizados.
    // Hacemos un reload implícito al llamar a obtenerVentaCompletaPorIdInterno antes del correo,
    // o si es crítico para la lógica de inventario, un reload aquí.
    // Por simplicidad, la lógica de inventario usará el 'venta.estado' que ya fue actualizado en memoria por el update
    // si el `await venta.update` modifica la instancia en memoria (Sequelize lo hace).
    if (
      datosActualizar.hasOwnProperty("estado") &&
      estadoOriginalBooleano !== datosActualizar.estado
    ) {
      // Usar datosActualizar.estado
      const estadoProcesoActual = await db.Estado.findByPk(
        venta.estadoVentaId,
        { transaction }
      ); // Usar el estadoVentaId de la instancia 'venta' (ya actualizado si vino en datosActualizar)
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
            const cantVendida = pV.detalleProductoVenta.cantidad;
            if (pDB && cantVendida > 0) {
              if (datosActualizar.estado)
                await pDB.decrement("existencia", {
                  by: cantVendida,
                  transaction,
                }); // Habilitando (antes false)
              else
                await pDB.increment("existencia", {
                  by: cantVendida,
                  transaction,
                }); // Anulando (antes true)
            }
          }
        }
      }
    }

    await transaction.commit();
    const ventaActualizadaConDetalles = await obtenerVentaCompletaPorIdInterno(
      idVenta
    );

    if (
      ventaActualizadaConDetalles &&
      ventaActualizadaConDetalles.cliente &&
      ventaActualizadaConDetalles.cliente.correo &&
      ventaActualizadaConDetalles.estado
    ) {
      let accionCorreo = "actualizada";
      // Para determinar la acción del correo, necesitamos el estado del proceso *antes* de la actualización
      // Esta parte se complica si no pasamos el estado original.
      // Simplificación: el correo dirá "actualizada" o usará el nuevo estado del proceso.
      const estadoProcesoNuevo = ventaActualizadaConDetalles.estadoDetalle;

      if (estadoOriginalBooleano !== ventaActualizadaConDetalles.estado) {
        accionCorreo = ventaActualizadaConDetalles.estado
          ? "reactivada (inventario ajustado)"
          : "anulada (inventario ajustado)";
      } else if (estadoProcesoNuevo) {
        accionCorreo = `actualizada (nuevo estado: ${estadoProcesoNuevo.nombreEstado})`;
      }

      try {
        await enviarCorreoVenta({
          correoCliente: ventaActualizadaConDetalles.cliente.correo,
          nombreCliente:
            ventaActualizadaConDetalles.cliente.nombre || "Cliente Estimado",
          ventaInfo: {
            idVenta: ventaActualizadaConDetalles.idVenta,
            accion: accionCorreo,
            fecha: formatDate(ventaActualizadaConDetalles.fecha),
            estado: estadoProcesoNuevo
              ? estadoProcesoNuevo.nombreEstado
              : "Desconocido",
            productos: ventaActualizadaConDetalles.productosVendidos.map(
              (p) => ({
                nombre: p.nombre,
                cantidad: p.detalleProductoVenta.cantidad,
                valorUnitario: p.detalleProductoVenta.valorUnitario,
                descripcion: p.descripcion,
              })
            ),
            servicios: ventaActualizadaConDetalles.serviciosVendidos.map(
              (s) => ({
                nombre: s.nombre,
                valorServicio: s.detalleServicioVenta.valorServicio,
                descripcion: s.descripcion,
              })
            ),
            total: ventaActualizadaConDetalles.total,
            iva: ventaActualizadaConDetalles.iva,
            subtotal:
              Number(ventaActualizadaConDetalles.total) -
              Number(ventaActualizadaConDetalles.iva),
            tasaIvaAplicada: TASA_IVA_POR_DEFECTO,
          },
        });
      } catch (emailError) {
        console.error(
          `Error al enviar correo de actualización de venta ${idVenta}:`,
          emailError
        );
      }
    }
    return ventaActualizadaConDetalles;
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

const anularVenta = async (idVenta) => {
  return actualizarEstadoProcesoVenta(idVenta, { estado: false });
};
const habilitarVenta = async (idVenta) => {
  return actualizarEstadoProcesoVenta(idVenta, { estado: true });
};

const eliminarVentaFisica = async (idVenta) => {
  // ... (lógica como la tenías, asegurando que el alias sea correcto para obtener cantidad)
  const transaction = await db.sequelize.transaction();
  try {
    const venta = await db.Venta.findByPk(idVenta, {
      include: [
        { model: db.Cliente, as: "cliente", attributes: ["nombre", "correo"] },
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
          const cantVendida = pV.detalleProductoVenta.cantidad; // Usando alias
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

module.exports = {
  crearVenta,
  obtenerTodasLasVentas,
  obtenerVentaPorId,
  actualizarEstadoProcesoVenta,
  anularVenta,
  habilitarVenta,
  eliminarVentaFisica,
};
