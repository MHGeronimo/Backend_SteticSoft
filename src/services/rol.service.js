// src/services/rol.service.js
const db = require("../models");
const { Op } = db.Sequelize;
const { NotFoundError, ConflictError, CustomError } = require("../errors");

//... (tu función cambiarEstadoRol se mantiene igual)
const cambiarEstadoRol = async (idRol, nuevoEstado) => {
  const rol = await db.Rol.findByPk(idRol);
  if (!rol) {
    throw new NotFoundError("Rol no encontrado para cambiar estado.");
  }
  if (rol.estado === nuevoEstado) {
    return rol;
  }
  await rol.update({ estado: nuevoEstado });
  return rol;
};

//... (tu función crearRol se mantiene igual)
const crearRol = async (datosRol) => {
  const { nombre, descripcion, estado, idPermisos } = datosRol;
  const t = await db.sequelize.transaction();

  try {
    const rolExistente = await db.Rol.findOne({ where: { nombre }, transaction: t });
    if (rolExistente) {
      throw new ConflictError(`El rol con el nombre '${nombre}' ya existe.`);
    }

    const nuevoRol = await db.Rol.create({
      nombre,
      descripcion,
      estado: typeof estado === "boolean" ? estado : true,
    }, { transaction: t });

    if (idPermisos && idPermisos.length > 0) {
      const permisosParaAsignar = idPermisos.map(idPermiso => ({
        idRol: nuevoRol.idRol,
        idPermiso: idPermiso,
      }));
      await db.PermisosXRol.bulkCreate(permisosParaAsignar, { transaction: t });
    }

    await t.commit();

    // Devolver el rol con sus permisos
    const rolConPermisos = await db.Rol.findByPk(nuevoRol.idRol, {
      include: [{
        model: db.Permisos,
        as: 'permisos',
        attributes: ['idPermiso', 'nombre'], // Especificar atributos a incluir para permisos
        through: { attributes: [] }
      }]
    });
    return rolConPermisos.toJSON();

  } catch (error) {
    await t.rollback();
    if (error instanceof ConflictError) {
      throw error;
    }
    console.error("Error al crear el rol en el servicio:", error.message);
    throw new CustomError(`Error al crear el rol: ${error.message}`, 500);
  }
};

/**
 * Obtener todos los roles, con opción de búsqueda y filtrado por estado.
 */
const obtenerTodosLosRoles = async (opciones = {}) => {
  try {
    const { terminoBusqueda, estado } = opciones; // Extraemos terminoBusqueda y estado de las opciones

    let whereClause = {}; // Cláusula where principal para Roles

    // Filtro por estado (si se proporciona)
    if (estado === 'activos') {
      whereClause.estado = true;
    } else if (estado === 'inactivos') {
      whereClause.estado = false;
    }
    // Si estado es 'todos' o no se define, no se filtra por estado.

    let includePermisos = {
      model: db.Permisos,
      as: 'permisos',
      attributes: ['idPermiso', 'nombre'], // Traer id y nombre para la búsqueda y para mostrar
      through: { attributes: [] },
      required: false, // Hacemos el include opcional por defecto
    };

    if (terminoBusqueda) {
      const busquedaLike = { [Op.like]: `%${terminoBusqueda}%` };
      
      whereClause = {
        ...whereClause, // Mantenemos el filtro de estado si existe
        [Op.or]: [
          { nombre: busquedaLike },
          { descripcion: busquedaLike },
          { '$permisos.nombre$': busquedaLike } // Búsqueda en el nombre del permiso asociado
        ]
      };
    }

    return await db.Rol.findAll({
      where: whereClause,
      include: [includePermisos],
      distinct: true, // Necesario cuando se filtra por atributos de modelos incluidos
      subQuery: false // Generalmente recomendado con includes y where en el top level
    });
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
    const rol = await db.Rol.findByPk(idRol, {
      include: [{
        model: db.Permisos,
        as: 'permisos', // Asegúrate que este alias coincida con el usado en Rol.model.js
        attributes: ['idPermiso', 'nombre', 'descripcion'], // Especifica los atributos que quieres de Permisos
        through: {
          attributes: [] // No traer atributos de la tabla de unión (PermisosXRol)
        }
      }]
    });
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

//... (tu función actualizarRol se mantiene igual)
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
          idRol: { [Op.ne]: idRol } // [Op.ne] es "not equal"
        }
      });
      if (rolConMismoNombre) {
        throw new ConflictError(`Ya existe otro rol con el nombre '${datosActualizar.nombre}'.`);
      }
    }
    
    // Actualizar el rol y luego obtenerlo con sus permisos
    await rol.update(datosActualizar);
    
    // Si se proporcionan idPermisos, actualizar los permisos
    if (datosActualizar.idPermisos !== undefined) { // Se permite un array vacío para quitar todos los permisos
      const t = await db.sequelize.transaction();
      try {
        await db.PermisosXRol.destroy({ where: { idRol }, transaction: t });
        if (datosActualizar.idPermisos.length > 0) {
          const nuevosPermisos = datosActualizar.idPermisos.map(idPermiso => ({
            idRol,
            idPermiso,
          }));
          await db.PermisosXRol.bulkCreate(nuevosPermisos, { transaction: t });
        }
        await t.commit();
      } catch (e) {
        await t.rollback();
        throw new CustomError(`Error al actualizar permisos del rol: ${e.message}`, 500);
      }
    }

    // Devolver el rol actualizado con sus permisos
    const rolActualizadoConPermisos = await db.Rol.findByPk(idRol, {
      include: [{
        model: db.Permisos,
        as: 'permisos',
        attributes: ['idPermiso', 'nombre', 'descripcion'],
        through: { attributes: [] }
      }]
    });
    return rolActualizadoConPermisos;

  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ConflictError) {
      throw error;
    }
    console.error(`Error al actualizar el rol con ID ${idRol} en el servicio:`, error.message);
    throw new CustomError(`Error al actualizar el rol: ${error.message}`, 500);
  }
};

//... (tu función anularRol se mantiene igual, no la borro)
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

//... (tu función habilitarRol se mantiene igual, no la borro)
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

//... (tu función eliminarRolFisico se mantiene igual)
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
  cambiarEstadoRol,
};