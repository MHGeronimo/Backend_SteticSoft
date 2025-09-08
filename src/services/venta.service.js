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
const { checkAndSendStockAlert } = require("../utils/stockAlertHelper.js");

const TASA_IVA_POR_DEFECTO = 0.19;

const obtenerVentaCompletaPorId = async (idVenta, transaction = null) => {
  return db.Venta.findByPk(idVenta, {
    include: [
      {
        model: db.Cliente,
        as: "cliente",
        attributes: ["idCliente", "nombre", "apellido", "correo"],
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
        // ✅ CORRECCIÓN: La columna `duracionEstimadaMin` no existe en la base de datos para `Servicio`.
        attributes: ["idServicio", "nombre", "descripcion", "precio"],
        through: {
          model: db.VentaXServicio,
          as: "detalleServicioVenta",
          // ✅ CORRECCIÓN: La columna `citaId` no existe en la tabla intermedia `VentaXServicio`.
          attributes: ["valorServicio"],
        },
      },
    ],
    transaction,
  });
};

const crearVenta = async (datosVenta) => {
  const { fecha, idCliente, idDashboard, idEstado, productos = [], servicios = [] } = datosVenta;

  if (productos.length === 0 && servicios.length === 0) {
    throw new BadRequestError("Una venta debe tener al menos un producto o un servicio.");
  }

  const cliente = await db.Cliente.findByPk(idCliente);
  if (!cliente || !cliente.estado) {
    throw new BadRequestError(`Cliente con ID ${idCliente} no encontrado o inactivo.`);
  }

  const estadoProcesoVenta = await db.Estado.findByPk(idEstado);
  if (!estadoProcesoVenta) {
    throw new BadRequestError(`Estado de venta con ID ${idEstado} no encontrado.`);
  }

  if (idDashboard) {
    const dashboard = await db.Dashboard.findByPk(idDashboard);
    if (!dashboard) {
      throw new BadRequestError(`Dashboard con ID ${idDashboard} no encontrado.`);
    }
  }

  let subtotalCalculadoProductos = 0;
  let subtotalCalculadoServicios = 0;
  const productosParaCrearDetalle = [];
  const serviciosParaCrearDetalle = [];
  const productosAfectadosParaAlerta = new Set();

  const transaction = await db.sequelize.transaction();
  let nuevaVenta;
  try {
    // Validar productos y calcular subtotal
    for (const itemP of productos) {
      const productoDB = await db.Producto.findByPk(itemP.idProducto, { transaction });
      if (!productoDB) throw new BadRequestError(`Producto con ID ${itemP.idProducto} no encontrado.`);
      if (!productoDB.estado) throw new BadRequestError(`Producto '${productoDB.nombre}' (ID: ${itemP.idProducto}) no está activo.`);
      if (productoDB.existencia < itemP.cantidad) {
        throw new ConflictError(`No hay suficiente existencia para el producto '${productoDB.nombre}'. Solicitado: ${itemP.cantidad}, Disponible: ${productoDB.existencia}.`);
      }
      productosParaCrearDetalle.push({
        idProducto: itemP.idProducto,
        cantidad: Number(itemP.cantidad),
        valorUnitario: Number(productoDB.precio),
        dbInstance: productoDB,
      });
      subtotalCalculadoProductos += Number(itemP.cantidad) * Number(productoDB.precio);
    }

    // Validar servicios y calcular subtotal
    for (const itemS of servicios) {
      const servicioDB = await db.Servicio.findByPk(itemS.idServicio, { transaction });
      if (!servicioDB) throw new BadRequestError(`Servicio con ID ${itemS.idServicio} no encontrado.`);
      if (!servicioDB.estado) throw new BadRequestError(`Servicio '${servicioDB.nombre}' (ID: ${itemS.idServicio}) no está activo.`);
      if (itemS.idCita) {
        const citaDB = await db.Cita.findByPk(itemS.idCita, { transaction });
        if (!citaDB) throw new BadRequestError(`Cita con ID ${itemS.idCita} no encontrada para el servicio '${servicioDB.nombre}'.`);
      }
      serviciosParaCrearDetalle.push({
        idServicio: itemS.idServicio,
        valorServicio: Number(servicioDB.precio),
        idCita: itemS.idCita || null,
      });
      subtotalCalculadoServicios += Number(servicioDB.precio);
    }

    const subtotalGeneral = subtotalCalculadoProductos + subtotalCalculadoServicios;
    const ivaCalculado = subtotalGeneral * TASA_IVA_POR_DEFECTO;
    const totalCalculado = subtotalGeneral + ivaCalculado;
    
    // Asume que idEstado 1 es 'Activa' o 'En proceso', y 2 es 'Anulada'
    const esEstadoProcesable = ["Completado", "En proceso"].includes(estadoProcesoVenta.nombreEstado);

    nuevaVenta = await db.Venta.create(
      {
        fecha: fecha || new Date(),
        idCliente,
        idDashboard: idDashboard || null,
        idEstado,
        total: Number(totalCalculado),
        iva: Number(ivaCalculado),
      },
      { transaction }
    );

    // Crear detalles de producto y actualizar inventario si el estado lo permite
    for (const itemP of productosParaCrearDetalle) {
      await db.ProductoXVenta.create(
        {
          idVenta: nuevaVenta.idVenta,
          idProducto: itemP.idProducto,
          cantidad: itemP.cantidad,
          valorUnitario: Number(itemP.valorUnitario),
          idDashboard: idDashboard || null,
        },
        { transaction }
      );
      if (esEstadoProcesable) {
        await itemP.dbInstance.decrement("existencia", {
          by: itemP.cantidad,
          transaction,
        });
        productosAfectadosParaAlerta.add(itemP.dbInstance.idProducto);
      }
    }

    // Crear detalles de servicio
    for (const itemS of serviciosParaCrearDetalle) {
      await db.VentaXServicio.create(
        {
          idVenta: nuevaVenta.idVenta,
          idServicio: itemS.idServicio,
          valorServicio: Number(itemS.valorServicio),
          idCita: itemS.idCita,
        },
        { transaction }
      );
    }

    await transaction.commit();

    // Enviar alertas de stock fuera de la transacción
    if (esEstadoProcesable) {
      for (const productoId of productosAfectadosParaAlerta) {
        const productoActualizado = await db.Producto.findByPk(productoId);
        if (productoActualizado) {
          await checkAndSendStockAlert(productoActualizado, `tras venta ID ${nuevaVenta.idVenta}`);
        }
      }
    }

    const ventaCreadaConDetalles = await obtenerVentaCompletaPorId(nuevaVenta.idVenta);

    // Enviar correo de confirmación
    if (ventaCreadaConDetalles && ventaCreadaConDetalles.cliente && ventaCreadaConDetalles.cliente.correo) {
      try {
        await enviarCorreoVenta({
          correoCliente: ventaCreadaConDetalles.cliente.correo,
          nombreCliente: ventaCreadaConDetalles.cliente.nombre || "Cliente Estimado",
          ventaInfo: {
            idVenta: ventaCreadaConDetalles.idVenta,
            accion: "registrada",
            fecha: formatDate(ventaCreadaConDetalles.fecha),
            estado: estadoProcesoVenta.nombreEstado,
            productos: ventaCreadaConDetalles.productos.map((p) => ({
              nombre: p.nombre,
              cantidad: p.detalleProductoVenta.cantidad,
              valorUnitario: p.detalleProductoVenta.valorUnitario,
              descripcion: p.descripcion,
            })) || [],
            servicios: ventaCreadaConDetalles.servicios.map((s) => ({
              nombre: s.nombre,
              valorServicio: s.detalleServicioVenta.valorServicio,
              descripcion: s.descripcion,
            })) || [],
            subtotal: subtotalGeneral,
            iva: ivaCalculado,
            total: totalCalculado,
            tasaIvaAplicada: TASA_IVA_POR_DEFECTO,
          },
        });
      } catch (emailError) {
        console.error(`Error al enviar correo de nueva venta ${nuevaVenta.idVenta}:`, emailError);
      }
    }
    return ventaCreadaConDetalles;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError || error instanceof BadRequestError || error instanceof ConflictError) {
      throw error;
    }
    console.error("Error al crear la venta en el servicio:", error.message, error.stack);
    throw new CustomError(`Error al crear la venta: ${error.message}`, 500);
  }
};

