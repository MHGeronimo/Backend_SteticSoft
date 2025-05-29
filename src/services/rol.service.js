// src/services/rol.service.js
const db = require("../models");
const { Op } = db.Sequelize;
const { NotFoundError, ConflictError, CustomError } = require("../errors");

/**
 * Helper interno para cambiar el estado de un rol.
 * @param {number} idRol - ID del rol.
 * @param {boolean} nuevoEstado - El nuevo estado (true para habilitar, false para anular).
 * @returns {Promise<object>} El rol con el estado cambiado.
 */
const cambiarEstadoRol = async (idRol, nuevoEstado) => {
  const rol = await db.Rol.findByPk(idRol);
  if (!rol) {
    throw new NotFoundError("Rol no encontrado para cambiar estado.");
  }
  if (rol.estado === nuevoEstado) {
    return rol; // Ya está en el estado deseado
  }
  await rol.update({ estado: nuevoEstado });
  return rol;
};

/**
 * Crear un nuevo rol.
 */
const crearRol = async (datosRol) => {
  const { nombre, descripcion, estado } = datosRol;

  const rolExistente = await db.Rol.findOne({ where: { nombre } });
  if (rolExistente) {
    throw new ConflictError(`El rol con el nombre '${nombre}' ya existe.`);
  }

  try {
    const nuevoRol = await db.Rol.create({
      nombre,
      descripcion,
      estado: typeof estado === "boolean" ? estado : true,
    });
    return nuevoRol;
  } catch (error) {
    console.error("Error al crear el rol en el servicio:", error.message);
    throw new CustomError(`Error al crear el rol: ${error.message}`, 500);
  }
};

/**
 * Obtener todos los roles.
 */
const obtenerTodosLosRoles = async (opcionesDeFiltro = {}) => {
  try {
    return await db.Rol.findAll({ where: opcionesDeFiltro });
  } catch (error) {
    console.error(
      "Error al obtener todos los roles en el servicio:",
      error.message
    );
    throw new CustomError(`Error al obtener roles: ${error.message}`, 500);
  }
};

/**
 * Obtener un rol por su ID.
 */
const obtenerRolPorId = async (idRol) => {
  try {
    const rol = await db.Rol.findByPk(idRol);
    if (!rol) {
      throw new NotFoundError("Rol no encontrado.");
    }
    return rol;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al obtener el rol con ID ${idRol} en el servicio:`,
      error.message
    );
    throw new CustomError(`Error al obtener el rol: ${error.message}`, 500);
  }
};

/**
 * Actualizar (Editar) un rol existente.
 */
const actualizarRol = async (idRol, datosActualizar) => {
  try {
    const rol = await db.Rol.findByPk(idRol);
    if (!rol) {
      throw new NotFoundError("Rol no encontrado para actualizar.");
    }

    if (datosActualizar.nombre && datosActualizar.nombre !== rol.nombre) {
      const rolConMismoNombre = await db.Rol.findOne({
        where: {
          nombre: datosActualizar.nombre,
          idRol: { [Op.ne]: idRol },
        },
      });
      if (rolConMismoNombre) {
        throw new ConflictError(
          `Ya existe otro rol con el nombre '${datosActualizar.nombre}'.`
        );
      }
    }

    await rol.update(datosActualizar);
    return rol;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ConflictError)
      throw error;
    console.error(
      `Error al actualizar el rol con ID ${idRol} en el servicio:`,
      error.message
    );
    throw new CustomError(`Error al actualizar el rol: ${error.message}`, 500);
  }
};

/**
 * Anular un rol (borrado lógico, establece estado = false).
 */
const anularRol = async (idRol) => {
  try {
    return await cambiarEstadoRol(idRol, false);
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al anular el rol con ID ${idRol} en el servicio:`,
      error.message
    );
    throw new CustomError(`Error al anular el rol: ${error.message}`, 500);
  }
};

/**
 * Habilitar un rol (cambia estado = true).
 */
const habilitarRol = async (idRol) => {
  try {
    return await cambiarEstadoRol(idRol, true);
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al habilitar el rol con ID ${idRol} en el servicio:`,
      error.message
    );
    throw new CustomError(`Error al habilitar el rol: ${error.message}`, 500);
  }
};

/**
 * Eliminar un rol físicamente de la base de datos.
 */
const eliminarRolFisico = async (idRol) => {
  try {
    const rol = await db.Rol.findByPk(idRol);
    if (!rol) {
      throw new NotFoundError("Rol no encontrado para eliminar físicamente.");
    }

    const filasEliminadas = await db.Rol.destroy({
      where: { idRol },
    });
    return filasEliminadas;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ConflictError(
        "No se puede eliminar el rol porque está siendo referenciado por otras entidades. Considere anularlo en su lugar."
      );
    }
    console.error(
      `Error al eliminar físicamente el rol con ID ${idRol} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al eliminar físicamente el rol: ${error.message}`,
      500
    );
  }
};

module.exports = {
  crearRol,
  obtenerTodosLosRoles,
  obtenerRolPorId,
  actualizarRol,
  anularRol,
  habilitarRol,
  eliminarRolFisico,
  cambiarEstadoRol, // Exportar la nueva función
};
