// src/services/especialidad.service.js
const db = require("../models");
const { Op } = db.Sequelize;
const { NotFoundError, ConflictError, CustomError } = require("../errors");

/**
 * Crear una nueva especialidad.
 */
const crearEspecialidad = async (datosEspecialidad) => {
  const { nombre, descripcion, estado } = datosEspecialidad;

  const especialidadExistente = await db.Especialidad.findOne({
    where: { nombre },
  });
  if (especialidadExistente) {
    throw new ConflictError(
      `La especialidad con el nombre '${nombre}' ya existe.`
    );
  }

  try {
    const nuevaEspecialidad = await db.Especialidad.create({
      nombre,
      descripcion,
      estado: typeof estado === "boolean" ? estado : true,
    });
    return nuevaEspecialidad;
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ConflictError(
        `La especialidad con el nombre '${nombre}' ya existe.`
      );
    }
    console.error(
      "Error al crear la especialidad en el servicio:",
      error.message
    );
    throw new CustomError(
      `Error al crear la especialidad: ${error.message}`,
      500
    );
  }
};

/**
 * Obtener todas las especialidades.
 */
const obtenerTodasLasEspecialidades = async (opcionesDeFiltro = {}) => {
  try {
    return await db.Especialidad.findAll({
      where: opcionesDeFiltro,
      order: [["nombre", "ASC"]],
    });
  } catch (error) {
    console.error(
      "Error al obtener todas las especialidades en el servicio:",
      error.message
    );
    throw new CustomError(
      `Error al obtener especialidades: ${error.message}`,
      500
    );
  }
};

/**
 * Obtener una especialidad por su ID.
 */
const obtenerEspecialidadPorId = async (idEspecialidad) => {
  try {
    const especialidad = await db.Especialidad.findByPk(idEspecialidad);
    if (!especialidad) {
      throw new NotFoundError("Especialidad no encontrada.");
    }
    return especialidad;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al obtener la especialidad con ID ${idEspecialidad} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al obtener la especialidad: ${error.message}`,
      500
    );
  }
};

/**
 * Actualizar una especialidad existente.
 */
const actualizarEspecialidad = async (idEspecialidad, datosActualizar) => {
  const { nombre, descripcion, estado } = datosActualizar;
  try {
    const especialidad = await db.Especialidad.findByPk(idEspecialidad);
    if (!especialidad) {
      throw new NotFoundError("Especialidad no encontrada para actualizar.");
    }

    if (nombre && nombre !== especialidad.nombre) {
      const especialidadConMismoNombre = await db.Especialidad.findOne({
        where: {
          nombre: nombre,
          idEspecialidad: { [Op.ne]: idEspecialidad },
        },
      });
      if (especialidadConMismoNombre) {
        throw new ConflictError(
          `Ya existe otra especialidad con el nombre '${nombre}'.`
        );
      }
    }

    // Construir objeto con solo los campos que se quieren actualizar
    const camposAActualizar = {};
    if (nombre !== undefined) camposAActualizar.nombre = nombre;
    if (descripcion !== undefined) camposAActualizar.descripcion = descripcion;
    if (estado !== undefined) camposAActualizar.estado = estado;

    if (Object.keys(camposAActualizar).length === 0) {
      return especialidad; // No hay nada que actualizar
    }

    await especialidad.update(camposAActualizar);
    return especialidad;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ConflictError)
      throw error;
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ConflictError(
        `Ya existe otra especialidad con el nombre '${nombre}'.`
      );
    }
    console.error(
      `Error al actualizar la especialidad con ID ${idEspecialidad} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al actualizar la especialidad: ${error.message}`,
      500
    );
  }
};

/**
 * Anular una especialidad (estado = false).
 */
const anularEspecialidad = async (idEspecialidad) => {
  try {
    const especialidad = await db.Especialidad.findByPk(idEspecialidad);
    if (!especialidad) {
      throw new NotFoundError("Especialidad no encontrada para anular.");
    }
    if (!especialidad.estado) {
      return especialidad; // Ya está anulada
    }
    await especialidad.update({ estado: false });
    return especialidad;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al anular la especialidad con ID ${idEspecialidad} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al anular la especialidad: ${error.message}`,
      500
    );
  }
};

/**
 * Habilitar una especialidad (estado = true).
 */
const habilitarEspecialidad = async (idEspecialidad) => {
  try {
    const especialidad = await db.Especialidad.findByPk(idEspecialidad);
    if (!especialidad) {
      throw new NotFoundError("Especialidad no encontrada para habilitar.");
    }
    if (especialidad.estado) {
      return especialidad; // Ya está habilitada
    }
    await especialidad.update({ estado: true });
    return especialidad;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al habilitar la especialidad con ID ${idEspecialidad} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al habilitar la especialidad: ${error.message}`,
      500
    );
  }
};

/**
 * Eliminar una especialidad físicamente.
 * Considerar las implicaciones en EmpleadoEspecialidad (ON DELETE CASCADE) y Servicio (ON DELETE SET NULL).
 */
const eliminarEspecialidadFisica = async (idEspecialidad) => {
  try {
    const especialidad = await db.Especialidad.findByPk(idEspecialidad);
    if (!especialidad) {
      throw new NotFoundError(
        "Especialidad no encontrada para eliminar físicamente."
      );
    }

    // La BD manejará ON DELETE CASCADE para EmpleadoEspecialidad.
    // Y ON DELETE SET NULL para Servicio.Especialidad_idEspecialidad.
    // Podrías añadir verificaciones previas si lo deseas, por ejemplo,
    // advertir si hay muchos empleados o servicios asociados antes de borrar.

    const filasEliminadas = await db.Especialidad.destroy({
      where: { idEspecialidad },
    });
    return filasEliminadas;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    // Si alguna FK tuviera RESTRICT y no CASCADE o SET NULL, aquí podría haber un SequelizeForeignKeyConstraintError
    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ConflictError(
        "No se puede eliminar la especialidad porque está siendo referenciada de una manera que impide su borrado."
      );
    }
    console.error(
      `Error al eliminar físicamente la especialidad con ID ${idEspecialidad} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al eliminar físicamente la especialidad: ${error.message}`,
      500
    );
  }
};

module.exports = {
  crearEspecialidad,
  obtenerTodasLasEspecialidades,
  obtenerEspecialidadPorId,
  actualizarEspecialidad,
  anularEspecialidad,
  habilitarEspecialidad,
  eliminarEspecialidadFisica,
};
