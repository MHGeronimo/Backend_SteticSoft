// src/services/categoriaProducto.service.js
const db = require("../models");
const { Op } = db.Sequelize;
const { NotFoundError, ConflictError, CustomError } = require("../errors"); // Ajusta la ruta si es necesario

/**
 * Crear una nueva categoría de producto.
 * @param {object} datosCategoria - Datos de la categoría ({ nombre, descripcion, vidaUtilDias, tipoUso, estado }).
 * @returns {Promise<object>} La categoría creada.
 */
const crearCategoriaProducto = async (datosCategoria) => {
  const {
    nombre,
    descripcion,
    vidaUtilDias, // Esperando camelCase
    tipoUso, // Esperando camelCase
    estado,
  } = datosCategoria;

  const categoriaExistente = await db.CategoriaProducto.findOne({
    where: { nombre },
  });
  if (categoriaExistente) {
    throw new ConflictError(
      `La categoría de producto con el nombre '${nombre}' ya existe.`
    );
  }

  try {
    const nuevaCategoria = await db.CategoriaProducto.create({
      nombre,
      descripcion: descripcion || null,
      vidaUtilDias: vidaUtilDias !== undefined ? vidaUtilDias : null, // Permite 0, pero null si no se envía
      tipoUso, // Es NOT NULL en la BD, el validador debería asegurar que venga
      estado: typeof estado === "boolean" ? estado : true,
    });
    return nuevaCategoria;
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ConflictError(
        `La categoría de producto con el nombre '${nombre}' ya existe.`
      );
    }
    if (error.name === "SequelizeValidationError") {
      // Por si el CHECK constraint de tipoUso falla a nivel de BD
      throw new CustomError(
        `Error de validación al crear categoría: ${error.message}`,
        400
      );
    }
    console.error(
      "Error al crear la categoría de producto en el servicio:",
      error.message,
      error.stack
    );
    throw new CustomError(
      `Error al crear la categoría de producto: ${error.message}`,
      500
    );
  }
};

/**
 * Obtener todas las categorías de producto.
 * @param {object} [opcionesDeFiltro={}] - Opciones para filtrar (ej. { estado: true, tipoUso: 'Interno' }).
 * @returns {Promise<Array<object>>} Lista de categorías.
 */
const obtenerTodasLasCategoriasProducto = async (opcionesDeFiltro = {}) => {
  try {
    return await db.CategoriaProducto.findAll({
      where: opcionesDeFiltro,
      order: [["nombre", "ASC"]],
    });
  } catch (error) {
    console.error(
      "Error al obtener todas las categorías de producto en el servicio:",
      error.message
    );
    throw new CustomError(
      `Error al obtener categorías de producto: ${error.message}`,
      500
    );
  }
};

/**
 * Obtener una categoría de producto por su ID.
 * @param {number} idCategoria - ID de la categoría.
 * @returns {Promise<object|null>} La categoría encontrada o null si no existe.
 */
