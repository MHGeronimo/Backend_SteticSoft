// src/services/compra.service.js
// src/services/compra.service.js
const db = require("../models");
const { Op } = db.Sequelize;

const CustomError = require('../errors/CustomError');
const NotFoundError = require('../errors/NotFoundError');
const ConflictError = require('../errors/ConflictError');
const BadRequestError = require('../errors/BadRequestError');

// ... resto de tu código de servicio ...

const TASA_IVA = 0.19; // Ejemplo, ¡haz esto configurable!

/**
 * Crear una nueva compra y sus detalles.
 */
const crearCompra = async (datosCompra) => {
  const {
    fecha,
    proveedorId,
    dashboardId,
    productos,
    estado, // Puede venir o usar default
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
    productosValidados.push({ ...item, nombre: productoDB.nombre });
    subtotalCalculado += item.cantidad * item.valorUnitario;
  }

  if (total === undefined) {
    if (iva === undefined) iva = subtotalCalculado * TASA_IVA;
    total = subtotalCalculado + iva;
  } else if (iva === undefined) {
    iva = (total / (1 + TASA_IVA)) * TASA_IVA;
  }

  const transaction = await db.sequelize.transaction();
  try {
    const nuevaCompra = await db.Compra.create(
      {
        fecha: fecha || new Date(),
        proveedorId,
        dashboardId: dashboardId || null,
        total: parseFloat(total).toFixed(2),
        iva: parseFloat(iva).toFixed(2),
        estado: typeof estado === "boolean" ? estado : true, // Manejo del nuevo campo
      },
      { transaction }
    );

    const detallesCompra = [];
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

      const productoDB = await db.Producto.findByPk(item.productoId, {
        transaction,
      });
      // Solo incrementar existencia si la compra se crea en estado activo (o según tu lógica)
      if (nuevaCompra.estado) {
        await productoDB.increment("existencia", {
          by: item.cantidad,
          transaction,
        });
      }
    }

    await transaction.commit();
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

/**
 * Obtener todas las compras.
 */
const obtenerTodasLasCompras = async (opcionesDeFiltro = {}) => {
  try {
    return await db.Compra.findAll({
      where: opcionesDeFiltro, // Ahora puedes filtrar por el nuevo campo 'estado'
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
          attributes: ["idProducto", "nombre", "precio"],
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

/**
 * Obtener una compra por su ID.
 */
const obtenerCompraPorId = async (idCompra) => {
  try {
    const compra = await db.Compra.findByPk(idCompra, {
      include: [
        { model: db.Proveedor, as: "proveedor" },
        { model: db.Dashboard, as: "dashboard" },
        {
          model: db.Producto,
          as: "productosComprados",
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

/**
 * Actualizar una compra existente (cabecera y estado).
 */
const actualizarCompra = async (idCompra, datosActualizar) => {
  const { fecha, proveedorId, dashboardId, total, iva, estado } =
    datosActualizar;
  const camposParaActualizar = {};

  if (fecha !== undefined) camposParaActualizar.fecha = fecha;
  if (total !== undefined)
    camposParaActualizar.total = parseFloat(total).toFixed(2);
  if (iva !== undefined) camposParaActualizar.iva = parseFloat(iva).toFixed(2);
  if (estado !== undefined) camposParaActualizar.estado = estado; // Para actualizar el estado

  const transaction = await db.sequelize.transaction();
  try {
    const compra = await db.Compra.findByPk(idCompra, {
      include: [
        {
          // Incluir productos para ajustar inventario si el estado cambia
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
    }

    // Lógica de ajuste de inventario si el estado de la compra cambia
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
          // Si la compra se está activando/reactivando
          await productoDB.increment("existencia", {
            by: cantidadComprada,
            transaction,
          });
        } else {
          // Si la compra se está anulando
          await productoDB.decrement("existencia", {
            by: cantidadComprada,
            transaction,
          });
        }
      }
    }

    await transaction.commit();
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

/**
 * Anular una compra (establece estado = false y ajusta inventario).
 * @param {number} idCompra - ID de la compra a anular.
 * @returns {Promise<object>} La compra anulada.
 */
const anularCompra = async (idCompra) => {
  const transaction = await db.sequelize.transaction();
  try {
    const compra = await db.Compra.findByPk(idCompra, {
      include: [
        {
          model: db.Producto,
          as: "productosComprados", // Alias para los productos
          through: {
            model: db.CompraXProducto,
            as: "detalleCompra", // Alias para la tabla de unión y sus atributos
            attributes: ["cantidad"], // Atributos que quieres de CompraXProducto
          },
        },
      ],
      transaction,
    });

    if (!compra) {
      await transaction.rollback();
      throw new NotFoundError("Compra no encontrada para anular.");
    }
    if (!compra.estado) {
      await transaction.rollback();
      return compra;
    }

    if (compra.productosComprados && compra.productosComprados.length > 0) {
      for (const productoComprado of compra.productosComprados) {
        const productoDB = await db.Producto.findByPk(
          productoComprado.idProducto,
          { transaction }
        );
        const cantidadComprada = productoComprado.detalleCompra
          ? productoComprado.detalleCompra.cantidad
          : 0;
        if (productoDB && cantidadComprada > 0) {
          await productoDB.decrement("existencia", {
            by: cantidadComprada,
            transaction,
          });
        }
      }
    }

    await compra.update({ estado: false }, { transaction });
    await transaction.commit();
    // Devolver la compra con los detalles actualizados (aunque los detalles en sí no cambian, el estado sí)
    return obtenerCompraPorId(idCompra); // Llama a la función que ya incluye los detalles bien
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al anular la compra con ID ${idCompra}:`,
      error.message,
      error.stack // Añadir stack para más info en desarrollo
    );
    throw new CustomError(`Error al anular la compra: ${error.message}`, 500);
  }
};
  

/**
 * Habilitar una compra (establece estado = true y ajusta inventario).
 * Esto es menos común para compras, usualmente una compra anulada no se "rehabilita" así.
 * Considera si esta lógica es necesaria o si una compra anulada es final.
 * Si se habilita, se asume que los productos vuelven a ingresar al inventario.
 * @param {number} idCompra - ID de la compra a habilitar.
 * @returns {Promise<object>} La compra habilitada.
 */
const habilitarCompra = async (idCompra) => {
  const transaction = await db.sequelize.transaction();
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
      throw new NotFoundError("Compra no encontrada para habilitar.");
    }
    if (compra.estado) {
      await transaction.rollback();
      return compra;
    }

    if (compra.productosComprados && compra.productosComprados.length > 0) {
      for (const productoComprado of compra.productosComprados) {
        const productoDB = await db.Producto.findByPk(
          productoComprado.idProducto,
          { transaction }
        );
        const cantidadComprada = productoComprado.detalleCompra
          ? productoComprado.detalleCompra.cantidad
          : 0;
        if (productoDB && cantidadComprada > 0) {
          await productoDB.increment("existencia", {
            by: cantidadComprada,
            transaction,
          });
        }
      }
    }

    await compra.update({ estado: true }, { transaction });
    await transaction.commit();
    return obtenerCompraPorId(idCompra);
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al habilitar la compra con ID ${idCompra}:`,
      error.message,
      error.stack
    );
    throw new CustomError(
      `Error al habilitar la compra: ${error.message}`,
      500
    );
  }
};
  

/**
 * Eliminar una compra físicamente.
 * (Mantiene la lógica de reversión de inventario de la versión anterior).
 */
const eliminarCompraFisica = async (idCompra) => {
  const transaction = await db.sequelize.transaction();
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

    if (
      compra.estado &&
      compra.productosComprados &&
      compra.productosComprados.length > 0
    ) {
      // Solo revertir si estaba activa
      for (const productoComprado of compra.productosComprados) {
        const productoDB = await db.Producto.findByPk(
          productoComprado.idProducto,
          { transaction }
        );
        const cantidadComprada = productoComprado.detalleCompra
          ? productoComprado.detalleCompra.cantidad
          : 0;
        if (productoDB && cantidadComprada > 0) {
          await productoDB.decrement("existencia", {
            by: cantidadComprada,
            transaction,
          });
        }
      }
    }

    const filasEliminadas = await db.Compra.destroy({
      where: { idCompra },
      transaction,
    });

    await transaction.commit();
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

module.exports = {
  crearCompra,
  obtenerTodasLasCompras,
  obtenerCompraPorId,
  actualizarCompra,
  anularCompra, // NUEVA FUNCIÓN
  habilitarCompra, // NUEVA FUNCIÓN
  eliminarCompraFisica,
};