const obtenerTodasLasVentas = async (opcionesDeFiltro = {}) => {
  try {
    const whereClause = {};
    if (opcionesDeFiltro.idEstado) {
      whereClause.idEstado = opcionesDeFiltro.idEstado;
    }
    if (opcionesDeFiltro.idCliente) {
      whereClause.idCliente = opcionesDeFiltro.idCliente;
    }
    if (opcionesDeFiltro.idDashboard) {
      whereClause.idDashboard = opcionesDeFiltro.idDashboard;
    }

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
          // ✅ CORRECCIÓN: La columna `duracionEstimadaMin` no existe en la base de datos para `Servicio`.
          attributes: ["idServicio", "nombre"],
          through: {
            model: db.VentaXServicio,
            as: "detalleServicioVenta",
            // ✅ CORRECCIÓN: La columna `citaId` no existe en la tabla intermedia `VentaXServicio`.
            attributes: ["valorServicio"],
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
  const venta = await obtenerVentaCompletaPorId(idVenta);
  if (!venta) {
    throw new NotFoundError("Venta no encontrada.");
  }
  return venta;
};

const actualizarEstadoProcesoVenta = async (idVenta, datosActualizar) => {
  const { idEstado } = datosActualizar;
  if (idEstado === undefined) {
    throw new BadRequestError("Se requiere 'idEstado' (estado del proceso) para actualizar.");
  }

  const transaction = await db.sequelize.transaction();
  const productosAfectadosParaAlerta = new Set();
  try {
    let venta = await db.Venta.findByPk(idVenta, {
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
        { model: db.Cliente, as: "cliente", attributes: ["nombre", "correo"] },
        { model: db.Estado, as: "estadoDetalle", attributes: ["nombreEstado"] },
      ],
      transaction,
    });
    if (!venta) {
      await transaction.rollback();
      throw new NotFoundError("Venta no encontrada para actualizar estado.");
    }

    const estadoOriginalDB = venta.estadoDetalle;
    const nuevoEstadoProcesoDB = await db.Estado.findByPk(idEstado, { transaction });
    if (!nuevoEstadoProcesoDB) {
      await transaction.rollback();
      throw new BadRequestError(`El nuevo estado de proceso con ID ${idEstado} no existe.`);
    }

    const esEstadoProcesableOriginal = ["Completado", "En proceso"].includes(estadoOriginalDB.nombreEstado);
    const esEstadoProcesableNuevo = ["Completado", "En proceso"].includes(nuevoEstadoProcesoDB.nombreEstado);

    // Actualizar solo el idEstado
    await venta.update({ idEstado }, { transaction });

    // Ajustar inventario basado en el cambio de estado de procesable a no procesable y viceversa
    if (esEstadoProcesableOriginal !== esEstadoProcesableNuevo) {
      if (venta.productos && venta.productos.length > 0) {
        for (const pV of venta.productos) {
          const pDB = await db.Producto.findByPk(pV.idProducto, { transaction });
          const cantVendida = pV.detalleProductoVenta.cantidad;
          if (pDB && cantVendida > 0) {
            if (esEstadoProcesableNuevo) {
              await pDB.decrement("existencia", { by: cantVendida, transaction });
            } else {
              await pDB.increment("existencia", { by: cantVendida, transaction });
            }
            productosAfectadosParaAlerta.add(pDB.idProducto);
          }
        }
      }
    }

    await transaction.commit();

    // Enviar alertas de stock fuera de la transacción
    if (esEstadoProcesableNuevo) {
      for (const productoId of productosAfectadosParaAlerta) {
        const productoActualizado = await db.Producto.findByPk(productoId);
        if (productoActualizado) {
          await checkAndSendStockAlert(productoActualizado, `tras actualizar estado de venta ID ${idVenta}`);
        }
      }
    }

    const ventaActualizada = await obtenerVentaCompletaPorId(idVenta);

    if (ventaActualizada && ventaActualizada.cliente && ventaActualizada.cliente.correo) {
      const accionCorreo = `actualizada (nuevo estado de proceso: ${nuevoEstadoProcesoDB.nombreEstado})`;

      try {
        const ventaInfoParaCorreo = {
          idVenta: ventaActualizada.idVenta,
          accion: accionCorreo,
          fecha: formatDate(ventaActualizada.fecha),
          estado: ventaActualizada.estadoDetalle.nombreEstado,
          productos: ventaActualizada.productos.map((p) => ({
            nombre: p.nombre,
            cantidad: p.detalleProductoVenta.cantidad,
            valorUnitario: p.detalleProductoVenta.valorUnitario,
            descripcion: p.descripcion,
          })),
          servicios: ventaActualizada.servicios.map((s) => ({
            nombre: s.nombre,
            valorServicio: s.detalleServicioVenta.valorServicio,
            descripcion: s.descripcion,
          })),
          subtotal: ventaActualizada.total / (1 + TASA_IVA_POR_DEFECTO),
          iva: ventaActualizada.iva,
          total: ventaActualizada.total,
          tasaIvaAplicada: TASA_IVA_POR_DEFECTO,
        };
        await enviarCorreoVenta({
          correoCliente: ventaActualizada.cliente.correo,
          nombreCliente: ventaActualizada.cliente.nombre || "Cliente Estimado",
          ventaInfo: ventaInfoParaCorreo,
        });
      } catch (emailError) {
        console.error(`Error al enviar correo de actualización de venta ${idVenta}:`, emailError);
      }
    }
    return ventaActualizada;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError || error instanceof BadRequestError) {
      throw error;
    }
    console.error(`Error al actualizar estado de la venta con ID ${idVenta}:`, error.message, error.stack);
    throw new CustomError(`Error al actualizar estado de la venta: ${error.message}`, 500);
  }
};