const obtenerCategoriaProductoPorId = async (idCategoria) => {
  try {
    const categoria = await db.CategoriaProducto.findByPk(idCategoria);
    if (!categoria) {
      throw new NotFoundError("Categoría de producto no encontrada.");
    }
    return categoria;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al obtener la categoría de producto con ID ${idCategoria} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al obtener la categoría de producto: ${error.message}`,
      500
    );
  }
};

/**
 * Actualizar una categoría de producto existente.
 * @param {number} idCategoria - ID de la categoría a actualizar.
 * @param {object} datosActualizar - Datos para actualizar.
 * @returns {Promise<object>} La categoría actualizada.
 */
const actualizarCategoriaProducto = async (idCategoria, datosActualizar) => {
  try {
    const categoria = await db.CategoriaProducto.findByPk(idCategoria);
    if (!categoria) {
      throw new NotFoundError(
        "Categoría de producto no encontrada para actualizar."
      );
    }

    const { nombre } = datosActualizar; // Otros campos como descripcion, vidaUtilDias, tipoUso, estado también pueden venir

    if (nombre && nombre !== categoria.nombre) {
      const categoriaConMismoNombre = await db.CategoriaProducto.findOne({
        where: {
          nombre: nombre,
          idCategoria: { [Op.ne]: idCategoria },
        },
      });
      if (categoriaConMismoNombre) {
        throw new ConflictError(
          `Ya existe otra categoría de producto con el nombre '${nombre}'.`
        );
      }
    }

    // Asegurarse de que solo se actualicen los campos permitidos y con el formato correcto si es necesario
    // Sequelize 'update' solo actualizará los campos que estén en datosActualizar y sean atributos del modelo.
    await categoria.update(datosActualizar);
    return categoria;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ConflictError)
      throw error;
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ConflictError(
        `Ya existe otra categoría de producto con el nombre '${datosActualizar.nombre}'.`
      );
    }
    if (error.name === "SequelizeValidationError") {
      throw new CustomError(
        `Error de validación al actualizar categoría: ${error.message}`,
        400
      );
    }
    console.error(
      `Error al actualizar la categoría de producto con ID ${idCategoria} en el servicio:`,
      error.message,
      error.stack
    );
    throw new CustomError(
      `Error al actualizar la categoría de producto: ${error.message}`,
      500
    );
  }
};

/**
 * Anular una categoría de producto (estado = false).
 */
const anularCategoriaProducto = async (idCategoria) => {
  try {
    const categoria = await db.CategoriaProducto.findByPk(idCategoria);
    if (!categoria) {
      throw new NotFoundError(
        "Categoría de producto no encontrada para anular."
      );
    }
    if (!categoria.estado) {
      return categoria; // Ya está anulada
    }
    await categoria.update({ estado: false });
    return categoria;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al anular la categoría de producto con ID ${idCategoria} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al anular la categoría de producto: ${error.message}`,
      500
    );
  }
};

/**
 * Habilitar una categoría de producto (estado = true).
 */
const habilitarCategoriaProducto = async (idCategoria) => {
  try {
    const categoria = await db.CategoriaProducto.findByPk(idCategoria);
    if (!categoria) {
      throw new NotFoundError(
        "Categoría de producto no encontrada para habilitar."
      );
    }
    if (categoria.estado) {
      return categoria; // Ya está habilitada
    }
    await categoria.update({ estado: true });
    return categoria;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al habilitar la categoría de producto con ID ${idCategoria} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al habilitar la categoría de producto: ${error.message}`,
      500
    );
  }
};

/**
 * Eliminar una categoría de producto físicamente.
 * Considerar las implicaciones con Productos (DDL: ON DELETE SET NULL).
 */
const eliminarCategoriaProductoFisica = async (idCategoria) => {
  try {
    const categoria = await db.CategoriaProducto.findByPk(idCategoria);
    if (!categoria) {
      throw new NotFoundError(
        "Categoría de producto no encontrada para eliminar físicamente."
      );
    }

    const filasEliminadas = await db.CategoriaProducto.destroy({
      where: { idCategoria },
    });
    return filasEliminadas;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    // Un SequelizeForeignKeyConstraintError podría ocurrir si alguna otra tabla no contemplada
    // tiene una referencia a CategoriaProducto con ON DELETE RESTRICT.
    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ConflictError(
        "No se puede eliminar la categoría porque está siendo referenciada de una manera que impide su borrado."
      );
    }
    console.error(
      `Error al eliminar físicamente la categoría de producto con ID ${idCategoria} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al eliminar físicamente la categoría de producto: ${error.message}`,
      500
    );
  }
};

module.exports = {
  crearCategoriaProducto,
  obtenerTodasLasCategoriasProducto,
  obtenerCategoriaProductoPorId,
  actualizarCategoriaProducto,
  anularCategoriaProducto,
  habilitarCategoriaProducto,
  eliminarCategoriaProductoFisica,
};
