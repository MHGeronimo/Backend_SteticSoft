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
const { checkAndSendStockAlert } = require('../utils/stockAlertHelper.js'); // Import stock alert helper

const TASA_IVA_POR_DEFECTO = 0.19;

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
        as: "productos",
        attributes: ["idProducto", "nombre", "descripcion", "precio", "stockMinimo", "existencia"],
        through: {
          model: db.ProductoXVenta,
          as: "detalleProductoVenta",
          attributes: ["cantidad", "valorUnitario"],
        },
      },
      {
        model: db.Servicio,
        as: "servicios",
        attributes: ["idServicio", "nombre", "descripcion", "precio", "duracionEstimadaMin"], // Corregido: duracionEstimadaMin
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
    estado, // Booleano general
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
  const productosAfectadosParaAlerta = new Set();

  const transaction = await db.sequelize.transaction();
  let nuevaVenta;
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
        cantidad: Number(itemP.cantidad),
        valorUnitario: Number(productoDB.precio),
        dbInstance: productoDB, // Guardamos la instancia para el decremento
        nombre: productoDB.nombre,
        descripcion: productoDB.descripcion,
      });
      subtotalCalculadoProductos +=
        Number(itemP.cantidad) * Number(productoDB.precio);
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
        valorServicio: Number(servicioDB.precio),
        citaId: itemS.citaId || null,
        nombre: servicioDB.nombre,
        descripcion: servicioDB.descripcion,
      });
      subtotalCalculadoServicios += Number(servicioDB.precio);
    }

    const subtotalGeneral =
      subtotalCalculadoProductos + subtotalCalculadoServicios;
    const ivaCalculado = subtotalGeneral * TASA_IVA_POR_DEFECTO;
    const totalCalculado = subtotalGeneral + ivaCalculado;
    const estadoVentaBooleano = typeof estado === "boolean" ? estado : true;


    nuevaVenta = await db.Venta.create(
      {
        fecha: fecha || new Date(),
        clienteId,
        dashboardId: dashboardId || null,
        estadoVentaId,
        total: Number(totalCalculado),
        iva: Number(ivaCalculado),
        estado: estadoVentaBooleano,
      },
      { transaction }
    );

    for (const itemP of productosParaCrearDetalle) {
      await db.ProductoXVenta.create(
        {
          ventaId: nuevaVenta.idVenta,
          productoId: itemP.productoId,
          cantidad: itemP.cantidad,
          valorUnitario: Number(itemP.valorUnitario),
          dashboardId: dashboardId || null,
        },
        { transaction }
      );
      if (
        estadoVentaBooleano && // Venta general está activa
        (estadoProcesoVenta.nombreEstado === "Completado" || // Y el proceso está en un estado que descuenta stock
          estadoProcesoVenta.nombreEstado === "En proceso") 
      ) {
        await itemP.dbInstance.decrement("existencia", {
          by: itemP.cantidad,
          transaction,
        });
        productosAfectadosParaAlerta.add(itemP.dbInstance.idProducto);
      }
    }

    for (const itemS of serviciosParaCrearDetalle) {
      await db.VentaXServicio.create(
        {
          ventaId: nuevaVenta.idVenta,
          servicioId: itemS.servicioId,
          valorServicio: Number(itemS.valorServicio),
          citaId: itemS.citaId,
        },
        { transaction }
      );
    }

    await transaction.commit();

    // Enviar alertas de stock después de confirmar la transacción
    if (estadoVentaBooleano && (estadoProcesoVenta.nombreEstado === "Completado" || estadoProcesoVenta.nombreEstado === "En proceso")) {
        for (const productoId of productosAfectadosParaAlerta) {
            const productoActualizado = await db.Producto.findByPk(productoId);
            if (productoActualizado) {
                await checkAndSendStockAlert(productoActualizado, `tras venta ID ${nuevaVenta.idVenta}`);
            }
        }
    }

    const ventaCreadaConDetalles = await obtenerVentaCompletaPorIdInterno(
      nuevaVenta.idVenta
    );

    if (
      ventaCreadaConDetalles &&
      ventaCreadaConDetalles.cliente &&
      ventaCreadaConDetalles.cliente.correo &&
      ventaCreadaConDetalles.estado // Estado booleano de la Venta
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
            productos: ventaCreadaConDetalles.productos.map((p) => ({
              nombre: p.nombre,
              cantidad: p.detalleProductoVenta.cantidad,
              valorUnitario: p.detalleProductoVenta.valorUnitario,
              descripcion: p.descripcion,
            })),
            servicios: ventaCreadaConDetalles.servicios.map((s) => ({
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
          as: "productos",
          attributes: ["idProducto", "nombre", "stockMinimo", "existencia"],
          through: {
            model: db.ProductoXVenta,
            as: "detalleProductoVenta",
            attributes: ["cantidad", "valorUnitario"],
          },
        },
        {
          model: db.Servicio,
          as: "servicios",
          attributes: ["idServicio", "nombre", "duracionEstimadaMin"], // Corregido: duracionEstimadaMin
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
  const venta = await obtenerVentaCompletaPorIdInterno(idVenta);
  if (!venta) {
    throw new NotFoundError("Venta no encontrada.");
  }
  return venta;
};

/**
 * Actualiza el estado de proceso y/o el estado booleano general de una Venta.
 * Esta es la función "CambiarEstado" para la entidad Venta, manejando sus complejidades.
 */
const actualizarEstadoProcesoVenta = async (idVenta, datosActualizar) => {
  const { estadoVentaId, estado } = datosActualizar; // estado es el booleano general
  if (estadoVentaId === undefined && estado === undefined)
    throw new BadRequestError(
      "Se requiere 'estadoVentaId' (estado del proceso) o 'estado' (booleano general) para actualizar."
    );

  const transaction = await db.sequelize.transaction();
  const productosAfectadosParaAlerta = new Set();
  try {
    let venta = await db.Venta.findByPk(idVenta, {
      include: [
        {
          model: db.Producto,
          as: "productos",
          through: {
            model: db.ProductoXVenta,
            as: "detalleProductoVenta",
            attributes: ["cantidad", "valorUnitario"],
          },
        },
        { model: db.Cliente, as: "cliente", attributes: ["nombre", "correo"] },
        { model: db.Estado, as: "estadoDetalle", attributes: ["nombreEstado"] },
      ],
      transaction,
    });
    if (!venta) {
      await transaction.rollback();
      throw new NotFoundError("Venta no encontrada para actualizar estado.");
    }

    const estadoOriginalBooleano = venta.estado; // Estado booleano ANTES de la actualización
    let nuevoEstadoProcesoDB = venta.estadoDetalle; // Estado de proceso ANTES de la actualización

    const camposParaActualizar = {};
    if (estadoVentaId !== undefined) {
      nuevoEstadoProcesoDB = await db.Estado.findByPk(estadoVentaId, { transaction });
      if (!nuevoEstadoProcesoDB) {
        await transaction.rollback();
        throw new BadRequestError(
          `El nuevo estado de proceso con ID ${estadoVentaId} no existe.`
        );
      }
      camposParaActualizar.estadoVentaId = estadoVentaId;
    }
    if (estado !== undefined) { // Si se está actualizando el estado booleano general
      camposParaActualizar.estado = estado;
    }

    if (Object.keys(camposParaActualizar).length > 0) {
      await venta.update(camposParaActualizar, { transaction });
      // Recargar para reflejar todos los cambios y asociaciones actualizadas para el correo y lógica de stock
      venta = await obtenerVentaCompletaPorIdInterno(idVenta, transaction);
    }
    
    // Lógica de ajuste de inventario:
    // Se activa si el estado booleano general de la venta cambia Y
    // el estado del proceso de la venta es uno que implica movimiento de stock ("Completado", "En proceso").
    const nuevoEstadoBooleanoVenta = venta.estado; // Estado booleano DESPUÉS de la actualización
    const estadoProcesoActualNombre = venta.estadoDetalle ? venta.estadoDetalle.nombreEstado : null;

    if (estadoOriginalBooleano !== nuevoEstadoBooleanoVenta && 
        (estadoProcesoActualNombre === "Completado" || estadoProcesoActualNombre === "En proceso")) {
      if (venta.productos && venta.productos.length > 0) {
        for (const pV of venta.productos) {
          const pDB = await db.Producto.findByPk(pV.idProducto, { transaction });
          const cantVendida = pV.detalleProductoVenta.cantidad;
          if (pDB && cantVendida > 0) {
            if (nuevoEstadoBooleanoVenta) { // Si se está HABILITANDO/REACTIVANDO la venta (estado ahora es true)
              await pDB.decrement("existencia", { by: cantVendida, transaction });
            } else { // Si se está ANULANDO la venta (estado ahora es false)
              await pDB.increment("existencia", { by: cantVendida, transaction });
            }
            productosAfectadosParaAlerta.add(pDB.idProducto);
          }
        }
      }
    }

    await transaction.commit();

    // Enviar alertas de stock después de confirmar la transacción
    if (nuevoEstadoBooleanoVenta && (estadoProcesoActualNombre === "Completado" || estadoProcesoActualNombre === "En proceso")) {
        for (const productoId of productosAfectadosParaAlerta) {
            const productoActualizado = await db.Producto.findByPk(productoId);
            if (productoActualizado) {
                await checkAndSendStockAlert(productoActualizado, `tras actualizar estado de venta ID ${idVenta}`);
            }
        }
    }


    if (
      venta &&
      venta.cliente &&
      venta.cliente.correo &&
      (datosActualizar.hasOwnProperty("estadoVentaId") ||
        datosActualizar.hasOwnProperty("estado"))
    ) {
      let accionCorreo = "actualizada";
      if (estadoOriginalBooleano !== venta.estado) {
        accionCorreo = venta.estado
          ? "reactivada (inventario ajustado)"
          : "anulada (inventario ajustado)";
      } else if (venta.estadoDetalle) {
        accionCorreo = `actualizada (nuevo estado de proceso: ${venta.estadoDetalle.nombreEstado})`;
      }

      try {
        let subtotalProductosCorreo = 0;
        venta.productos.forEach((p) => {
          subtotalProductosCorreo +=
            p.detalleProductoVenta.cantidad *
            p.detalleProductoVenta.valorUnitario;
        });
        let subtotalServiciosCorreo = 0;
        venta.servicios.forEach((s) => {
          subtotalServiciosCorreo += Number(
            s.detalleServicioVenta.valorServicio
          );
        });
        const subtotalGeneralCorreo =
          subtotalProductosCorreo + subtotalServiciosCorreo;
        const ivaCorreo = subtotalGeneralCorreo * TASA_IVA_POR_DEFECTO;
        const totalCorreo = subtotalGeneralCorreo + ivaCorreo;

        await enviarCorreoVenta({
          correoCliente: venta.cliente.correo,
          nombreCliente:
            venta.cliente.nombre || "Cliente Estimado",
          ventaInfo: {
            idVenta: venta.idVenta,
            accion: accionCorreo,
            fecha: formatDate(venta.fecha),
            estado: venta.estadoDetalle
              ? venta.estadoDetalle.nombreEstado
              : "Desconocido",
            productos: venta.productos.map((p) => ({
              nombre: p.nombre,
              cantidad: p.detalleProductoVenta.cantidad,
              valorUnitario: p.detalleProductoVenta.valorUnitario,
              descripcion: p.descripcion,
            })),
            servicios: venta.servicios.map((s) => ({
              nombre: s.nombre,
              valorServicio: s.detalleServicioVenta.valorServicio,
              descripcion: s.descripcion,
            })),
            subtotal: subtotalGeneralCorreo,
            iva: ivaCorreo,
            total: totalCorreo,
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

const anularVenta = async (idVenta) => {
  // Anular implica cambiar el estado booleano general a false.
  // La función actualizarEstadoProcesoVenta se encarga del inventario.
  return actualizarEstadoProcesoVenta(idVenta, { estado: false });
};
const habilitarVenta = async (idVenta) => {
  // Habilitar implica cambiar el estado booleano general a true.
  // La función actualizarEstadoProcesoVenta se encarga del inventario.
  return actualizarEstadoProcesoVenta(idVenta, { estado: true });
};

const eliminarVentaFisica = async (idVenta) => {
  const transaction = await db.sequelize.transaction();
  const productosAfectadosParaAlerta = new Set();
  let ventaOriginalEstabaActivaYProcesable = false;

  try {
    const venta = await db.Venta.findByPk(idVenta, {
      include: [
        { model: db.Estado, as: "estadoDetalle" },
        {
          model: db.Producto,
          as: "productos",
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

    ventaOriginalEstabaActivaYProcesable = venta.estado && venta.estadoDetalle &&
        (venta.estadoDetalle.nombreEstado === "Completado" || venta.estadoDetalle.nombreEstado === "En proceso");

    if (ventaOriginalEstabaActivaYProcesable) {
      if (venta.productos && venta.productos.length > 0) {
        for (const pV of venta.productos) {
          const pDB = await db.Producto.findByPk(pV.idProducto, { transaction });
          const cantVendida = pV.detalleProductoVenta.cantidad;
          if (pDB && cantVendida > 0) {
            await pDB.increment("existencia", { by: cantVendida, transaction }); // Devuelve al stock
            productosAfectadosParaAlerta.add(pDB.idProducto);
          }
        }
      }
    }
    // ON DELETE CASCADE en ProductoXVenta y VentaXServicio se encargarán de los detalles.
    const filasEliminadas = await db.Venta.destroy({
      where: { idVenta },
      transaction,
    });
    await transaction.commit();

    // Si la venta original estaba activa y descontó stock, la eliminación lo revierte.
    // No se envía alerta de "bajo stock" aquí, pues el stock aumenta.
    // Si se quisiera notificar sobre la reversión, sería otra lógica.

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