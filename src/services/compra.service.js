// src/shared/src_api/services/compra.service.js

const db = require("../models");
const { Op } = require("sequelize");
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors");
const { checkAndSendStockAlert } = require('../utils/stockAlertHelper.js');

const TASA_IVA = 0.19;

// MEJORA GLOBAL: Se crea una configuración de 'include' reutilizable para mantener la consistencia
// y evitar errores de alias en todas las funciones. El alias correcto 'productos' se define una sola vez.
const compraInclude = [
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
    as: "productos", // CORRECCIÓN CLAVE: Alias unificado a 'productos'
    attributes: ["idProducto", "nombre", "precio", "stockMinimo", "existencia"],
    through: {
      model: db.CompraXProducto,
      as: "detalleCompra",
      attributes: ["cantidad", "valorUnitario"],
    },
  },
];

/**
 * Crear una nueva compra y sus detalles.
 * Se mantiene tu lógica de validación robusta.
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

  const proveedor = await db.Proveedor.findOne({ where: { idProveedor: proveedorId, estado: true } });
  if (!proveedor) {
    throw new BadRequestError(`Proveedor con ID ${proveedorId} no encontrado o inactivo.`);
  }

  if (dashboardId) {
    const dashboard = await db.Dashboard.findByPk(dashboardId);
    if (!dashboard) {
      throw new BadRequestError(`Dashboard con ID ${dashboardId} no encontrado.`);
    }
  }

  let subtotalCalculado = 0;
  const productosValidados = [];
  for (const item of productos) {
    const productoDB = await db.Producto.findByPk(item.productoId);
    if (!productoDB) throw new BadRequestError(`Producto con ID ${item.productoId} no encontrado.`);
    if (!productoDB.estado) throw new BadRequestError(`Producto '${productoDB.nombre}' (ID: ${item.productoId}) no está activo.`);
    productosValidados.push(item);
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
  try {
    const nuevaCompra = await db.Compra.create({
      fecha: fecha || new Date(),
      proveedorId,
      dashboardId: dashboardId || null,
      total: parseFloat(total).toFixed(2),
      iva: parseFloat(iva).toFixed(2),
      estado: estadoCompra,
    }, { transaction });

    const detallesCompra = [];
    const productosAfectadosParaAlerta = new Set();

    for (const item of productosValidados) {
      const detalle = await db.CompraXProducto.create({
        compraId: nuevaCompra.idCompra,
        productoId: item.productoId,
        cantidad: item.cantidad,
        valorUnitario: parseFloat(item.valorUnitario).toFixed(2),
      }, { transaction });
      detallesCompra.push(detalle);

      if (estadoCompra) {
        const productoDB = await db.Producto.findByPk(item.productoId, { transaction });
        await productoDB.increment("existencia", { by: item.cantidad, transaction });
        productosAfectadosParaAlerta.add(productoDB.idProducto);
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
    console.error("Error al crear la compra en el servicio:", error.message, error.stack);
    throw new CustomError(`Error al crear la compra: ${error.message}`, 500);
  }
};

/**
 * Obtiene todas las compras.
 * CORREGIDO: Usa la constante 'compraInclude' con el alias correcto.
 */
const obtenerTodasLasCompras = async (opcionesDeFiltro = {}) => {
  try {
    return await db.Compra.findAll({
      where: opcionesDeFiltro,
      include: compraInclude,
      order: [["fecha", "DESC"], ["idCompra", "DESC"]],
    });
  } catch (error) {
    console.error("Error al obtener todas las compras:", error.message, error.stack);
    throw new CustomError(`Error al obtener compras: ${error.message}`, 500);
  }
};

/**
 * Obtiene una compra por su ID.
 * CORREGIDO: Usa la constante 'compraInclude' con el alias correcto.
 */
const obtenerCompraPorId = async (idCompra) => {
  try {
    const compra = await db.Compra.findByPk(idCompra, {
      include: compraInclude,
    });
    if (!compra) {
      throw new NotFoundError("Compra no encontrada.");
    }
    return compra;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(`Error al obtener la compra con ID ${idCompra}:`, error.message, error.stack);
    throw new CustomError(`Error al obtener la compra: ${error.message}`, 500);
  }
};

/**
 * Actualiza una compra.
 * CORREGIDO: Usa el alias correcto 'productos' al hacer la consulta.
 */
