// src/services/categoriaProducto.service.js
const db = require("../models");
const { Op } = db.Sequelize;
const { NotFoundError, ConflictError, CustomError } = require("../errors");

/**
 * Helper interno para cambiar el estado de una categoría de producto.
 * @param {number} idCategoria - ID de la categoría.
 * @param {boolean} nuevoEstado - El nuevo estado (true para habilitar, false para anular).
 * @returns {Promise<object>} La categoría con el estado cambiado.
 */
const cambiarEstadoCategoriaProducto = async (idCategoria, nuevoEstado) => {
  const categoria = await db.CategoriaProducto.findByPk(idCategoria);
  if (!categoria) {
    throw new NotFoundError(
      "Categoría de producto no encontrada para cambiar estado."
    );
  }
  if (categoria.estado === nuevoEstado) {
    return categoria; // Ya está en el estado deseado
  }
  await categoria.update({ estado: nuevoEstado });
  return categoria;
};

/**
 * Crear una nueva categoría de producto.
 */
const crearCategoriaProducto = async (datosCategoria) => {
  const {
    nombre,
    descripcion,
    vidaUtilDias,
    tipoUso,
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
      vidaUtilDias: vidaUtilDias !== undefined ? vidaUtilDias : null,
      tipoUso,
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
 */
const actualizarCategoriaProducto = async (idCategoria, datosActualizar) => {
  try {
    const categoria = await db.CategoriaProducto.findByPk(idCategoria);
    if (!categoria) {
      throw new NotFoundError(
        "Categoría de producto no encontrada para actualizar."
      );
    }

    const { nombre } = datosActualizar;

    if (nombre && nombre !== categoria.nombre) {
      const categoriaConMismoNombre = await db.CategoriaProducto.findOne({
        where: {
          nombre: nombre,
          // CAMBIO CLAVE: Referenciar la columna correcta 'idCategoriaProducto'
          idCategoriaProducto: { [Op.ne]: idCategoria },
        },
      });
      if (categoriaConMismoNombre) {
        throw new ConflictError(
          `Ya existe otra categoría de producto con el nombre '${nombre}'.`
        );
      }
    }
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
    return await cambiarEstadoCategoriaProducto(idCategoria, false);
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
    return await cambiarEstadoCategoriaProducto(idCategoria, true);
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
      // CAMBIO CLAVE: Referenciar la columna correcta 'idCategoriaProducto'
      where: { idCategoriaProducto: idCategoria },
    });
    return filasEliminadas;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
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
  cambiarEstadoCategoriaProducto,
};