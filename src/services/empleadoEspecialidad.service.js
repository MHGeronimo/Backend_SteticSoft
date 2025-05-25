// src/services/empleadoEspecialidad.service.js
const db = require("../models");
const {
  NotFoundError,
  CustomError,
  ConflictError,
  BadRequestError,
} = require("../errors"); // Ajusta la ruta

/**
 * Asigna una o varias especialidades a un empleado específico.
 * @param {number} idEmpleado - El ID del empleado.
 * @param {Array<number>} idEspecialidades - Un array de IDs de especialidades a asignar.
 * @returns {Promise<Array<object>>} Las especialidades actualmente asignadas al empleado.
 * @throws {NotFoundError} Si el empleado o alguna de las especialidades no existen.
 * @throws {CustomError} Si ocurre un error durante la operación.
 */
const asignarEspecialidadesAEmpleado = async (idEmpleado, idEspecialidades) => {
  try {
    const empleado = await db.Empleado.findByPk(idEmpleado);
    if (!empleado) {
      throw new NotFoundError(`Empleado con ID ${idEmpleado} no encontrado.`);
    }

    // Verificar que todas las especialidades existan y estén activas
    const especialidadesExistentes = await db.Especialidad.findAll({
      where: {
        idEspecialidad: idEspecialidades,
        estado: true, // Opcional: solo asignar especialidades activas
      },
    });

    if (especialidadesExistentes.length !== idEspecialidades.length) {
      const idsEncontradas = especialidadesExistentes.map(
        (e) => e.idEspecialidad
      );
      const idsNoEncontradasOInactivas = idEspecialidades.filter(
        (id) => !idsEncontradas.includes(id)
      );
      throw new NotFoundError(
        `Una o más especialidades no existen o están inactivas: IDs ${idsNoEncontradasOInactivas.join(
          ", "
        )}`
      );
    }

    // Usar el método de asociación 'addEspecialidades'
    // Asumiendo que en Empleado.model.js tienes:
    // Empleado.belongsToMany(models.Especialidad, { as: 'especialidades', through: models.EmpleadoEspecialidad ... });
    await empleado.addEspecialidades(especialidadesExistentes); // 'addEspecialidades' usa el alias 'especialidades'

    // Devolver las especialidades actuales del empleado
    return await empleado.getEspecialidades({
      attributes: ["idEspecialidad", "nombre", "descripcion", "estado"],
      joinTableAttributes: [], // No incluir atributos de la tabla de unión
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof BadRequestError)
      throw error;
    // El método addEspecialidades de Sequelize generalmente no duplica si la relación ya existe (debido a la PK en la tabla de unión).
    // Podría haber otros errores de base de datos.
    console.error(
      `Error al asignar especialidades al empleado ID ${idEmpleado}:`,
      error.message,
      error.stack
    );
    throw new CustomError(
      `Error al asignar especialidades: ${error.message}`,
      500
    );
  }
};

/**
 * Quita (desasigna) una o varias especialidades de un empleado específico.
 * @param {number} idEmpleado - El ID del empleado.
 * @param {Array<number>} idEspecialidades - Un array de IDs de especialidades a quitar.
 * @returns {Promise<Array<object>>} Las especialidades restantes del empleado.
 * @throws {NotFoundError} Si el empleado no se encuentra.
 */
const quitarEspecialidadesDeEmpleado = async (idEmpleado, idEspecialidades) => {
  try {
    const empleado = await db.Empleado.findByPk(idEmpleado);
    if (!empleado) {
      throw new NotFoundError(`Empleado con ID ${idEmpleado} no encontrado.`);
    }

    // Usar el método de asociación 'removeEspecialidades'
    // No es necesario verificar si las especialidades a quitar existen, Sequelize lo maneja.
    await empleado.removeEspecialidades(idEspecialidades); // 'removeEspecialidades' usa el alias 'especialidades'

    return await empleado.getEspecialidades({
      attributes: ["idEspecialidad", "nombre", "descripcion", "estado"],
      joinTableAttributes: [],
    });
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al quitar especialidades del empleado ID ${idEmpleado}:`,
      error.message,
      error.stack
    );
    throw new CustomError(
      `Error al quitar especialidades: ${error.message}`,
      500
    );
  }
};

/**
 * Obtiene todas las especialidades asignadas a un empleado específico.
 * Esta función podría también residir en empleado.service.js como parte de obtenerEmpleadoPorId con un include.
 * Pero tenerla aquí es útil si solo quieres esta información específica.
 * @param {number} idEmpleado - El ID del empleado.
 * @returns {Promise<Array<object>>} Un array de objetos de especialidad.
 * @throws {NotFoundError} Si el empleado no se encuentra.
 */
const obtenerEspecialidadesDeEmpleado = async (idEmpleado) => {
  try {
    const empleado = await db.Empleado.findByPk(idEmpleado);
    if (!empleado) {
      throw new NotFoundError(`Empleado con ID ${idEmpleado} no encontrado.`);
    }

    const especialidades = await empleado.getEspecialidades({
      attributes: ["idEspecialidad", "nombre", "descripcion", "estado"],
      joinTableAttributes: [], // No incluir atributos de EmpleadoEspecialidad
    });
    return especialidades;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al obtener especialidades del empleado ID ${idEmpleado}:`,
      error.message,
      error.stack
    );
    throw new CustomError(
      `Error al obtener las especialidades del empleado: ${error.message}`,
      500
    );
  }
};

module.exports = {
  asignarEspecialidadesAEmpleado,
  quitarEspecialidadesDeEmpleado,
  obtenerEspecialidadesDeEmpleado,
};