const actualizarCompra = async (idCompra, datosActualizar) => {
  const { fecha, proveedorId, dashboardId, total, iva, estado } = datosActualizar;
  const camposParaActualizar = {};

  if (fecha !== undefined) camposParaActualizar.fecha = fecha;
  if (total !== undefined) camposParaActualizar.total = parseFloat(total).toFixed(2);
  if (iva !== undefined) camposParaActualizar.iva = parseFloat(iva).toFixed(2);
  if (estado !== undefined) camposParaActualizar.estado = estado;

  const transaction = await db.sequelize.transaction();
  const productosAfectadosParaAlerta = new Set();
  try {
    const compra = await db.Compra.findByPk(idCompra, {
      include: [{ model: db.Producto, as: "productos" }], // CORRECCIÓN DIRECTA DEL ALIAS
      transaction,
    });
    if (!compra) {
      await transaction.rollback();
      throw new NotFoundError("Compra no encontrada para actualizar.");
    }

    const estadoOriginal = compra.estado;

    if (proveedorId !== undefined && proveedorId !== compra.proveedorId) {
      const proveedor = await db.Proveedor.findOne({ where: { idProveedor: proveedorId, estado: true }, transaction });
      if (!proveedor) {
        await transaction.rollback();
        throw new BadRequestError(`Proveedor con ID ${proveedorId} no encontrado o inactivo.`);
      }
      camposParaActualizar.proveedorId = proveedorId;
    }
    
    // ... (otras validaciones que tenías)

    if (Object.keys(camposParaActualizar).length > 0) {
      await compra.update(camposParaActualizar, { transaction });
      if (camposParaActualizar.estado !== undefined) {
        compra.estado = camposParaActualizar.estado;
      }
    }

    if (datosActualizar.hasOwnProperty("estado") && estadoOriginal !== compra.estado) {
      for (const productoComprado of compra.productos) { // CORRECCIÓN: Itera sobre 'productos'
        const productoDB = await db.Producto.findByPk(productoComprado.idProducto, { transaction });
        const detalleCompra = await db.CompraXProducto.findOne({ where: { compraId: idCompra, productoId: productoComprado.idProducto }, transaction });
        const cantidadComprada = detalleCompra.cantidad;

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
    if (error instanceof NotFoundError || error instanceof BadRequestError) throw error;
    console.error(`Error al actualizar la compra con ID ${idCompra}:`, error.message, error.stack);
    throw new CustomError(`Error al actualizar la compra: ${error.message}`, 500);
  }
};

/**
 * Elimina una compra físicamente.
 * CORREGIDO: Usa el alias correcto 'productos'.
 */
const eliminarCompraFisica = async (idCompra) => {
  const transaction = await db.sequelize.transaction();
  try {
    const compra = await db.Compra.findByPk(idCompra, {
      include: [{ model: db.Producto, as: "productos" }], // CORRECCIÓN DIRECTA DEL ALIAS
      transaction,
    });

    if (!compra) {
      await transaction.rollback();
      throw new NotFoundError("Compra no encontrada para eliminar.");
    }

    if (compra.estado && compra.productos && compra.productos.length > 0) {
      const productosAfectadosParaAlerta = new Set();
      for (const productoComprado of compra.productos) {
        const detalle = await db.CompraXProducto.findOne({ where: { compraId: idCompra, productoId: productoComprado.idProducto }, transaction });
        if(detalle) {
            const productoDB = await db.Producto.findByPk(productoComprado.idProducto, { transaction });
            await productoDB.decrement("existencia", { by: detalle.cantidad, transaction });
            productosAfectadosParaAlerta.add(productoDB.idProducto);
        }
      }
      // Alertas de stock después de la transacción
      await transaction.commit(); // Commit antes de las alertas
      for (const productoId of productosAfectadosParaAlerta) {
        const productoActualizado = await db.Producto.findByPk(productoId);
        if (productoActualizado) {
          await checkAndSendStockAlert(productoActualizado, `tras eliminar compra ID ${idCompra}`);
        }
      }
    } else {
        await transaction.commit(); // Commit aunque no se revierta stock
    }

    // Se realiza la eliminación fuera de la transacción de stock para evitar problemas.
    const filasEliminadas = await db.Compra.destroy({ where: { idCompra } });
    
    return filasEliminadas;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError) throw error;
    console.error(`Error al eliminar físicamente la compra con ID ${idCompra}:`, error.message, error.stack);
    throw new CustomError(`Error al eliminar físicamente la compra: ${error.message}`, 500);
  }
};


/**
 * Anula una compra (cambia su estado a inactivo).
 * CORREGIDO: Usa el alias correcto y es más seguro.
 */
const anularCompra = async (idCompra) => {
  const transaction = await db.sequelize.transaction();
  try {
    const compra = await db.Compra.findByPk(idCompra, {
      include: [{ model: db.Producto, as: 'productos' }], // CORRECCIÓN: Usar alias 'productos'
      transaction
    });

    if (!compra) {
      throw new NotFoundError('La compra que intentas anular no fue encontrada.');
    }
    if (compra.estado === false) {
      throw new ConflictError('Esta compra ya ha sido anulada previamente.');
    }

    const productosAfectadosParaAlerta = new Set();
    
    for (const productoComprado of compra.productos) {
      const detalle = await db.CompraXProducto.findOne({ where: { compraId: idCompra, productoId: productoComprado.idProducto }, transaction });
      const cantidadRevertir = detalle?.cantidad; // MEJORA: Optional chaining

      if (cantidadRevertir > 0) {
        const productoEnStock = await db.Producto.findByPk(productoComprado.idProducto, { transaction, lock: transaction.LOCK.UPDATE });
        if (productoEnStock) {
          await productoEnStock.decrement("existencia", { by: cantidadRevertir, transaction });
          productosAfectadosParaAlerta.add(productoEnStock.idProducto);
        } else {
          throw new Error(`El producto con ID ${productoComprado.idProducto} no fue encontrado durante la anulación.`);
        }
      }
    }

    compra.estado = false;
    await compra.save({ transaction });
    await transaction.commit();

    for (const productoId of productosAfectadosParaAlerta) {
      const productoActualizado = await db.Producto.findByPk(productoId);
      if (productoActualizado) {
        await checkAndSendStockAlert(productoActualizado, `tras anulación de compra ID ${idCompra}`);
      }
    }

    return compra;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError || error instanceof ConflictError) {
      throw error;
    }
    console.error(`Error al anular la compra con ID ${idCompra}:`, error.message, error.stack);
    throw new CustomError(`Error al anular la compra: ${error.message}`, 500);
  }
};

/**
 * Habilita una compra que fue anulada.
 */
const habilitarCompra = async (idCompra) => {
  return actualizarCompra(idCompra, { estado: true });
};

// Se exportan todas las funciones originales de tu archivo.
module.exports = {
  crearCompra,
  obtenerTodasLasCompras,
  obtenerCompraPorId,
  actualizarCompra,
  anularCompra,
  habilitarCompra,
  eliminarCompraFisica,
};