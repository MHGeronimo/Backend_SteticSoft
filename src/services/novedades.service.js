// src/services/novedades.service.js
const db = require("../models");
const { Op } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors");

/**
 * Helper interno para cambiar el estado de una novedad.
 * @param {number} idNovedades - ID de la novedad.
 * @param {boolean} nuevoEstado - El nuevo estado (true para habilitar, false para anular).
 * @returns {Promise<object>} La novedad con el estado cambiado.
 */
const cambiarEstadoNovedad = async (idNovedades, nuevoEstado) => {
  const novedad = await db.Novedades.findByPk(idNovedades);
  if (!novedad) {
    throw new NotFoundError("Novedad no encontrada para cambiar estado.");
  }
  if (novedad.estado === nuevoEstado) {
    return novedad; // Ya está en el estado deseado
  }
  await novedad.update({ estado: nuevoEstado });
  return novedad;
};

/**
 * Crear una nueva novedad para un empleado.
 */
const crearNovedad = async (datosNovedad) => {
  const { empleadoId, diaSemana, horaInicio, horaFin, estado } = datosNovedad;

  const empleado = await db.Empleado.findOne({
    where: { idEmpleado: empleadoId, estado: true },
  });
  if (!empleado) {
    throw new BadRequestError(
      `Empleado con ID ${empleadoId} no encontrado o inactivo.`
    );
  }

  const novedadExistente = await db.Novedades.findOne({
    where: {
      empleadoId: empleadoId,
      diaSemana: diaSemana,
    },
  });
  if (novedadExistente) {
    throw new ConflictError(
      `El empleado ID ${empleadoId} ya tiene una novedad registrada para el día de la semana ${diaSemana}.`
    );
  }

  if (horaFin <= horaInicio) {
    throw new BadRequestError(
      "La hora de fin debe ser posterior a la hora de inicio."
    );
  }

  try {
    const nuevaNovedad = await db.Novedades.create({
      empleadoId,
      diaSemana,
      horaInicio,
      horaFin,
      estado: typeof estado === "boolean" ? estado : true,
    });
    return nuevaNovedad;
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ConflictError(
        `El empleado ID ${empleadoId} ya tiene una novedad registrada para el día de la semana ${diaSemana}.`
      );
    }
    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new BadRequestError(
        `El empleado con ID ${empleadoId} no es válido.`
      );
    }
    console.error(
      "Error al crear la novedad en el servicio:",
      error.message,
      error.stack
    );
    throw new CustomError(`Error al crear la novedad: ${error.message}`, 500);
  }
};

/**
 * Obtener todas las novedades.
 */
const obtenerTodasLasNovedades = async (opcionesDeFiltro = {}) => {
  try {
    return await db.Novedades.findAll({
      where: opcionesDeFiltro,
      include: [
        {
          model: db.Empleado,
          as: "empleado", // Corregido: 'empleado' es el alias en Novedades.model.js
          attributes: ["idEmpleado", "nombre"],
        },
      ],
      order: [
        ["empleadoId", "ASC"],
        ["diaSemana", "ASC"],
      ],
    });
  } catch (error) {
    console.error(
      "Error al obtener todas las novedades en el servicio:",
      error.message
    );
    throw new CustomError(`Error al obtener novedades: ${error.message}`, 500);
  }
};

/**
 * Obtener una novedad por su ID.
 */
const obtenerNovedadPorId = async (idNovedades) => {
  try {
    const novedad = await db.Novedades.findByPk(idNovedades, {
      include: [
        {
          model: db.Empleado,
          as: "empleado", // Corregido: 'empleado' es el alias en Novedades.model.js
          attributes: ["idEmpleado", "nombre"],
        },
      ],
    });
    if (!novedad) {
      throw new NotFoundError("Novedad no encontrada.");
    }
    return novedad;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al obtener la novedad con ID ${idNovedades} en el servicio:`,
      error.message
    );
    throw new CustomError(`Error al obtener la novedad: ${error.message}`, 500);
  }
};

/**
 * Actualizar una novedad existente.
 */
const actualizarNovedad = async (idNovedades, datosActualizar) => {
  const { horaInicio, horaFin, estado } = datosActualizar;
  try {
    const novedad = await db.Novedades.findByPk(idNovedades);
    if (!novedad) {
      throw new NotFoundError("Novedad no encontrada para actualizar.");
    }

    const nuevaHoraInicio =
      horaInicio !== undefined ? horaInicio : novedad.horaInicio;
    const nuevaHoraFin = horaFin !== undefined ? horaFin : novedad.horaFin;

    if (nuevaHoraFin <= nuevaHoraInicio) {
      throw new BadRequestError(
        "La hora de fin debe ser posterior a la hora de inicio."
      );
    }

    const camposAActualizar = {};
    if (horaInicio !== undefined) camposAActualizar.horaInicio = horaInicio;
    if (horaFin !== undefined) camposAActualizar.horaFin = horaFin;
    if (estado !== undefined) camposAActualizar.estado = estado;

    if (Object.keys(camposAActualizar).length === 0) {
      return novedad;
    }

    await novedad.update(camposAActualizar);
    return novedad;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof BadRequestError)
      throw error;
    console.error(
      `Error al actualizar la novedad con ID ${idNovedades} en el servicio:`,
      error.message,
      error.stack
    );
    throw new CustomError(
      `Error al actualizar la novedad: ${error.message}`,
      500
    );
  }
};

/**
 * Anular una novedad (estado = false).
 */
const anularNovedad = async (idNovedades) => {
  try {
    return await cambiarEstadoNovedad(idNovedades, false);
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al anular la novedad con ID ${idNovedades} en el servicio:`,
      error.message
    );
    throw new CustomError(`Error al anular la novedad: ${error.message}`, 500);
  }
};

/**
 * Habilitar una novedad (estado = true).
 */
const habilitarNovedad = async (idNovedades) => {
  try {
    return await cambiarEstadoNovedad(idNovedades, true);
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al habilitar la novedad con ID ${idNovedades} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al habilitar la novedad: ${error.message}`,
      500
    );
  }
};

/**
 * Eliminar una novedad físicamente.
 */
const eliminarNovedadFisica = async (idNovedades) => {
  try {
    const novedad = await db.Novedades.findByPk(idNovedades);
    if (!novedad) {
      throw new NotFoundError(
        "Novedad no encontrada para eliminar físicamente."
      );
    }

    const filasEliminadas = await db.Novedades.destroy({
      where: { idNovedades },
    });
    return filasEliminadas;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al eliminar físicamente la novedad con ID ${idNovedades} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al eliminar físicamente la novedad: ${error.message}`,
      500
    );
  }
};

module.exports = {
  crearNovedad,
  obtenerTodasLasNovedades,
  obtenerNovedadPorId,
  actualizarNovedad,
  anularNovedad,
  habilitarNovedad,
  eliminarNovedadFisica,
  cambiarEstadoNovedad, 
};