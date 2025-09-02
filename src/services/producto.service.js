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
// RUTA: src/shared/src_api/services/producto.service.js

/**
 * Crear un nuevo producto.
 */
const crearProducto = async (datosProducto) => {
  // ✅ CORRECCIÓN: Añadimos 'tipoUso' y 'vidaUtilDias' a la desestructuración
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
    tipoUso,       // <-- Campo añadido
    vidaUtilDias,  // <-- Campo añadido
  } = datosProducto;

  // ... (la lógica de validación de stock y categoría se mantiene igual)

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
      // ✅ CORRECCIÓN: Pasamos los nuevos campos al método de creación
      tipoUso: ["Interno", "Externo"].includes(tipoUso) ? tipoUso : "Externo",
      vidaUtilDias: vidaUtilDias || null,
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

const obtenerTodosLosProductos = async (filtros) => {
  const {
    page = 1,
    limit = 10,
    search, 
    estado,
    idCategoria,
    tipoUso,
  } = filtros;

  const offset = (page - 1) * limit;

  let whereCondition = {};

  if (search) {
    whereCondition[Op.or] = [
      { nombre: { [Op.iLike]: `%${search}%` } },
      { descripcion: { [Op.iLike]: `%${search}%` } },
      // ✅ --- INICIO DE LA CORRECCIÓN ---
      // Se agregan las columnas adicionales a la búsqueda.
      // Para buscar en campos numéricos (como precio y existencia),
      // los convertimos a texto dentro de la consulta.
      db.sequelize.literal(`"Producto"."precio"::text ILIKE '%${search}%'`),
      db.sequelize.literal(`"Producto"."existencia"::text ILIKE '%${search}%'`),
      // --- FIN DE LA CORRECIÓN ---
    ];
  }

  if (estado !== undefined) {
  if (estado === "true" || estado === "false") {
    whereCondition.estado = estado === "true";
  } else if (estado === "Activo") {
    whereCondition.estado = true;
  } else if (estado === "Inactivo") {
    whereCondition.estado = false;
  }
}

  if (idCategoria) {
    whereCondition.categoriaProductoId = idCategoria;
  }
  if (tipoUso) {
    whereCondition.tipoUso = tipoUso;
  }

  let includeCondition = [
    {
      model: db.CategoriaProducto,
      as: "categoria",
      required: false,
    },
  ];

  try {
    const { count, rows } = await db.Producto.findAndCountAll({
      where: whereCondition,
      include: includeCondition,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["nombre", "ASC"]],
      distinct: true,
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
      `Ocurrió un error inesperado al obtener productos: ${error.message}`,
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

/**
 * Obtener todos los productos activos para uso interno.
 */
const obtenerProductosInternos = async () => {
  try {
    const productos = await db.Producto.findAll({
      where: {
        tipoUso: "Interno",
        estado: true,
      },
      include: [
        {
          model: db.CategoriaProducto,
          as: "categoria",
          required: false,
        },
      ],
      order: [["nombre", "ASC"]],
    });
    return productos;
  } catch (error) {
    console.error("Error inesperado al obtener productos internos:", {
      message: error.message,
      stack: error.stack,
    });
    throw new CustomError(
      "Ocurrió un error inesperado al obtener los productos para abastecimiento.",
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
  obtenerProductosInternos,
};
