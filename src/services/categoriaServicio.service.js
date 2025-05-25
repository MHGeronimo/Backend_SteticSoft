// src/services/categoriaServicio.service.js
const db = require("../models");
const { Op } = db.Sequelize;
const { NotFoundError, ConflictError, CustomError } = require("../errors");

/**
 * Crear una nueva categoría de servicio.
 */
const crearCategoriaServicio = async (datosCategoria) => {
  const { nombre, descripcion, estado } = datosCategoria;

  const categoriaExistente = await db.CategoriaServicio.findOne({
    where: { nombre },
  });
  if (categoriaExistente) {
    throw new ConflictError(
      `La categoría de servicio con el nombre '${nombre}' ya existe.`
    );
  }

  try {
    const nuevaCategoria = await db.CategoriaServicio.create({
      nombre,
      descripcion: descripcion || null,
      estado: typeof estado === "boolean" ? estado : true,
    });
    return nuevaCategoria;
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ConflictError(
        `La categoría de servicio con el nombre '${nombre}' ya existe.`
      );
    }
    console.error("Error al crear la categoría de servicio:", error.message);
    throw new CustomError(
      `Error al crear la categoría de servicio: ${error.message}`,
      500
    );
  }
};

/**
 * Obtener todas las categorías de servicio.
 */
const obtenerTodasLasCategoriasServicio = async (opcionesDeFiltro = {}) => {
  try {
    return await db.CategoriaServicio.findAll({
      where: opcionesDeFiltro,
      order: [["nombre", "ASC"]],
    });
  } catch (error) {
    console.error(
      "Error al obtener todas las categorías de servicio:",
      error.message
    );
    throw new CustomError(
      `Error al obtener categorías de servicio: ${error.message}`,
      500
    );
  }
};

/**
 * Obtener una categoría de servicio por su ID.
 */
const obtenerCategoriaServicioPorId = async (idCategoriaServicio) => {
  try {
    const categoria = await db.CategoriaServicio.findByPk(idCategoriaServicio);
    if (!categoria) {
      throw new NotFoundError("Categoría de servicio no encontrada.");
    }
    return categoria;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al obtener la categoría de servicio con ID ${idCategoriaServicio}:`,
      error.message
    );
    throw new CustomError(
      `Error al obtener la categoría de servicio: ${error.message}`,
      500
    );
  }
};

/**
 * Actualizar una categoría de servicio existente.
 */
const actualizarCategoriaServicio = async (
  idCategoriaServicio,
  datosActualizar
) => {
  try {
    const categoria = await db.CategoriaServicio.findByPk(idCategoriaServicio);
    if (!categoria) {
      throw new NotFoundError(
        "Categoría de servicio no encontrada para actualizar."
      );
    }

    const { nombre } = datosActualizar;
    if (nombre && nombre !== categoria.nombre) {
      const categoriaConMismoNombre = await db.CategoriaServicio.findOne({
        where: {
          nombre: nombre,
          idCategoriaServicio: { [Op.ne]: idCategoriaServicio },
        },
      });
      if (categoriaConMismoNombre) {
        throw new ConflictError(
          `Ya existe otra categoría de servicio con el nombre '${nombre}'.`
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
        `Ya existe otra categoría de servicio con el nombre '${datosActualizar.nombre}'.`
      );
    }
    console.error(
      `Error al actualizar la categoría de servicio con ID ${idCategoriaServicio}:`,
      error.message
    );
    throw new CustomError(
      `Error al actualizar la categoría de servicio: ${error.message}`,
      500
    );
  }
};

/**
 * Anular una categoría de servicio (estado = false).
 */
const anularCategoriaServicio = async (idCategoriaServicio) => {
  try {
    const categoria = await db.CategoriaServicio.findByPk(idCategoriaServicio);
    if (!categoria) {
      throw new NotFoundError(
        "Categoría de servicio no encontrada para anular."
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
      `Error al anular la categoría de servicio con ID ${idCategoriaServicio}:`,
      error.message
    );
    throw new CustomError(
      `Error al anular la categoría de servicio: ${error.message}`,
      500
    );
  }
};

/**
 * Habilitar una categoría de servicio (estado = true).
 */
const habilitarCategoriaServicio = async (idCategoriaServicio) => {
  try {
    const categoria = await db.CategoriaServicio.findByPk(idCategoriaServicio);
    if (!categoria) {
      throw new NotFoundError(
        "Categoría de servicio no encontrada para habilitar."
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
      `Error al habilitar la categoría de servicio con ID ${idCategoriaServicio}:`,
      error.message
    );
    throw new CustomError(
      `Error al habilitar la categoría de servicio: ${error.message}`,
      500
    );
  }
};

/**
 * Eliminar una categoría de servicio físicamente.
 * Considerar las implicaciones con Servicios (DDL: Categoria_servicio_idCategoriaServicio INT NOT NULL REFERENCES Categoria_servicio(idCategoriaServicio) ON DELETE RESTRICT).
 */
const eliminarCategoriaServicioFisica = async (idCategoriaServicio) => {
  try {
    const categoria = await db.CategoriaServicio.findByPk(idCategoriaServicio);
    if (!categoria) {
      throw new NotFoundError(
        "Categoría de servicio no encontrada para eliminar físicamente."
      );
    }

    // La BD tiene ON DELETE RESTRICT en la FK de la tabla Servicio.
    // Si hay servicios asociados, la eliminación fallará.
    const serviciosAsociados = await db.Servicio.count({
      where: { categoriaServicioId: idCategoriaServicio },
    });
    if (serviciosAsociados > 0) {
      throw new ConflictError(
        `No se puede eliminar la categoría de servicio '${categoria.nombre}' porque tiene ${serviciosAsociados} servicio(s) asociado(s).`
      );
    }

    const filasEliminadas = await db.CategoriaServicio.destroy({
      where: { idCategoriaServicio },
    });
    return filasEliminadas;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ConflictError)
      throw error;
    if (error.name === "SequelizeForeignKeyConstraintError") {
      // Por si la verificación anterior falló o hay otra FK
      throw new ConflictError(
        "No se puede eliminar la categoría de servicio porque está siendo referenciada."
      );
    }
    console.error(
      `Error al eliminar físicamente la categoría de servicio con ID ${idCategoriaServicio}:`,
      error.message
    );
    throw new CustomError(
      `Error al eliminar físicamente la categoría de servicio: ${error.message}`,
      500
    );
  }
};

module.exports = {
  crearCategoriaServicio,
  obtenerTodasLasCategoriasServicio,
  obtenerCategoriaServicioPorId,
  actualizarCategoriaServicio,
  anularCategoriaServicio,
  habilitarCategoriaServicio,
  eliminarCategoriaServicioFisica,
};