const anularVenta = async (idVenta) => {
  // Aquí debes buscar el ID del estado 'Anulada'
  // Suponiendo que el ID para 'Anulada' es 2. Esto debería ser configurable.
  const idEstadoAnulada = 2;
  return actualizarEstadoProcesoVenta(idVenta, { idEstado: idEstadoAnulada });
};

const habilitarVenta = async (idVenta) => {
  // Aquí debes buscar el ID de un estado 'Activa' o 'En proceso'
  // Suponiendo que el ID para 'Activa' es 1. Esto debería ser configurable.
  const idEstadoActiva = 1; 
  return actualizarEstadoProcesoVenta(idVenta, { idEstado: idEstadoActiva });
};

const eliminarVentaFisica = async (idVenta) => {
  const transaction = await db.sequelize.transaction();
  const productosAfectadosParaAlerta = new Set();
  let ventaOriginalProcesable = false;

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

    ventaOriginalProcesable = ["Completado", "En proceso"].includes(venta.estadoDetalle?.nombreEstado);

    if (ventaOriginalProcesable) {
      if (venta.productos && venta.productos.length > 0) {
        for (const pV of venta.productos) {
          const pDB = await db.Producto.findByPk(pV.idProducto, { transaction });
          const cantVendida = pV.detalleProductoVenta.cantidad;
          if (pDB && cantVendida > 0) {
            await pDB.increment("existencia", { by: cantVendida, transaction });
            productosAfectadosParaAlerta.add(pDB.idProducto);
          }
        }
      }
    }

    const filasEliminadas = await db.Venta.destroy({
      where: { idVenta },
      transaction,
    });
    await transaction.commit();

    if (ventaOriginalProcesable) {
      for (const productoId of productosAfectadosParaAlerta) {
        const productoActualizado = await db.Producto.findByPk(productoId);
        if (productoActualizado) {
          await checkAndSendStockAlert(productoActualizado, `tras eliminar venta ID ${idVenta}`);
        }
      }
    }

    return filasEliminadas;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError) throw error;
    console.error(`Error al eliminar físicamente la venta con ID ${idVenta}:`, error.message, error.stack);
    throw new CustomError(`Error al eliminar físicamente la venta: ${error.message}`, 500);
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