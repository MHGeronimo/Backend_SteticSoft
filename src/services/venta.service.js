// src/services/venta.service.js
const db = require("../models");
const { Op } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors"); // Asegúrate que la ruta sea correcta y errors/index.js exporte esto

const TASA_IVA_POR_DEFECTO = 0.19; // ¡Haz esto configurable!

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

    const detallesProductosVendidos = [];
    for (const itemP of productosParaCrearDetalle) {
      const detalle = await db.ProductoXVenta.create(
        {
          ventaId: nuevaVenta.idVenta,
          productoId: itemP.productoId,
          cantidad: itemP.cantidad,
          valorUnitario: parseFloat(itemP.valorUnitario).toFixed(2),
          dashboardId: dashboardId || null,
        },
        { transaction }
      );
      detallesProductosVendidos.push(detalle);
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

    const detallesServiciosVendidos = [];
    for (const itemS of serviciosParaCrearDetalle) {
      const detalle = await db.VentaXServicio.create(
        {
          ventaId: nuevaVenta.idVenta,
          servicioId: itemS.servicioId,
          valorServicio: parseFloat(itemS.valorServicio).toFixed(2),
          citaId: itemS.citaId,
        },
        { transaction }
      );
      detallesServiciosVendidos.push(detalle);
    }

    await transaction.commit();
    const ventaCreadaJSON = nuevaVenta.toJSON();
    ventaCreadaJSON.productos = detallesProductosVendidos.map((d) =>
      d.toJSON()
    );
    ventaCreadaJSON.servicios = detallesServiciosVendidos.map((d) =>
      d.toJSON()
    );
    return ventaCreadaJSON;
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
    if (opcionesDeFiltro.hasOwnProperty("estado")) {
      whereClause.estado = opcionesDeFiltro.estado;
    }
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
  try {
    const venta = await db.Venta.findByPk(idVenta, {
      include: [
        { model: db.Cliente, as: "cliente" },
        { model: db.Dashboard, as: "dashboard" },
        { model: db.Estado, as: "estadoDetalle" },
        {
          model: db.Producto,
          as: "productosVendidos",
          through: {
            model: db.ProductoXVenta,
            as: "detalleProductoVenta",
            attributes: ["cantidad", "valorUnitario"],
          },
        },
        {
          model: db.Servicio,
          as: "serviciosVendidos",
          through: {
            model: db.VentaXServicio,
            as: "detalleServicioVenta",
            attributes: ["valorServicio", "citaId"],
          },
        },
      ],
    });
    if (!venta) throw new NotFoundError("Venta no encontrada.");
    return venta;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al obtener la venta con ID ${idVenta}:`,
      error.message
    );
    throw new CustomError(`Error al obtener la venta: ${error.message}`, 500);
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
    const venta = await db.Venta.findByPk(idVenta, {
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
      await venta.reload({
        transaction,
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
      });
    }
    if (
      datosActualizar.hasOwnProperty("estado") &&
      estadoOriginalBooleano !== venta.estado
    ) {
      const estadoProcesoActual = await db.Estado.findByPk(
        venta.estadoVentaId,
        { transaction }
      );
      if (
        estadoProcesoActual &&
        (estadoProcesoActual.nombreEstado === "Completado" ||
          estadoProcesoActual.nombreEstado === "En proceso")
      ) {
        if (venta.productosVendidos && venta.productosVendidos.length > 0) {
          for (const pV of venta.productosVendidos) {
            // Renombrada variable productoVendido a pV
            const pDB = await db.Producto.findByPk(pV.idProducto, {
              transaction,
            }); // Renombrada variable productoDB a pDB
            const cantVendida = pV.ProductoXVenta.cantidad; // Renombrada variable cantidadVendida a cantVendida
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
    return obtenerVentaPorId(idVenta);
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
  const transaction = await db.sequelize.transaction();
  try {
    const venta = await db.Venta.findByPk(idVenta, {
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
      throw new NotFoundError("Venta no encontrada para eliminar.");
    }
    const estadoProcesoVenta = await db.Estado.findByPk(venta.estadoVentaId, {
      transaction,
    });
    if (
      venta.estado &&
      estadoProcesoVenta &&
      (estadoProcesoVenta.nombreEstado === "Completado" ||
        estadoProcesoVenta.nombreEstado === "En proceso")
    ) {
      if (venta.productosVendidos && venta.productosVendidos.length > 0) {
        for (const pV of venta.productosVendidos) {
          const pDB = await db.Producto.findByPk(pV.idProducto, {
            transaction,
          });
          const cantVendida = pV.ProductoXVenta.cantidad;
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
