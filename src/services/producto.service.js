// src/services/producto.service.js
const db = require("../models");
const { Op } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors");
// No se necesita stockAlertHelper aquí, ya que el estado del producto no afecta directamente el stock.

/**
 * Helper interno para cambiar el estado de un producto.
 * @param {number} idProducto - ID del producto.
 * @param {boolean} nuevoEstado - El nuevo estado (true para habilitar, false para anular).
 * @returns {Promise<object>} El producto con el estado cambiado.
 */
const cambiarEstadoProducto = async (idProducto, nuevoEstado) => {
  const producto = await db.Producto.findByPk(idProducto);
  if (!producto) {
    throw new NotFoundError("Producto no encontrado para cambiar estado.");
  }
  if (producto.estado === nuevoEstado) {
    return producto; // Ya está en el estado deseado
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
      where: { idCategoriaProducto: categoriaProductoId, estado: true }, // Corregido: idCategoria a idCategoriaProducto
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
 */
const obtenerTodosLosProductos = async (filtros = {}) => {
  // 1. Añadimos 'tipoUso' a los filtros que podemos recibir.
  const { estado, categoriaId, tipoUso, busqueda } = filtros;
  
  const where = {};
  if (estado !== undefined) { // Usar undefined para verificar si el filtro existe
    where.estado = estado; // El controlador ya convierte a booleano
  }
  if (busqueda) {
    where.nombre = { [Op.iLike]: `%${busqueda}%` };
  }

  // 2. Creamos una opción de 'include' para poder filtrar por el modelo asociado.
  const includeOptions = [
    {
      model: db.CategoriaProducto, // Corregido: Usar db.CategoriaProducto
      as: "categoria", // Corregido: Alias definido en Producto.model.js
      attributes: ["idCategoriaProducto", "nombre", "tipoUso"], // Atributos a traer
      required: false, // Usar required: false para LEFT JOIN y poder filtrar incluso si no tienen categoría
      where: {} // Objeto 'where' para la categoría
    },
  ];

  // 3. Si se proporciona 'categoriaId', lo aplicamos al 'where' del include
  if (categoriaId) {
    includeOptions[0].where.idCategoriaProducto = categoriaId; // Corregido: idCategoria a idCategoriaProducto
  }
  // 3. Si se proporciona 'tipoUso', lo aplicamos al 'where' del include de la categoría.
  if (tipoUso) {
    includeOptions[0].where.tipoUso = tipoUso;
  }

  const { count, rows } = await db.Producto.findAndCountAll({ // Corregido: Usar db.Producto
    where,
    include: includeOptions, // 4. Aplicamos el 'include' con el filtro.
    order: [["nombre", "ASC"]],
  });
  
  return { data: rows, total: count };
};

/**
 * Obtener un producto por su ID.
 */
const obtenerProductoPorId = async (idProducto) => {
  try {
    const producto = await db.Producto.findByPk(idProducto, {
      include: [
        {
          model: db.CategoriaProducto,
          as: "categoria", // Corregido: 'categoria' es el alias en Producto.model.js
          attributes: ["idCategoriaProducto", "nombre"], // Corregido: idCategoria a idCategoriaProducto
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
          where: { idCategoriaProducto: categoriaProductoId, estado: true }, // Corregido: idCategoria a idCategoriaProducto
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
    return await cambiarEstadoProducto(idProducto, false);
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
    return await cambiarEstadoProducto(idProducto, true);
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
  cambiarEstadoProducto, // Exportar la nueva función
};