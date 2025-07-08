// src/services/novedades.service.js
const db = require("../models");
const { Op } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors");

const cambiarEstadoNovedad = async (idNovedad, nuevoEstado) => {
  const novedad = await db.Novedades.findByPk(idNovedad);
  if (!novedad) {
    throw new NotFoundError("Novedad no encontrada para cambiar estado.");
  }
  if (novedad.estado === nuevoEstado) {
    return novedad;
  }
  await novedad.update({ estado: nuevoEstado });
  return novedad;
};

const crearNovedad = async (datosNovedad) => {
  const { idEmpleado, diaSemana, horaInicio, horaFin, estado } = datosNovedad;

  const empleado = await db.Empleado.findOne({
    where: { idEmpleado: idEmpleado, estado: true },
  });
  if (!empleado) {
    throw new BadRequestError(
      `Empleado con ID ${idEmpleado} no encontrado o inactivo.`
    );
  }

  const novedadExistente = await db.Novedades.findOne({
    where: {
      idEmpleado: idEmpleado,
      diaSemana: diaSemana,
    },
  });
  if (novedadExistente) {
    throw new ConflictError(
      `El empleado ID ${idEmpleado} ya tiene una novedad registrada para el día de la semana ${diaSemana}.`
    );
  }

  if (horaFin <= horaInicio) {
    throw new BadRequestError(
      "La hora de fin debe ser posterior a la hora de inicio."
    );
  }

  try {
    const nuevaNovedad = await db.Novedades.create({
      idEmpleado,
      diaSemana,
      horaInicio,
      horaFin,
      estado: typeof estado === "boolean" ? estado : true,
    });
    return nuevaNovedad;
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ConflictError(
        `El empleado ID ${idEmpleado} ya tiene una novedad registrada para el día de la semana ${diaSemana}.`
      );
    }
    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new BadRequestError(
        `El empleado con ID ${idEmpleado} no es válido.`
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

const obtenerTodasLasNovedades = async (opcionesDeFiltro = {}) => {
  try {
    return await db.Novedades.findAll({
      where: opcionesDeFiltro,
      include: [
        {
          model: db.Empleado,
          as: "empleado",
          required: true,
          // CORRECTO: Usamos los nombres de propiedad del MODELO de Empleado
          attributes: ["idEmpleado", "nombre"],
        },
      ],
      order: [
        ["id_empleado", "ASC"],
        ["dia_semana", "ASC"], // Corregido por si acaso, usando el nombre de la columna real
      ],
    });
  } catch (error) {
    console.error(
      "Error al obtener todas las novedades en el servicio:",
      error.message,
      error.stack
    );
    throw new CustomError(`Error al obtener novedades: ${error.message}`, 500);
  }
};

const obtenerNovedadPorId = async (idNovedad) => {
    try {
        const novedad = await db.Novedades.findByPk(idNovedad, {
            include: [{
                model: db.Empleado,
                as: 'empleado',
                attributes: ['idEmpleado', 'nombre'],
            }],
        });
        if (!novedad) {
            throw new NotFoundError('Novedad no encontrada.');
        }
        return novedad;
    } catch (error) {
        if (error instanceof NotFoundError) throw error;
        console.error(`Error al obtener la novedad con ID ${idNovedad} en el servicio:`, error.message);
        throw new CustomError(`Error al obtener la novedad: ${error.message}`, 500);
    }
};

const actualizarNovedad = async (idNovedad, datosActualizar) => {
    const { horaInicio, horaFin, estado } = datosActualizar;
    try {
        const novedad = await db.Novedades.findByPk(idNovedad);
        if (!novedad) {
            throw new NotFoundError('Novedad no encontrada para actualizar.');
        }

        const nuevaHoraInicio = horaInicio !== undefined ? horaInicio : novedad.horaInicio;
        const nuevaHoraFin = horaFin !== undefined ? horaFin : novedad.horaFin;

        if (nuevaHoraFin <= nuevaHoraInicio) {
            throw new BadRequestError('La hora de fin debe ser posterior a la hora de inicio.');
        }

        await novedad.update(datosActualizar);
        return novedad;
    } catch (error) {
        if (error instanceof NotFoundError || error instanceof BadRequestError) throw error;
        console.error(`Error al actualizar la novedad con ID ${idNovedad} en el servicio:`, error.message);
        throw new CustomError(`Error al actualizar la novedad: ${error.message}`, 500);
    }
};

const anularNovedad = async (idNovedad) => {
    return cambiarEstadoNovedad(idNovedad, false);
};

const habilitarNovedad = async (idNovedad) => {
    return cambiarEstadoNovedad(idNovedad, true);
};

const eliminarNovedadFisica = async (idNovedad) => {
    const novedad = await db.Novedades.findByPk(idNovedad);
    if (!novedad) {
        throw new NotFoundError('Novedad no encontrada para eliminar físicamente.');
    }
    await novedad.destroy();
    return { message: 'Novedad eliminada exitosamente.' };
};

module.exports = {
  crearNovedad,
  obtenerTodasLasNovedades,
  obtenerNovedadPorId,
  actualizarNovedad,
  anularNovedad,
  habilitarNovedad,
  eliminarNovedadFisica,
  cambiarEstadoNovedad
};