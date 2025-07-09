// src/services/permisosXRol.service.js
const db = require('../models');
const { NotFoundError } = require('../errors');

/**
 * Asigna una lista de permisos a un rol.
 * Si el rol ya tiene permisos, se reemplazan por la nueva lista.
 */
const asignarPermisosARol = async (idRol, idPermisos) => {
    // CORRECCIÓN: La lógica completa para asignar permisos de forma segura.
    const rol = await db.Rol.findByPk(idRol);
    if (!rol) {
        throw new NotFoundError('Rol no encontrado para asignar permisos.');
    }

    // Usamos una transacción para asegurar que todas las operaciones se completen o ninguna lo haga.
    const t = await db.sequelize.transaction();
    try {
        // 1. Borramos todos los permisos que el rol tenga actualmente.
        await db.PermisosXRol.destroy({ where: { idRol }, transaction: t });

        // 2. Si se proporcionó una lista de nuevos permisos, los creamos.
        if (idPermisos && idPermisos.length > 0) {
            const nuevosPermisos = idPermisos.map(idPermiso => ({
                idRol,
                idPermiso,
            }));
            await db.PermisosXRol.bulkCreate(nuevosPermisos, { transaction: t });
        }

        // 3. Si todo fue exitoso, confirmamos la transacción.
        await t.commit();
        
        // Devolvemos los permisos actuales del rol.
        return await obtenerPermisosDeRol(idRol);
    } catch (error) {
        // 4. Si algo falla, revertimos todos los cambios.
        await t.rollback();
        throw new Error(`Error al asignar permisos: ${error.message}`);
    }
};

/**
 * Obtiene todos los permisos asignados a un rol específico.
 */
const obtenerPermisosDeRol = async (idRol) => {
    const rolConPermisos = await db.Rol.findByPk(idRol, {
        include: [{
            model: db.Permisos,
            as: 'permisos', // CORREGIDO: de 'permiso' a 'permisos'
            through: { attributes: [] },
        }],
    });
    if (!rolConPermisos) {
        throw new NotFoundError('Rol no encontrado.');
    }
    return rolConPermisos.permisos;
};

/**
 * Quita una lista de permisos de un rol.
 */
const quitarPermisosDeRol = async (idRol, idPermisos) => {
    // Esta función se mantiene igual que la tenías, es para borrado selectivo.
    const rol = await db.Rol.findByPk(idRol);
    if (!rol) {
        throw new NotFoundError('Rol no encontrado.');
    }
    await db.PermisosXRol.destroy({
        where: {
            idRol,
            idPermiso: idPermisos,
        },
    });
    return await obtenerPermisosDeRol(idRol);
};

module.exports = {
    asignarPermisosARol,
    obtenerPermisosDeRol,
    quitarPermisosDeRol,
};