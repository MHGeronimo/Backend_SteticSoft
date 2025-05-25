// src/services/permiso.service.js
const db = require("../models"); // Ajusta la ruta a tu index.js de modelos
const { Op } = db.Sequelize;
const { NotFoundError, ConflictError, CustomError } = require("../errors"); // Ajusta la ruta si es necesario

/**
 * Crear un nuevo permiso.
 * @param {object} datosPermiso - Datos del permiso a crear ({ nombre, descripcion, estado }).
 * @returns {Promise<object>} El permiso creado.
 * @throws {Error} Si el nombre del permiso ya existe o hay otros errores.
 */
const crearPermiso = async (datosPermiso) => {
  const { nombre, descripcion, estado } = datosPermiso;

  const permisoExistente = await db.Permisos.findOne({ where: { nombre } });
  if (permisoExistente) {
    throw new ConflictError(`El permiso con el nombre '${nombre}' ya existe.`);
  }

  try {
    const nuevoPermiso = await db.Permisos.create({
      nombre,
      descripcion,
      estado: typeof estado === "boolean" ? estado : true, // Valor por defecto true si no se especifica
    });
    return nuevoPermiso;
  } catch (error) {
    console.error("Error al crear el permiso en el servicio:", error.message);
    throw new CustomError(`Error al crear el permiso: ${error.message}`, 500);
  }
};

/**
 * Obtener todos los permisos.
 * @param {object} [opcionesDeFiltro={}] - Opciones para filtrar (ej. { estado: true } para solo activos).
 * @returns {Promise<Array<object>>} Lista de permisos.
 */
const obtenerTodosLosPermisos = async (opcionesDeFiltro = {}) => {
  try {
    return await db.Permisos.findAll({ where: opcionesDeFiltro });
  } catch (error) {
    console.error(
      "Error al obtener todos los permisos en el servicio:",
      error.message
    );
    throw new CustomError(`Error al obtener permisos: ${error.message}`, 500);
  }
};

/**
 * Obtener un permiso por su ID.
 * @param {number} idPermiso - ID del permiso.
 * @returns {Promise<object|null>} El permiso encontrado o null si no existe.
 */
const obtenerPermisoPorId = async (idPermiso) => {
  try {
    const permiso = await db.Permisos.findByPk(idPermiso);
    if (!permiso) {
      throw new NotFoundError("Permiso no encontrado.");
    }
    return permiso;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al obtener el permiso con ID ${idPermiso} en el servicio:`,
      error.message
    );
    throw new CustomError(`Error al obtener el permiso: ${error.message}`, 500);
  }
};

/**
 * Actualizar (Editar) un permiso existente.
 * @param {number} idPermiso - ID del permiso a actualizar.
 * @param {object} datosActualizar - Datos para actualizar el permiso ({ nombre?, descripcion?, estado? }).
 * @returns {Promise<object>} El permiso actualizado.
 * @throws {Error} Si el permiso no se encuentra (404) o si el nuevo nombre de permiso ya existe para otro permiso (409).
 */
const actualizarPermiso = async (idPermiso, datosActualizar) => {
  try {
    const permiso = await db.Permisos.findByPk(idPermiso);
    if (!permiso) {
      throw new NotFoundError("Permiso no encontrado para actualizar.");
    }

    if (datosActualizar.nombre && datosActualizar.nombre !== permiso.nombre) {
      const permisoConMismoNombre = await db.Permisos.findOne({
        where: {
          nombre: datosActualizar.nombre,
          idPermiso: { [Op.ne]: idPermiso },
        },
      });
      if (permisoConMismoNombre) {
        throw new ConflictError(
          `Ya existe otro permiso con el nombre '${datosActualizar.nombre}'.`
        );
      }
    }

    await permiso.update(datosActualizar);
    return permiso;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ConflictError)
      throw error;
    console.error(
      `Error al actualizar el permiso con ID ${idPermiso} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al actualizar el permiso: ${error.message}`,
      500
    );
  }
};

/**
 * Anular un permiso (borrado lógico, establece estado = false).
 * @param {number} idPermiso - ID del permiso a anular.
 * @returns {Promise<object>} El permiso anulado.
 * @throws {Error} Si el permiso no se encuentra (404).
 */
const anularPermiso = async (idPermiso) => {
  try {
    const permiso = await db.Permisos.findByPk(idPermiso);
    if (!permiso) {
      throw new NotFoundError("Permiso no encontrado para anular.");
    }
    if (!permiso.estado) {
      return permiso; // Ya está anulado
    }
    await permiso.update({ estado: false });
    return permiso;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al anular el permiso con ID ${idPermiso} en el servicio:`,
      error.message
    );
    throw new CustomError(`Error al anular el permiso: ${error.message}`, 500);
  }
};

/**
 * Habilitar un permiso (cambia estado = true).
 * @param {number} idPermiso - ID del permiso a habilitar.
 * @returns {Promise<object>} El permiso habilitado.
 * @throws {Error} Si el permiso no se encuentra (404).
 */
const habilitarPermiso = async (idPermiso) => {
  try {
    const permiso = await db.Permisos.findByPk(idPermiso);
    if (!permiso) {
      throw new NotFoundError("Permiso no encontrado para habilitar.");
    }
    if (permiso.estado) {
      return permiso; // Ya está habilitado
    }
    await permiso.update({ estado: true });
    return permiso;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al habilitar el permiso con ID ${idPermiso} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al habilitar el permiso: ${error.message}`,
      500
    );
  }
};

/**
 * Eliminar un permiso físicamente de la base de datos.
 * ¡ADVERTENCIA: Esta acción es destructiva! Considerar las implicaciones en la tabla PermisosXRol.
 * @param {number} idPermiso - ID del permiso a eliminar físicamente.
 * @returns {Promise<number>} El número de filas eliminadas (debería ser 1 o 0).
 * @throws {Error} Si el permiso no se encuentra (404) o si hay un error de restricción de clave foránea.
 */
const eliminarPermisoFisico = async (idPermiso) => {
  try {
    const permiso = await db.Permisos.findByPk(idPermiso);
    if (!permiso) {
      throw new NotFoundError(
        "Permiso no encontrado para eliminar físicamente."
      );
    }

    // ADVERTENCIA: La eliminación física en la tabla 'Permisos' provocará que las entradas
    // correspondientes en 'PermisosXRol' se eliminen automáticamente debido al ON DELETE CASCADE.
    // Esto es importante tenerlo en cuenta.
    const filasEliminadas = await db.Permisos.destroy({
      where: { idPermiso },
    });
    return filasEliminadas;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    // SequelizeForeignKeyConstraintError podría no ser el error directo aquí si PermisosXRol se borra en cascada.
    // Pero si otra tabla referenciara Permisos sin ON DELETE CASCADE, podría ocurrir.
    console.error(
      `Error al eliminar físicamente el permiso con ID ${idPermiso} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al eliminar físicamente el permiso: ${error.message}`,
      500
    );
  }
};

module.exports = {
  crearPermiso,
  obtenerTodosLosPermisos,
  obtenerPermisoPorId,
  actualizarPermiso,
  anularPermiso,
  habilitarPermiso,
  eliminarPermisoFisico,
};
