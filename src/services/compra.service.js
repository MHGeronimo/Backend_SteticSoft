const db = require("../models");
const { Op } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors");
const { checkAndSendStockAlert } = require('../utils/stockAlertHelper.js');

const TASA_IVA = 0.19;

/**
 * Crear una nueva compra y sus detalles.
 */
const crearCompra = async (datosCompra) => {
  const {
    fecha,
    proveedorId,
    dashboardId,
    productos,
    estado,
  } = datosCompra;
  let { total, iva } = datosCompra;

  const proveedor = await db.Proveedor.findOne({
    where: { idProveedor: proveedorId, estado: true },
  });
  if (!proveedor) {
    throw new BadRequestError(
      `Proveedor con ID ${proveedorId} no encontrado o inactivo.`
    );
  }
  if (dashboardId) {
    const dashboard = await db.Dashboard.findByPk(dashboardId);
    if (!dashboard) {
      throw new BadRequestError(
        `Dashboard con ID ${dashboardId} no encontrado.`
      );
    }
  }

  let subtotalCalculado = 0;
  const productosValidados = [];
  for (const item of productos) {
    const productoDB = await db.Producto.findByPk(item.productoId);
    if (!productoDB)
      throw new BadRequestError(
        `Producto con ID ${item.productoId} no encontrado.`
      );
    if (!productoDB.estado)
      throw new BadRequestError(
        `Producto '${productoDB.nombre}' (ID: ${item.productoId}) no está activo.`
      );
    productosValidados.push({ ...item, nombre: productoDB.nombre, stockMinimo: productoDB.stockMinimo, existenciaOriginal: productoDB.existencia }); // Guardar stockMinimo
    subtotalCalculado += item.cantidad * item.valorUnitario;
  }

  if (total === undefined) {
    if (iva === undefined) iva = subtotalCalculado * TASA_IVA;
    total = subtotalCalculado + iva;
  } else if (iva === undefined) {
    iva = (total / (1 + TASA_IVA)) * TASA_IVA;
  }

  const estadoCompra = typeof estado === "boolean" ? estado : true;
  const transaction = await db.sequelize.transaction();
  let nuevaCompra;
  try {
    nuevaCompra = await db.Compra.create(
      {
        fecha: fecha || new Date(),
        proveedorId,
        dashboardId: dashboardId || null,
        total: parseFloat(total).toFixed(2),
        iva: parseFloat(iva).toFixed(2),
        estado: estadoCompra,
      },
      { transaction }
    );

    const detallesCompra = [];
    const productosAfectadosParaAlerta = [];

    for (const item of productosValidados) {
      const detalle = await db.CompraXProducto.create(
        {
          compraId: nuevaCompra.idCompra,
          productoId: item.productoId,
          cantidad: item.cantidad,
          valorUnitario: parseFloat(item.valorUnitario).toFixed(2),
        },
        { transaction }
      );
      detallesCompra.push(detalle);

      if (estadoCompra) { // Solo afectar inventario si la compra está activa
        const productoDB = await db.Producto.findByPk(item.productoId, {
          transaction,
        });
        await productoDB.increment("existencia", {
          by: item.cantidad,
          transaction,
        });
        productosAfectadosParaAlerta.push(productoDB.idProducto);
      }
    }

    await transaction.commit();

    for (const productoIdAfectado of productosAfectadosParaAlerta) {
        const productoActualizado = await db.Producto.findByPk(productoIdAfectado);
        if (productoActualizado) {
            await checkAndSendStockAlert(productoActualizado, `tras compra ID ${nuevaCompra.idCompra}`);
        }
    }

    const compraCreadaJSON = nuevaCompra.toJSON();
    compraCreadaJSON.detalles = detallesCompra.map((d) => d.toJSON());
    return compraCreadaJSON;
  } catch (error) {
    await transaction.rollback();
    console.error(
      "Error al crear la compra en el servicio:",
      error.message,
      error.stack
    );
    throw new CustomError(`Error al crear la compra: ${error.message}`, 500);
  }
};


const obtenerTodasLasCompras = async (opcionesDeFiltro = {}) => {
  try {
    return await db.Compra.findAll({
      where: opcionesDeFiltro,
      include: [
        {
          model: db.Proveedor,
          as: "proveedor",
          attributes: ["idProveedor", "nombre"],
        },
        {
          model: db.Dashboard,
          as: "dashboard",
          attributes: ["idDashboard", "nombreDashboard"],
        },
        {
          model: db.Producto,
          as: "productosComprados",
          attributes: ["idProducto", "nombre", "precio", "stockMinimo", "existencia"],
          through: {
            model: db.CompraXProducto,
            as: "detalleCompra",
            attributes: ["cantidad", "valorUnitario"],
          },
        },
      ],
      order: [
        ["fecha", "DESC"],
        ["idCompra", "DESC"],
      ],
    });
  } catch (error) {
    console.error("Error al obtener todas las compras:", error.message);
    throw new CustomError(`Error al obtener compras: ${error.message}`, 500);
  }
};


