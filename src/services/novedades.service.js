// src/services/novedades.service.js
const db = require("../models");
const { Op } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors"); // Ajusta la ruta

/**
 * Crear una nueva novedad para un empleado.
 * @param {object} datosNovedad - Datos de la novedad.
 * Ej: { empleadoId, diaSemana, horaInicio, horaFin, estado? }
 * @returns {Promise<object>} La novedad creada.
 */
const crearNovedad = async (datosNovedad) => {
  const { empleadoId, diaSemana, horaInicio, horaFin, estado } = datosNovedad;

  // Validar que el empleado exista y esté activo
  const empleado = await db.Empleado.findOne({
    where: { idEmpleado: empleadoId, estado: true },
  });
  if (!empleado) {
    throw new BadRequestError(
      `Empleado con ID ${empleadoId} no encontrado o inactivo.`
    );
  }

  // Validar unicidad de (empleadoId, diaSemana) - el validador de ruta también lo hace
  const novedadExistente = await db.Novedades.findOne({
    where: {
      empleadoId: empleadoId, // Atributo del modelo
      diaSemana: diaSemana,
    },
  });
  if (novedadExistente) {
    throw new ConflictError(
      `El empleado ID ${empleadoId} ya tiene una novedad registrada para el día de la semana ${diaSemana}.`
    );
  }

  // Validar que horaFin sea posterior a horaInicio (el validador también lo hace)
  // Podrías usar moment.js aquí para una comparación más robusta si es necesario.
  if (horaFin <= horaInicio) {
    throw new BadRequestError(
      "La hora de fin debe ser posterior a la hora de inicio."
    );
  }

  try {
    const nuevaNovedad = await db.Novedades.create({
      empleadoId, // Atributo del modelo
      diaSemana,
      horaInicio,
      horaFin,
      estado: typeof estado === "boolean" ? estado : true,
    });
    return nuevaNovedad;
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      // Por la restricción UNIQUE(Empleado_idEmpleado, diaSemana) en BD
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
 * @param {object} [opcionesDeFiltro={}] - Opciones para filtrar (ej. { estado: true, empleadoId: 1 }).
 * @returns {Promise<Array<object>>} Lista de novedades.
 */
const obtenerTodasLasNovedades = async (opcionesDeFiltro = {}) => {
  try {
    return await db.Novedades.findAll({
      where: opcionesDeFiltro,
      include: [
        {
          model: db.Empleado,
          as: "empleadoConNovedad", // Asegúrate que este alias coincida con tu asociación
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
 * @param {number} idNovedades - ID de la novedad.
 * @returns {Promise<object|null>} La novedad encontrada o null si no existe.
 */
const obtenerNovedadPorId = async (idNovedades) => {
  try {
    const novedad = await db.Novedades.findByPk(idNovedades, {
      include: [
        {
          model: db.Empleado,
          as: "empleadoConNovedad",
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
 * Generalmente no se actualiza empleadoId ni diaSemana; se crea una nueva o se borra la antigua.
 * @param {number} idNovedades - ID de la novedad a actualizar.
 * @param {object} datosActualizar - Datos para actualizar ({ horaInicio?, horaFin?, estado? }).
 * @returns {Promise<object>} La novedad actualizada.
 */
const actualizarNovedad = async (idNovedades, datosActualizar) => {
  const { horaInicio, horaFin, estado } = datosActualizar;
  try {
    const novedad = await db.Novedades.findByPk(idNovedades);
    if (!novedad) {
      throw new NotFoundError("Novedad no encontrada para actualizar.");
    }

    // Validar que horaFin sea posterior a horaInicio si ambas se actualizan o una de ellas
    const nuevaHoraInicio =
      horaInicio !== undefined ? horaInicio : novedad.horaInicio;
    const nuevaHoraFin = horaFin !== undefined ? horaFin : novedad.horaFin;

    if (nuevaHoraFin <= nuevaHoraInicio) {
      throw new BadRequestError(
        "La hora de fin debe ser posterior a la hora de inicio."
      );
    }

    // Crear un objeto solo con los campos que se van a actualizar
    const camposAActualizar = {};
    if (horaInicio !== undefined) camposAActualizar.horaInicio = horaInicio;
    if (horaFin !== undefined) camposAActualizar.horaFin = horaFin;
    if (estado !== undefined) camposAActualizar.estado = estado;

    if (Object.keys(camposAActualizar).length === 0) {
      return novedad; // No hay nada que actualizar
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
    const novedad = await db.Novedades.findByPk(idNovedades);
    if (!novedad) {
      throw new NotFoundError("Novedad no encontrada para anular.");
    }
    if (!novedad.estado) {
      return novedad; // Ya está anulada
    }
    await novedad.update({ estado: false });
    return novedad;
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
    const novedad = await db.Novedades.findByPk(idNovedades);
    if (!novedad) {
      throw new NotFoundError("Novedad no encontrada para habilitar.");
    }
    if (novedad.estado) {
      return novedad; // Ya está habilitada
    }
    await novedad.update({ estado: true });
    return novedad;
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
 * La FK a Empleado tiene ON DELETE CASCADE, la BD podría manejarlo, pero es bueno ser explícito.
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
    // No se esperan errores de FK aquí si el empleado se borra y las novedades se borran en cascada.
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
};
