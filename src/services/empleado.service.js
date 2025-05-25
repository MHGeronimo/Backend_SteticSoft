// src/services/empleado.service.js
const db = require("../models");
const { Op } = db.Sequelize;
const { NotFoundError, ConflictError, CustomError } = require("../errors"); // Ajusta la ruta

/**
 * Crear un nuevo empleado.
 * @param {object} datosEmpleado - Datos del empleado.
 * @returns {Promise<object>} El empleado creado.
 */
const crearEmpleado = async (datosDelBody) => {
  const {
    nombre,
    tipodocumento, // Valor del body (minúsculas)
    numerodocumento, // Valor del body (minúsculas)
    fechanacimiento, // Valor del body (minúsculas)
    celular,
    estado,
  } = datosDelBody;

  // Validación de unicidad de numeroDocumento
  const empleadoExistente = await db.Empleado.findOne({
    where: { numerodocumento: numerodocumento }, // La búsqueda WHERE usa el 'field' o el nombre de columna, así que 'numerodocumento' está bien aquí
  });
  if (empleadoExistente) {
    throw new ConflictError(
      `El número de documento '${numerodocumento}' ya está registrado para otro empleado.`
    );
  }

  try {
    const nuevoEmpleado = await db.Empleado.create({
      nombre: nombre,
      tipoDocumento: tipodocumento, // Atributo del Modelo (camelCase) : valor del body
      numeroDocumento: numerodocumento, // Atributo del Modelo (camelCase) : valor del body
      fechaNacimiento: fechanacimiento, // Atributo del Modelo (camelCase) : valor del body
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
 * @param {object} [opcionesDeFiltro={}] - Opciones para filtrar (ej. { estado: true }).
 * @returns {Promise<Array<object>>} Lista de empleados.
 */
const obtenerTodosLosEmpleados = async (opcionesDeFiltro = {}) => {
  try {
    const empleados = await db.Empleado.findAll({
      where: opcionesDeFiltro,
      // Si quisieras incluir especialidades aquí más adelante:
      // include: [{
      //   model: db.Especialidad,
      //   as: 'especialidades', // Asegúrate que este alias coincida con tu asociación
      //   attributes: ['idEspecialidad', 'nombre'],
      //   through: { attributes: [] } // No traer atributos de EmpleadoEspecialidad
      // }],
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
 * @param {number} idEmpleado - ID del empleado.
 * @returns {Promise<object|null>} El empleado encontrado o null si no existe.
 */
const obtenerEmpleadoPorId = async (idEmpleado) => {
  try {
    const empleado = await db.Empleado.findByPk(idEmpleado, {
      // Si quisieras incluir especialidades aquí más adelante:
      // include: [{
      //   model: db.Especialidad,
      //   as: 'especialidades',
      //   attributes: ['idEspecialidad', 'nombre']
      // }]
    });
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
 * @param {number} idEmpleado - ID del empleado a actualizar.
 * @param {object} datosActualizar - Datos para actualizar.
 * @returns {Promise<object>} El empleado actualizado.
 */
const actualizarEmpleado = async (idEmpleado, datosActualizarDelBody) => {
  try {
    const empleado = await db.Empleado.findByPk(idEmpleado);
    if (!empleado) {
      throw new NotFoundError("Empleado no encontrado para actualizar.");
    }

    // Mapear los campos del body a los atributos del modelo si hay diferencia de case
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
      // Compara con el atributo del modelo
      const otroEmpleadoConDocumento = await db.Empleado.findOne({
        where: {
          numerodocumento: datosParaModelo.numeroDocumento, // Búsqueda por columna de BD
          idEmpleado: { [Op.ne]: idEmpleado },
        },
      });
      if (otroEmpleadoConDocumento) {
        throw new ConflictError(
          `El número de documento '${datosParaModelo.numeroDocumento}' ya está registrado para otro empleado.`
        );
      }
    }

    await empleado.update(datosParaModelo); // Pasar el objeto mapeado
    return empleado;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ConflictError)
      throw error;
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ConflictError(
        // Usar el valor que se intentó guardar y causó el conflicto
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
    const empleado = await db.Empleado.findByPk(idEmpleado);
    if (!empleado) {
      throw new NotFoundError("Empleado no encontrado para anular.");
    }
    if (!empleado.estado) {
      return empleado; // Ya está anulado
    }
    await empleado.update({ estado: false });
    return empleado;
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
    const empleado = await db.Empleado.findByPk(idEmpleado);
    if (!empleado) {
      throw new NotFoundError("Empleado no encontrado para habilitar.");
    }
    if (empleado.estado) {
      return empleado; // Ya está habilitado
    }
    await empleado.update({ estado: true });
    return empleado;
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
 * ¡ADVERTENCIA: Esta acción es destructiva!
 * Considerar las implicaciones con Citas, Abastecimientos, Novedades y EmpleadoEspecialidad.
 * (DDL: Cita.Empleado_idEmpleado ON DELETE SET NULL, Abastecimiento.empleado_asignado ON DELETE SET NULL,
 * Novedades.Empleado_idEmpleado ON DELETE CASCADE, EmpleadoEspecialidad.idEmpleado ON DELETE CASCADE)
 */
const eliminarEmpleadoFisico = async (idEmpleado) => {
  try {
    const empleado = await db.Empleado.findByPk(idEmpleado);
    if (!empleado) {
      throw new NotFoundError(
        "Empleado no encontrado para eliminar físicamente."
      );
    }

    // La BD manejará las acciones ON DELETE CASCADE y ON DELETE SET NULL.
    // EmpleadoEspecialidad y Novedades se borrarán en cascada.
    // Cita.Empleado_idEmpleado y Abastecimiento.empleado_asignado se pondrán a NULL.

    const filasEliminadas = await db.Empleado.destroy({
      where: { idEmpleado },
    });
    return filasEliminadas;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    // Un SequelizeForeignKeyConstraintError podría ocurrir si alguna otra tabla no contemplada
    // tiene una referencia a Empleado con ON DELETE RESTRICT.
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
};
