// src/services/permisosXRol.service.js
const db = require("../models");
const { NotFoundError, CustomError, ConflictError } = require("../errors"); // Ajusta la ruta

/**
 * Asigna uno o varios permisos a un rol específico.
 * @param {number} idRol - El ID del rol.
 * @param {Array<number>} idPermisos - Un array de IDs de permisos a asignar.
 * @returns {Promise<Array<object>>} Los registros creados en PermisosXRol.
 * @throws {NotFoundError} Si el rol o alguno de los permisos no existen.
 * @throws {CustomError} Si ocurre un error durante la operación.
 */
const asignarPermisosARol = async (idRol, idPermisos) => {
  try {
    const rol = await db.Rol.findByPk(idRol);
    if (!rol) {
      throw new NotFoundError(`Rol con ID ${idRol} no encontrado.`);
    }

    // Verificar que todos los permisos existan y estén activos
    const permisosExistentes = await db.Permisos.findAll({
      where: {
        idPermiso: idPermisos,
        estado: true, // Opcional: solo asignar permisos activos
      },
    });

    if (permisosExistentes.length !== idPermisos.length) {
      const idsEncontrados = permisosExistentes.map((p) => p.idPermiso);
      const idsNoEncontradosOInactivos = idPermisos.filter(
        (id) => !idsEncontrados.includes(id)
      );
      throw new NotFoundError(
        `Uno o más permisos no existen o están inactivos: IDs ${idsNoEncontradosOInactivos.join(
          ", "
        )}`
      );
    }

    // Crear las asociaciones en PermisosXRol
    // Sequelize tiene métodos de asociación como rol.addPermisos(permisosExistentes)
    // que simplifican esto si la asociación está bien definida con 'as'.
    // Asumiendo que la asociación Rol.belongsToMany(Permisos, { as: 'permisos', through: models.PermisosXRol ... }) existe:
    await rol.addPermisos(permisosExistentes); // 'addPermisos' usa el alias 'permisos'

    // Para devolver algo más informativo, podríamos consultar las asignaciones.
    // O simplemente devolver un mensaje de éxito. Por ahora, la acción se completa.
    // `rol.addPermisos` maneja la inserción en la tabla de unión.

    return await rol.getPermisos({ attributes: ["idPermiso", "nombre"] }); // Devuelve los permisos actuales del rol
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ConflictError)
      throw error;
    console.error(
      `Error al asignar permisos al rol ID ${idRol}:`,
      error.message
    );
    // Verificar si el error es por una clave duplicada (el permiso ya está asignado)
    // Sequelize y la BD manejan esto con la PK en PermisosXRol, `addPermisos` no debería duplicar.
    throw new CustomError(`Error al asignar permisos: ${error.message}`, 500);
  }
};

/**
 * Quita (desasigna) uno o varios permisos de un rol específico.
 * @param {number} idRol - El ID del rol.
 * @param {Array<number>} idPermisos - Un array de IDs de permisos a quitar.
 * @returns {Promise<void>}
 * @throws {NotFoundError} Si el rol no se encuentra.
 */
const quitarPermisosDeRol = async (idRol, idPermisos) => {
  try {
    const rol = await db.Rol.findByPk(idRol);
    if (!rol) {
      throw new NotFoundError(`Rol con ID ${idRol} no encontrado.`);
    }

    // Sequelize tiene métodos como rol.removePermisos(idPermisos)
    await rol.removePermisos(idPermisos); // 'removePermisos' usa el alias 'permisos'

    return await rol.getPermisos({ attributes: ["idPermiso", "nombre"] }); // Devuelve los permisos restantes
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al quitar permisos del rol ID ${idRol}:`,
      error.message
    );
    throw new CustomError(`Error al quitar permisos: ${error.message}`, 500);
  }
};

/**
 * Obtiene todos los permisos asignados a un rol específico.
 * @param {number} idRol - El ID del rol.
 * @returns {Promise<Array<object>>} Un array de objetos de permiso.
 * @throws {NotFoundError} Si el rol no se encuentra.
 */
const obtenerPermisosDeRol = async (idRol) => {
  try {
    const rol = await db.Rol.findByPk(idRol);
    if (!rol) {
      throw new NotFoundError(`Rol con ID ${idRol} no encontrado.`);
    }

    // Usar el método get del alias de la asociación
    // Asumiendo que la asociación Rol.belongsToMany(Permisos, { as: 'permisos', ... }) existe
    const permisos = await rol.getPermisos({
      attributes: ["idPermiso", "nombre", "descripcion", "estado"], // O los atributos que quieras mostrar
      joinTableAttributes: [], // Para no incluir atributos de PermisosXRol si no son necesarios
    });
    return permisos;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al obtener permisos del rol ID ${idRol}:`,
      error.message
    );
    throw new CustomError(
      `Error al obtener los permisos del rol: ${error.message}`,
      500
    );
  }
};

module.exports = {
  asignarPermisosARol,
  quitarPermisosDeRol,
  obtenerPermisosDeRol,
};
