// src/services/empleado.service.js
const db = require("../models");
const { Op } = db.Sequelize;
const { NotFoundError, ConflictError, CustomError } = require("../errors");

/**
 * Helper interno para cambiar el estado de un empleado.
 * @param {number} idEmpleado - ID del empleado.
 * @param {boolean} nuevoEstado - El nuevo estado (true para habilitar, false para anular).
 * @returns {Promise<object>} El empleado con el estado cambiado.
 */
const cambiarEstadoEmpleado = async (idEmpleado, nuevoEstado) => {
  const empleado = await db.Empleado.findByPk(idEmpleado);
  if (!empleado) {
    throw new NotFoundError("Empleado no encontrado para cambiar estado.");
  }
  if (empleado.estado === nuevoEstado) {
    return empleado; // Ya está en el estado deseado
  }
  await empleado.update({ estado: nuevoEstado });
  return empleado;
};

/**
 * Crear un nuevo empleado.
 */
const crearEmpleado = async (datosDelBody) => {
  const {
    nombre,
    tipodocumento,
    numerodocumento,
    fechanacimiento,
    celular,
    estado,
  } = datosDelBody;

  const empleadoExistente = await db.Empleado.findOne({
    where: { numerodocumento: numerodocumento },
  });
  if (empleadoExistente) {
    throw new ConflictError(
      `El número de documento '${numerodocumento}' ya está registrado para otro empleado.`
    );
  }

  try {
    const nuevoEmpleado = await db.Empleado.create({
      nombre: nombre,
      tipoDocumento: tipodocumento,
      numeroDocumento: numerodocumento,
      fechaNacimiento: fechanacimiento,
      celular: celular || null,
      estado: typeof estado === "boolean" ? estado : true,
    });
    return nuevoEmpleado;
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ConflictError(
        `El número de documento '${numerodocumento}' ya está registrado.`
      );
    }
    console.error(
      "Error al crear el empleado en el servicio:",
      error.message,
      error.stack
    );
    throw new CustomError(`Error al crear el empleado: ${error.message}`, 500);
  }
};

/**
 * Obtener todos los empleados.
 */
const obtenerTodosLosEmpleados = async (opcionesDeFiltro = {}) => {
  try {
    const empleados = await db.Empleado.findAll({
      where: opcionesDeFiltro,
      order: [["nombre", "ASC"]],
    });
    return empleados;
  } catch (error) {
    console.error(
      "Error al obtener todos los empleados en el servicio:",
      error.message
    );
    throw new CustomError(`Error al obtener empleados: ${error.message}`, 500);
  }
};

/**
 * Obtener un empleado por su ID.
 */
const obtenerEmpleadoPorId = async (idEmpleado) => {
  try {
    const empleado = await db.Empleado.findByPk(idEmpleado);
    if (!empleado) {
      throw new NotFoundError("Empleado no encontrado.");
    }
    return empleado;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al obtener el empleado con ID ${idEmpleado} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al obtener el empleado: ${error.message}`,
      500
    );
  }
};

/**
 * Actualizar un empleado existente.
 */
const actualizarEmpleado = async (idEmpleado, datosActualizarDelBody) => {
  try {
    const empleado = await db.Empleado.findByPk(idEmpleado);
    if (!empleado) {
      throw new NotFoundError("Empleado no encontrado para actualizar.");
    }

    const datosParaModelo = {};
    if (datosActualizarDelBody.hasOwnProperty("nombre"))
      datosParaModelo.nombre = datosActualizarDelBody.nombre;
    if (datosActualizarDelBody.hasOwnProperty("tipodocumento"))
      datosParaModelo.tipoDocumento = datosActualizarDelBody.tipodocumento;
    if (datosActualizarDelBody.hasOwnProperty("numerodocumento"))
      datosParaModelo.numeroDocumento = datosActualizarDelBody.numerodocumento;
    if (datosActualizarDelBody.hasOwnProperty("fechanacimiento"))
      datosParaModelo.fechaNacimiento = datosActualizarDelBody.fechanacimiento;
    if (datosActualizarDelBody.hasOwnProperty("celular"))
      datosParaModelo.celular = datosActualizarDelBody.celular;
    if (datosActualizarDelBody.hasOwnProperty("estado"))
      datosParaModelo.estado = datosActualizarDelBody.estado;

    if (
      datosParaModelo.numeroDocumento &&
      datosParaModelo.numeroDocumento !== empleado.numeroDocumento
    ) {
      const otroEmpleadoConDocumento = await db.Empleado.findOne({
        where: {
          numerodocumento: datosParaModelo.numeroDocumento,
          idEmpleado: { [Op.ne]: idEmpleado },
        },
      });
      if (otroEmpleadoConDocumento) {
        throw new ConflictError(
          `El número de documento '${datosParaModelo.numeroDocumento}' ya está registrado para otro empleado.`
        );
      }
    }

    await empleado.update(datosParaModelo);
    return empleado;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ConflictError)
      throw error;
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ConflictError(
        `El número de documento '${
          datosActualizarDelBody.numerodocumento || empleado.numerodocumento
        }' ya está registrado.`
      );
    }
    console.error(
      `Error al actualizar el empleado con ID ${idEmpleado} en el servicio:`,
      error.message,
      error.stack
    );
    throw new CustomError(
      `Error al actualizar el empleado: ${error.message}`,
      500
    );
  }
};

/**
 * Anular un empleado (borrado lógico, establece estado = false).
 */
const anularEmpleado = async (idEmpleado) => {
  try {
    return await cambiarEstadoEmpleado(idEmpleado, false);
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al anular el empleado con ID ${idEmpleado} en el servicio:`,
      error.message
    );
    throw new CustomError(`Error al anular el empleado: ${error.message}`, 500);
  }
};

/**
 * Habilitar un empleado (cambia estado = true).
 */
const habilitarEmpleado = async (idEmpleado) => {
  try {
    return await cambiarEstadoEmpleado(idEmpleado, true);
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al habilitar el empleado con ID ${idEmpleado} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al habilitar el empleado: ${error.message}`,
      500
    );
  }
};

/**
 * Eliminar un empleado físicamente de la base de datos.
 */
const eliminarEmpleadoFisico = async (idEmpleado) => {
  try {
    const empleado = await db.Empleado.findByPk(idEmpleado);
    if (!empleado) {
      throw new NotFoundError(
        "Empleado no encontrado para eliminar físicamente."
      );
    }

    const filasEliminadas = await db.Empleado.destroy({
      where: { idEmpleado },
    });
    return filasEliminadas;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ConflictError(
        "No se puede eliminar el empleado porque está siendo referenciado de una manera que impide su borrado y no tiene configurado ON DELETE CASCADE o SET NULL."
      );
    }
    console.error(
      `Error al eliminar físicamente el empleado con ID ${idEmpleado} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al eliminar físicamente el empleado: ${error.message}`,
      500
    );
  }
};

module.exports = {
  crearEmpleado,
  obtenerTodosLosEmpleados,
  obtenerEmpleadoPorId,
  actualizarEmpleado,
  anularEmpleado,
  habilitarEmpleado,
  eliminarEmpleadoFisico,
  cambiarEstadoEmpleado, // Exportar la nueva función
};