const obtenerCompraPorId = async (idCompra) => {
  try {
    const compra = await db.Compra.findByPk(idCompra, {
      include: [
        { model: db.Proveedor, as: "proveedor" },
        { model: db.Dashboard, as: "dashboard" },
        {
          model: db.Producto,
          as: "productosComprados",
          attributes: ["idProducto", "nombre", "precio", "stockMinimo", "existencia"],
          through: {
            as: "detalleCompra",
            attributes: ["cantidad", "valorUnitario"],
          },
        },
      ],
    });
    if (!compra) {
      throw new NotFoundError("Compra no encontrada.");
    }
    return compra;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al obtener la compra con ID ${idCompra}:`,
      error.message
    );
    throw new CustomError(`Error al obtener la compra: ${error.message}`, 500);
  }
};

const actualizarCompra = async (idCompra, datosActualizar) => {
  const { fecha, proveedorId, dashboardId, total, iva, estado } =
    datosActualizar;
  const camposParaActualizar = {};

  if (fecha !== undefined) camposParaActualizar.fecha = fecha;
  if (total !== undefined)
    camposParaActualizar.total = parseFloat(total).toFixed(2);
  if (iva !== undefined) camposParaActualizar.iva = parseFloat(iva).toFixed(2);
  if (estado !== undefined) camposParaActualizar.estado = estado;

  const transaction = await db.sequelize.transaction();
  const productosAfectadosParaAlerta = new Set();
  try {
    const compra = await db.Compra.findByPk(idCompra, {
      include: [
        {
          model: db.Producto,
          as: "productosComprados",
          through: {
            model: db.CompraXProducto,
            as: "detalleCompra",
            attributes: ["cantidad"],
          },
        },
      ],
      transaction,
    });
    if (!compra) {
      await transaction.rollback();
      throw new NotFoundError("Compra no encontrada para actualizar.");
    }

    const estadoOriginal = compra.estado;

    if (proveedorId !== undefined && proveedorId !== compra.proveedorId) {
      const proveedor = await db.Proveedor.findOne({
        where: { idProveedor: proveedorId, estado: true },
        transaction,
      });
      if (!proveedor) {
        await transaction.rollback();
        throw new BadRequestError(
          `Proveedor con ID ${proveedorId} no encontrado o inactivo.`
        );
      }
      camposParaActualizar.proveedorId = proveedorId;
    }
    if (dashboardId !== undefined && dashboardId !== compra.dashboardId) {
      if (dashboardId === null) camposParaActualizar.dashboardId = null;
      else {
        const dashboard = await db.Dashboard.findByPk(dashboardId, {
          transaction,
        });
        if (!dashboard) {
          await transaction.rollback();
          throw new BadRequestError(
            `Dashboard con ID ${dashboardId} no encontrado.`
          );
        }
        camposParaActualizar.dashboardId = dashboardId;
      }
    }
    
    if (Object.keys(camposParaActualizar).length > 0) {
        await compra.update(camposParaActualizar, { transaction });
        if(camposParaActualizar.estado !== undefined) {
            compra.estado = camposParaActualizar.estado;
        }
    }


    if (
      datosActualizar.hasOwnProperty("estado") &&
      estadoOriginal !== compra.estado
    ) {
      for (const productoComprado of compra.productosComprados) {
        const productoDB = await db.Producto.findByPk(
          productoComprado.idProducto,
          { transaction }
        );
        const cantidadComprada = productoComprado.CompraXProducto.cantidad;
        if (compra.estado) { 
          await productoDB.increment("existencia", { by: cantidadComprada, transaction });
        } else { 
          await productoDB.decrement("existencia", { by: cantidadComprada, transaction });
        }
        productosAfectadosParaAlerta.add(productoDB.idProducto);
      }
    }

    await transaction.commit();

    for (const productoId of productosAfectadosParaAlerta) {
        const productoActualizado = await db.Producto.findByPk(productoId);
        if (productoActualizado) {
            await checkAndSendStockAlert(productoActualizado, `tras actualizar estado de compra ID ${idCompra}`);
        }
    }
    return obtenerCompraPorId(idCompra);
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError || error instanceof BadRequestError)
      throw error;
    console.error(
      `Error al actualizar la compra con ID ${idCompra}:`,
      error.message
    );
    throw new CustomError(
      `Error al actualizar la compra: ${error.message}`,
      500
    );
  }
};


const eliminarCompraFisica = async (idCompra) => {
  const transaction = await db.sequelize.transaction();
  const productosAfectadosParaAlerta = new Set();
  let compraOriginalEstado = null;
  let productosOriginales = [];

  try {
    const compra = await db.Compra.findByPk(idCompra, {
      include: [
        {
          model: db.Producto,
          as: "productosComprados",
          through: {
            model: db.CompraXProducto,
            as: "detalleCompra",
            attributes: ["cantidad"],
          },
        },
      ],
      transaction,
    });

    if (!compra) {
      await transaction.rollback();
      throw new NotFoundError("Compra no encontrada para eliminar.");
    }
    compraOriginalEstado = compra.estado;
    productosOriginales = compra.productosComprados.map(p => ({idProducto: p.idProducto, cantidad: p.CompraXProducto.cantidad}));


    if (
      compraOriginalEstado && 
      productosOriginales &&
      productosOriginales.length > 0
    ) {
      for (const productoComprado of productosOriginales) {
        const productoDB = await db.Producto.findByPk(
          productoComprado.idProducto,
          { transaction }
        );
        const cantidadComprada = productoComprado.cantidad;
        if (productoDB && cantidadComprada > 0) {
          await productoDB.decrement("existencia", {
            by: cantidadComprada,
            transaction,
          });
          productosAfectadosParaAlerta.add(productoDB.idProducto);
        }
      }
    }

    const filasEliminadas = await db.Compra.destroy({
      where: { idCompra },
      transaction,
    });

    await transaction.commit();
    
    if(compraOriginalEstado){ 
        for (const productoId of productosAfectadosParaAlerta) {
            const productoActualizado = await db.Producto.findByPk(productoId);
            if (productoActualizado) {
                await checkAndSendStockAlert(productoActualizado, `tras eliminar compra ID ${idCompra} (stock revertido)`);
            }
        }
    }
    return filasEliminadas;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al eliminar físicamente la compra con ID ${idCompra}:`,
      error.message,
      error.stack
    );
    throw new CustomError(
      `Error al eliminar físicamente la compra: ${error.message}`,
      500
    );
  }
};

