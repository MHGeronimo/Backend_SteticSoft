// src/services/permiso.service.js
const db = require("../models");
const { Op } = db.Sequelize;
const { NotFoundError, ConflictError, CustomError } = require("../errors");

/**
 * Helper interno para cambiar el estado de un permiso.
 * @param {number} idPermiso - ID del permiso.
 * @param {boolean} nuevoEstado - El nuevo estado (true para habilitar, false para anular).
 * @returns {Promise<object>} El permiso con el estado cambiado.
 */
const cambiarEstadoPermiso = async (idPermiso, nuevoEstado) => {
  const permiso = await db.Permisos.findByPk(idPermiso);
  if (!permiso) {
    throw new NotFoundError("Permiso no encontrado para cambiar estado.");
  }
  if (permiso.estado === nuevoEstado) {
    return permiso; // Ya está en el estado deseado
  }
  await permiso.update({ estado: nuevoEstado });
  return permiso;
};

/**
 * Crear un nuevo permiso.
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
      estado: typeof estado === "boolean" ? estado : true,
    });
    return nuevoPermiso;
  } catch (error) {
    console.error("Error al crear el permiso en el servicio:", error.message);
    throw new CustomError(`Error al crear el permiso: ${error.message}`, 500);
  }
};

/**
 * Obtener todos los permisos.
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
 */
const anularPermiso = async (idPermiso) => {
  try {
    return await cambiarEstadoPermiso(idPermiso, false);
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
 */
const habilitarPermiso = async (idPermiso) => {
  try {
    return await cambiarEstadoPermiso(idPermiso, true);
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
 */
const eliminarPermisoFisico = async (idPermiso) => {
  try {
    const permiso = await db.Permisos.findByPk(idPermiso);
    if (!permiso) {
      throw new NotFoundError(
        "Permiso no encontrado para eliminar físicamente."
      );
    }
    const filasEliminadas = await db.Permisos.destroy({
      where: { idPermiso },
    });
    return filasEliminadas;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
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
  cambiarEstadoPermiso, 
};