// src/services/producto.service.js
const db = require("../models");
const { Op } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors"); // Ajusta la ruta si es necesario

/**
 * Crear un nuevo producto.
 * @param {object} datosProducto - Datos del producto.
 * @returns {Promise<object>} El producto creado.
 */
const crearProducto = async (datosProducto) => {
  const {
    nombre,
    descripcion,
    existencia,
    precio,
    stockMinimo,
    stockMaximo,
    imagen,
    estado,
    categoriaProductoId, // Esperando camelCase: categoriaProductoId
  } = datosProducto;

  // Validación de stockMaximo vs stockMinimo (si ambos se proveen)
  if (
    stockMinimo !== undefined &&
    stockMaximo !== undefined &&
    Number(stockMaximo) < Number(stockMinimo)
  ) {
    throw new BadRequestError(
      "El stock máximo no puede ser menor que el stock mínimo."
    );
  }

  // Verificar si la categoría de producto existe y está activa (si se proporciona)
  if (categoriaProductoId) {
    const categoria = await db.CategoriaProducto.findOne({
      where: { idCategoria: categoriaProductoId, estado: true },
    });
    if (!categoria) {
      throw new BadRequestError(
        `La categoría de producto con ID ${categoriaProductoId} no existe o no está activa.`
      );
    }
  }

  try {
    const nuevoProducto = await db.Producto.create({
      nombre,
      descripcion: descripcion || null,
      existencia: existencia !== undefined ? Number(existencia) : 0,
      precio: precio !== undefined ? Number(precio) : 0.0,
      stockMinimo: stockMinimo !== undefined ? Number(stockMinimo) : 0,
      stockMaximo: stockMaximo !== undefined ? Number(stockMaximo) : 0,
      imagen: imagen || null,
      estado: typeof estado === "boolean" ? estado : true,
      categoriaProductoId: categoriaProductoId || null, // Se usa el atributo camelCase del modelo
    });
    return nuevoProducto;
  } catch (error) {
    // Un nombre de producto podría no ser único, depende de tus reglas de negocio.
    // Si necesitas unicidad de nombre, añade la restricción al modelo y maneja SequelizeUniqueConstraintError.
    console.error(
      "Error al crear el producto en el servicio:",
      error.message,
      error.stack
    );
    throw new CustomError(`Error al crear el producto: ${error.message}`, 500);
  }
};

/**
 * Obtener todos los productos.
 * @param {object} [opcionesDeFiltro={}] - Opciones para filtrar (ej. { estado: true, categoriaProductoId: 1 }).
 * @returns {Promise<Array<object>>} Lista de productos.
 */
const obtenerTodosLosProductos = async (opcionesDeFiltro = {}) => {
  const whereClause = { ...opcionesDeFiltro };

  // Si se quiere filtrar por un campo que en el modelo es categoriaProductoId
  // pero en la BD es categoria_producto_idcategoria
  // Sequelize lo maneja si el 'where' usa el nombre del atributo del modelo.

  try {
    return await db.Producto.findAll({
      where: whereClause,
      include: [
        {
          model: db.CategoriaProducto,
          as: "categoriaProducto", // Asegúrate que este alias coincida con tu asociación
          attributes: ["idCategoria", "nombre"], // Solo los atributos necesarios
        },
      ],
      order: [["nombre", "ASC"]],
    });
  } catch (error) {
    console.error(
      "Error al obtener todos los productos en el servicio:",
      error.message
    );
    throw new CustomError(`Error al obtener productos: ${error.message}`, 500);
  }
};

/**
 * Obtener un producto por su ID.
 * @param {number} idProducto - ID del producto.
 * @returns {Promise<object|null>} El producto encontrado o null si no existe.
 */