const anularCompra = async (idCompra) => {
    const transaction = await db.sequelize.transaction();
    try {
        const compra = await db.Compra.findByPk(idCompra, {
            include: [{
                model: db.Producto,
                as: 'productosComprados'
            }],
            transaction
        });

        if (!compra) {
            throw new NotFoundError('La compra que intentas anular no fue encontrada.');
        }

        if (compra.estado === false) {
            throw new ConflictError('Esta compra ya ha sido anulada previamente.');
        }

        for (const productoComprado of compra.productosComprados) {
            const cantidadRevertir = productoComprado.CompraXProducto.cantidad;
            const productoEnStock = await db.Producto.findByPk(productoComprado.idProducto, {
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (productoEnStock) {
                productoEnStock.existencia -= cantidadRevertir;
                await productoEnStock.save({ transaction });
            } else {
                throw new Error(`El producto con ID ${productoComprado.idProducto} no fue encontrado en el inventario durante la anulación.`);
            }
        }

        compra.estado = false;
        await compra.save({ transaction });

        await transaction.commit();
        return compra;

    } catch (error) {
        await transaction.rollback();
        if (error instanceof NotFoundError || error instanceof ConflictError) {
            throw error;
        }
        console.error(`Error al anular la compra con ID ${idCompra}:`, error.message);
        throw new CustomError(`Error al anular la compra: ${error.message}`, 500);
    }
};

const habilitarCompra = async (idCompra) => {
    return actualizarCompra(idCompra, { estado: true });
};

// --- INICIO DE LA MODIFICACIÓN ---
/**
 * Cambia el estado del proceso de una compra (Pendiente/Completado).
 * Esta acción NO afecta el stock de productos.
 * @param {number} compraId - El ID de la compra a modificar.
 * @param {string} nuevoEstadoProceso - El nuevo estado ('Pendiente' o 'Completado').
 * @returns {Promise<object>} La compra con su estado de proceso actualizado.
 */
const cambiarEstadoProceso = async (compraId, nuevoEstadoProceso) => {
  const compra = await db.Compra.findByPk(compraId);

  if (!compra) {
    throw new NotFoundError('La compra que intentas actualizar no fue encontrada.');
  }

  // No se puede cambiar el estado de proceso de una compra que ya está anulada
  if (compra.estado === false) {
    throw new ConflictError('No se puede cambiar el estado de proceso de una compra anulada.');
  }

  // Actualiza solo el campo estadoProceso
  compra.estadoProceso = nuevoEstadoProceso;
  await compra.save();

  // Devuelve la compra actualizada
  return compra;
};
// --- FIN DE LA MODIFICACIÓN ---


module.exports = {
  crearCompra,
  obtenerTodasLasCompras,
  obtenerCompraPorId,
  actualizarCompra,
  anularCompra,
  habilitarCompra,
  eliminarCompraFisica,
  cambiarEstadoProceso, // <-- Exportación de la nueva función
};