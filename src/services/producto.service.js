// RUTA: src/shared/src_api/services/producto.service.js
const db = require("../models");
const { Op } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors");

/**
 * Helper interno para cambiar el estado de un producto.
 */
const cambiarEstadoProducto = async (idProducto, nuevoEstado) => {
  const producto = await db.Producto.findByPk(idProducto);
  if (!producto) {
    throw new NotFoundError("Producto no encontrado para cambiar estado.");
  }
  if (producto.estado === nuevoEstado) {
    return producto;
  }
  await producto.update({ estado: nuevoEstado });
  return producto;
};

/**
 * Crear un nuevo producto.
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
    categoriaProductoId,
  } = datosProducto;

  if (
    stockMinimo !== undefined &&
    stockMaximo !== undefined &&
    Number(stockMaximo) < Number(stockMinimo)
  ) {
    throw new BadRequestError(
      "El stock máximo no puede ser menor que el stock mínimo."
    );
  }

  if (categoriaProductoId) {
    const categoria = await db.CategoriaProducto.findOne({
      where: { idCategoriaProducto: categoriaProductoId, estado: true },
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
      categoriaProductoId: categoriaProductoId || null,
    });
    return nuevoProducto;
  } catch (error) {
    console.error("Error inesperado al crear producto:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    throw new CustomError(
      "Ocurrió un error inesperado en el servicio de productos.",
      500
    );
  }
};

// RUTA: src/shared/src_api/services/producto.service.js

// ... (mantén las importaciones y la función cambiarEstadoProducto igual)

const obtenerTodosLosProductos = async (filtros) => {
  const {
    page = 1,
    limit = 10,
    nombre,
    estado,
    idCategoria,
    tipoUso, // El filtro se recibe aquí
  } = filtros;

  const offset = (page - 1) * limit;

  let whereCondition = {};
  if (nombre) {
    whereCondition.nombre = { [Op.iLike]: `%${nombre}%` };
  }
  if (estado !== undefined) {
    whereCondition.estado = estado === "true";
  }
  if (idCategoria) {
    whereCondition.categoriaProductoId = idCategoria;
  }
  // ✅ CORRECCIÓN: El filtro para tipoUso ahora es más simple y robusto.
  if (tipoUso) {
    whereCondition.tipoUso = tipoUso;
  }

  // ✅ CORRECCIÓN CLAVE: La condición 'include' ahora coincide perfectamente
  // con la asociación definida en el modelo.
  let includeCondition = [
    {
      model: db.CategoriaProducto,
      as: "categoria", // Este alias 'categoria' DEBE coincidir con el del modelo
      attributes: ["idCategoriaProducto", "nombre", "vidaUtilDias", "tipoUso"],
    },
  ];

  try {
    const { count, rows } = await db.Producto.findAndCountAll({
      where: whereCondition,
      include: includeCondition,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["nombre", "ASC"]],
    });

    return {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      productos: rows,
    };
  } catch (error) {
    console.error("Error inesperado al obtener productos:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    throw new CustomError(
      "Ocurrió un error inesperado al obtener productos.",
      500
    );
  }
};

const obtenerProductoPorId = async (idProducto) => {
  try {
    const producto = await db.Producto.findByPk(idProducto, {
      include: [
        {
          model: db.CategoriaProducto,
          as: "categoria",
          attributes: ["idCategoriaProducto", "nombre"],
        },
      ],
    });
    if (!producto) {
      throw new NotFoundError("Producto no encontrado.");
    }
    return producto;
  } catch (error) {
    console.error("Error inesperado al obtener producto por ID:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    if (error instanceof NotFoundError) throw error;
    throw new CustomError(
      "Ocurrió un error inesperado al obtener el producto.",
      500
    );
  }
};

/**
 * Actualizar un producto existente.
 */
const actualizarProducto = async (idProducto, datosActualizar) => {
  try {
    const producto = await db.Producto.findByPk(idProducto);
    if (!producto) {
      throw new NotFoundError("Producto no encontrado para actualizar.");
    }

    const { stockMinimo, stockMaximo, categoriaProductoId } = datosActualizar;

    const valStockMinimo =
      stockMinimo !== undefined ? Number(stockMinimo) : producto.stockMinimo;
    const valStockMaximo =
      stockMaximo !== undefined ? Number(stockMaximo) : producto.stockMaximo;

    if (valStockMaximo < valStockMinimo) {
      throw new BadRequestError(
        "El stock máximo no puede ser menor que el stock mínimo."
      );
    }

    if (
      categoriaProductoId !== undefined &&
      categoriaProductoId !== producto.categoriaProductoId
    ) {
      if (categoriaProductoId === null) {
        datosActualizar.categoriaProductoId = null;
      } else {
        const categoria = await db.CategoriaProducto.findOne({
          where: { idCategoriaProducto: categoriaProductoId, estado: true },
        });
        if (!categoria) {
          throw new BadRequestError(
            `La categoría de producto con ID ${categoriaProductoId} no existe o no está activa.`
          );
        }
      }
    }

    await producto.update(datosActualizar);
    return obtenerProductoPorId(producto.idProducto);
  } catch (error) {
    console.error("Error inesperado al actualizar producto:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    if (
      error instanceof NotFoundError ||
      error instanceof BadRequestError ||
      error instanceof ConflictError
    )
      throw error;
    throw new CustomError(
      "Ocurrió un error inesperado al actualizar el producto.",
      500
    );
  }
};

/**
 * Anular un producto (estado = false).
 */
const anularProducto = async (idProducto) => {
  try {
    return await cambiarEstadoProducto(idProducto, false);
  } catch (error) {
    console.error("Error inesperado al anular producto:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    if (error instanceof NotFoundError) throw error;
    throw new CustomError("Ocurrió un error al anular el producto.", 500);
  }
};

/**
 * Habilitar un producto (estado = true).
 */
const habilitarProducto = async (idProducto) => {
  try {
    return await cambiarEstadoProducto(idProducto, true);
  } catch (error) {
    console.error("Error inesperado al habilitar producto:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    if (error instanceof NotFoundError) throw error;
    throw new CustomError("Ocurrió un error al habilitar el producto.", 500);
  }
};

/**
 * Eliminar un producto físicamente.
 */
const eliminarProductoFisico = async (idProducto) => {
  try {
    const producto = await db.Producto.findByPk(idProducto);
    if (!producto) {
      throw new NotFoundError(
        "Producto no encontrado para eliminar físicamente."
      );
    }

    const filasEliminadas = await db.Producto.destroy({
      where: { idProducto },
    });
    return filasEliminadas;
  } catch (error) {
    console.error("Error inesperado al eliminar producto físicamente:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    if (error instanceof NotFoundError) throw error;

    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ConflictError(
        "No se puede eliminar el producto porque está siendo referenciado. Considere anularlo."
      );
    }

    throw new CustomError(
      "Ocurrió un error inesperado al eliminar el producto.",
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
  cambiarEstadoProducto,
};