const obtenerProductoPorId = async (idProducto) => {
  try {
    const producto = await db.Producto.findByPk(idProducto, {
      include: [
        {
          model: db.CategoriaProducto,
          as: "categoriaProducto",
          attributes: ["idCategoria", "nombre"],
        },
      ],
    });
    if (!producto) {
      throw new NotFoundError("Producto no encontrado.");
    }
    return producto;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al obtener el producto con ID ${idProducto} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al obtener el producto: ${error.message}`,
      500
    );
  }
};

/**
 * Actualizar un producto existente.
 * @param {number} idProducto - ID del producto a actualizar.
 * @param {object} datosActualizar - Datos para actualizar.
 * @returns {Promise<object>} El producto actualizado.
 */
const actualizarProducto = async (idProducto, datosActualizar) => {
  try {
    const producto = await db.Producto.findByPk(idProducto);
    if (!producto) {
      throw new NotFoundError("Producto no encontrado para actualizar.");
    }

    const { stockMinimo, stockMaximo, categoriaProductoId } = datosActualizar;

    // Validación de stockMaximo vs stockMinimo
    const valStockMinimo =
      stockMinimo !== undefined ? Number(stockMinimo) : producto.stockMinimo;
    const valStockMaximo =
      stockMaximo !== undefined ? Number(stockMaximo) : producto.stockMaximo;

    if (valStockMaximo < valStockMinimo) {
      throw new BadRequestError(
        "El stock máximo no puede ser menor que el stock mínimo."
      );
    }

    // Verificar si la categoría de producto existe y está activa (si se proporciona y cambia)
    if (
      categoriaProductoId !== undefined &&
      categoriaProductoId !== producto.categoriaProductoId
    ) {
      if (categoriaProductoId === null) {
        // Permitir desasociar
        datosActualizar.categoriaProductoId = null;
      } else {
        const categoria = await db.CategoriaProducto.findOne({
          where: { idCategoria: categoriaProductoId, estado: true },
        });
        if (!categoria) {
          throw new BadRequestError(
            `La categoría de producto con ID ${categoriaProductoId} no existe o no está activa.`
          );
        }
      }
    }

    await producto.update(datosActualizar); // Sequelize mapea atributos camelCase del modelo
    // Recargar para obtener la categoría actualizada si cambió
    return obtenerProductoPorId(producto.idProducto);
  } catch (error) {
    if (
      error instanceof NotFoundError ||
      error instanceof BadRequestError ||
      error instanceof ConflictError
    )
      throw error;
    console.error(
      `Error al actualizar el producto con ID ${idProducto} en el servicio:`,
      error.message,
      error.stack
    );
    throw new CustomError(
      `Error al actualizar el producto: ${error.message}`,
      500
    );
  }
};

/**
 * Anular un producto (estado = false).
 */
const anularProducto = async (idProducto) => {
  try {
    const producto = await db.Producto.findByPk(idProducto);
    if (!producto) {
      throw new NotFoundError("Producto no encontrado para anular.");
    }
    if (!producto.estado) {
      return producto; // Ya está anulado
    }
    await producto.update({ estado: false });
    return producto;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al anular el producto con ID ${idProducto} en el servicio:`,
      error.message
    );
    throw new CustomError(`Error al anular el producto: ${error.message}`, 500);
  }
};

/**
 * Habilitar un producto (estado = true).
 */
const habilitarProducto = async (idProducto) => {
  try {
    const producto = await db.Producto.findByPk(idProducto);
    if (!producto) {
      throw new NotFoundError("Producto no encontrado para habilitar.");
    }
    if (producto.estado) {
      return producto; // Ya está habilitado
    }
    await producto.update({ estado: true });
    return producto;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al habilitar el producto con ID ${idProducto} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al habilitar el producto: ${error.message}`,
      500
    );
  }
};

/**
 * Eliminar un producto físicamente.
 * DDL: Categoria_producto_idCategoria ON DELETE SET NULL
 * DDL: Abastecimiento.Producto_idProducto ON DELETE RESTRICT
 * DDL: CompraXProducto.Producto_idProducto ON DELETE RESTRICT
 * DDL: ProductoXVenta.Producto_idProducto ON DELETE RESTRICT
 */
const eliminarProductoFisico = async (idProducto) => {
  try {
    const producto = await db.Producto.findByPk(idProducto);
    if (!producto) {
      throw new NotFoundError(
        "Producto no encontrado para eliminar físicamente."
      );
    }

    // La BD tiene ON DELETE RESTRICT en Abastecimiento, CompraXProducto, ProductoXVenta.
    // Si hay registros asociados en estas tablas, la eliminación fallará a nivel de BD.
    // El servicio lo capturará como SequelizeForeignKeyConstraintError.

    const filasEliminadas = await db.Producto.destroy({
      where: { idProducto },
    });
    return filasEliminadas;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ConflictError(
        "No se puede eliminar el producto porque está siendo referenciado en abastecimientos, compras o ventas. Considere anularlo en su lugar."
      );
    }
    console.error(
      `Error al eliminar físicamente el producto con ID ${idProducto} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al eliminar físicamente el producto: ${error.message}`,
      500
    );
  }
};

module.exports = {
  crearProducto,
  obtenerTodosLosProductos,
  obtenerProductoPorId,
  actualizarProducto,
  anularProducto,
  habilitarProducto,
  eliminarProductoFisico,
};
