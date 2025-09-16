// RUTA: src/services/rol.service.js
// REVISADO: Módulo de Roles revisado y aprobado sin cambios funcionales. La estructura es robusta.

const db = require('../models');
const { Op } = db.Sequelize;
const { NotFoundError, ConflictError, CustomError } = require('../errors');

/**
 * Cambia el estado (activo/inactivo) de un rol.
 * @param {number} idRol - ID del rol.
 * @param {boolean} nuevoEstado - El nuevo estado para el rol.
 * @returns {Promise<object>} El rol con el estado actualizado.
 */
const cambiarEstadoRol = async (idRol, nuevoEstado) => {
  const rol = await db.Rol.findByPk(idRol);
  if (!rol) {
    throw new NotFoundError('Rol no encontrado para cambiar estado.');
  }
  // No es necesario hacer nada si el estado ya es el deseado.
  if (rol.estado === nuevoEstado) {
    return rol;
  }
  await rol.update({ estado: nuevoEstado });
  return rol;
};

/**
 * Crea un nuevo rol y le asigna permisos de forma atómica.
 * @param {object} datosRol - Datos del nuevo rol, incluyendo 'idPermisos'.
 * @returns {Promise<object>} El rol recién creado con sus permisos.
 */
const crearRol = async (datosRol) => {
  // Extraer datos del rol, haciendo tipoPerfil mutable.
  const { nombre, descripcion, estado, idPermisos } = datosRol;
  let tipoPerfil = datosRol.tipoPerfil;

  // Forzar el tipo de perfil correcto para roles del sistema.
  if (nombre === "Cliente") {
    tipoPerfil = "CLIENTE";
  } else if (nombre === "Empleado") {
    tipoPerfil = "EMPLEADO";
  } else if (nombre === "Administrador") {
    tipoPerfil = "NINGUNO";
  } else if (!tipoPerfil) {
    // Para roles personalizados, si no se especifica un tipo, se asume NINGUNO.
    tipoPerfil = "NINGUNO";
  }

  // Se utiliza una única transacción para toda la operación.
  const t = await db.sequelize.transaction();

  try {
    // 1. Verificar si ya existe un rol con el mismo nombre
    const rolExistente = await db.Rol.findOne({ where: { nombre }, transaction: t });
    if (rolExistente) {
      throw new ConflictError(`El rol con el nombre '${nombre}' ya existe.`);
    }

    // 2. Crear el rol principal
    const nuevoRol = await db.Rol.create(
      {
        nombre,
        descripcion,
        estado: typeof estado === "boolean" ? estado : true, // Valor por defecto si no se especifica
        tipoPerfil, // Usar el tipoPerfil validado
      },
      { transaction: t }
    );

    // 3. Asignar los permisos si se proporcionaron en el array
    if (idPermisos && idPermisos.length > 0) {
      const permisosParaAsignar = idPermisos.map(idPermiso => ({
        idRol: nuevoRol.idRol,
        idPermiso: idPermiso,
      }));
      await db.PermisosXRol.bulkCreate(permisosParaAsignar, { transaction: t });
    }

    // 4. Si todo fue exitoso, confirmar la transacción
    await t.commit();

    // 5. Devolver el rol creado con todos sus permisos asociados
    const rolConPermisos = await db.Rol.findByPk(nuevoRol.idRol, {
      include: [{
        model: db.Permisos,
        as: 'permisos',
        attributes: ['idPermiso', 'nombre'],
        through: { attributes: [] }
      }]
    });
    
    // Devolvemos un objeto JSON plano para evitar problemas de serialización
    return rolConPermisos.toJSON();

  } catch (error) {
    // Si algo falla, revertir todos los cambios
    await t.rollback();
    
    // Re-lanzar errores conocidos para que el controlador los maneje
    if (error instanceof ConflictError || error instanceof CustomError) {
      throw error;
    }
    // Para cualquier otro error, lo registramos y lanzamos un error genérico
    console.error('Error al crear el rol en el servicio:', error.message);
    throw new CustomError(`Error al crear el rol: ${error.message}`, 500);
  }
};

/**
 * Obtiene todos los roles, con opción de búsqueda y filtrado por estado.
 * @param {object} opciones - Opciones de filtrado como 'terminoBusqueda' y 'estado'.
 * @returns {Promise<Array<object>>} Una lista de roles.
 */
const obtenerTodosLosRoles = async (opciones = {}) => {
  try {
    const { terminoBusqueda, estado } = opciones;
    let whereClause = {};

    // Filtro por estado
    if (estado === 'activos') {
      whereClause.estado = true;
    } else if (estado === 'inactivos') {
      whereClause.estado = false;
    }

    // Búsqueda por término
    if (terminoBusqueda) {
      const busquedaLike = { [Op.like]: `%${terminoBusqueda}%` };
      whereClause[Op.or] = [
        { nombre: busquedaLike },
        { descripcion: busquedaLike },
        { '$permisos.nombre$': busquedaLike }
      ];
    }
    
    const includePermisos = {
      model: db.Permisos,
      as: 'permisos',
      attributes: ['idPermiso', 'nombre'],
      through: { attributes: [] },
      required: !!(terminoBusqueda && whereClause[Op.or].some(c => c['$permisos.nombre$'])), // Solo es 'required' si buscamos en permisos
    };

    return await db.Rol.findAll({
      where: whereClause,
      include: [includePermisos],
      distinct: true,
      subQuery: false,
      order: [['nombre', 'ASC']]
    });

  } catch (error) {
    console.error("Error al obtener todos los roles en el servicio:", error.message);
    throw new CustomError(`Error al obtener roles: ${error.message}`, 500);
  }
};

/**
 * Obtiene un rol por su ID con todos sus permisos.
 * @param {number} idRol - ID del rol a buscar.
 * @returns {Promise<object>} El rol encontrado.
 */
const obtenerRolPorId = async (idRol) => {
  try {
    const rol = await db.Rol.findByPk(idRol, {
      include: [{
        model: db.Permisos,
        as: 'permisos',
        attributes: ['idPermiso', 'nombre', 'descripcion'],
        through: { attributes: [] }
      }]
    });
    if (!rol) {
      throw new NotFoundError('Rol no encontrado.');
    }
    return rol;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(`Error al obtener el rol con ID ${idRol} en el servicio:`, error.message);
    throw new CustomError(`Error al obtener el rol: ${error.message}`, 500);
  }
};

/**
 * Actualiza un rol y sus permisos de forma atómica.
 * @param {number} idRol - ID del rol a actualizar.
 * @param {object} datosActualizar - Datos a actualizar, incluyendo 'idPermisos'.
 * @returns {Promise<object>} El rol actualizado con sus permisos.
 */
const actualizarRol = async (idRol, datosActualizar, idUsuario) => {
  const { idPermisos, ...datosPrincipalesRol } = datosActualizar;

  // Se utiliza una única transacción para toda la operación
  const t = await db.sequelize.transaction();

  try {
    // 1. Buscar el rol que se va a actualizar
    const rol = await db.Rol.findByPk(idRol, {
      include: [{ model: db.Permisos, as: "permisos" }],
      transaction: t,
    });
    if (!rol) {
      throw new NotFoundError("Rol no encontrado para actualizar.");
    }

    // --- INICIO DE CORRECCIÓN ---
    const systemRoles = ["Administrador", "Cliente", "Empleado"];
    const esRolDelSistema = systemRoles.includes(rol.nombre);

    // Regla: No se puede cambiar el nombre de un rol del sistema.
    if (
      esRolDelSistema &&
      datosPrincipalesRol.nombre &&
      datosPrincipalesRol.nombre !== rol.nombre
    ) {
      throw new CustomError(
        `El nombre del rol del sistema '${rol.nombre}' no puede ser modificado.`,
        403
      );
    }

    // Regla: No se puede cambiar el tipo de perfil de un rol del sistema.
    if (esRolDelSistema && datosPrincipalesRol.tipoPerfil) {
      // Se ignora cualquier intento de cambiar el tipoPerfil para roles del sistema.
      delete datosPrincipalesRol.tipoPerfil;
    }

    // Regla: Si se cambia el nombre de un rol personalizado a un nombre del sistema, forzar el tipoPerfil.
    const nombreFinal = datosPrincipalesRol.nombre || rol.nombre;
    if (nombreFinal === "Cliente") {
      datosPrincipalesRol.tipoPerfil = "CLIENTE";
    } else if (nombreFinal === "Empleado") {
      datosPrincipalesRol.tipoPerfil = "EMPLEADO";
    } else if (nombreFinal === "Administrador") {
      datosPrincipalesRol.tipoPerfil = "NINGUNO";
    }
    // --- FIN DE CORRECCIÓN ---

    const valorAnterior = rol.toJSON(); // Guardamos el estado anterior

    // 2. Si se está cambiando el nombre, verificar que no entre en conflicto con otro existente
    if (
      datosPrincipalesRol.nombre &&
      datosPrincipalesRol.nombre !== rol.nombre
    ) {
      const rolConMismoNombre = await db.Rol.findOne({
        where: {
          nombre: datosPrincipalesRol.nombre,
          idRol: { [Op.ne]: idRol },
        },
        transaction: t,
      });
      if (rolConMismoNombre) {
        throw new ConflictError(
          `Ya existe otro rol con el nombre '${datosPrincipalesRol.nombre}'.`
        );
      }
    }

    // 3. Registrar cambios en el historial para campos principales
    const camposAuditables = ["nombre", "descripcion", "estado", "tipoPerfil"];
    const cambios = [];
    for (const campo of camposAuditables) {
      if (
        datosPrincipalesRol[campo] !== undefined &&
        datosPrincipalesRol[campo] !== valorAnterior[campo]
      ) {
        cambios.push({
          idRol,
          idUsuarioModifico: idUsuario,
          campoModificado: campo,
          valorAnterior: valorAnterior[campo],
          valorNuevo: datosPrincipalesRol[campo],
        });
      }
    }

    // 4. Actualizar los datos principales del rol
    await rol.update(datosPrincipalesRol, { transaction: t });

    // 5. Actualizar los permisos si el array 'idPermisos' fue proporcionado
    if (idPermisos !== undefined) {
      const idPermisosAnteriores = valorAnterior.permisos
        .map((p) => p.idPermiso)
        .sort();
      const idPermisosNuevos = [...idPermisos].sort();

      if (
        JSON.stringify(idPermisosAnteriores) !==
        JSON.stringify(idPermisosNuevos)
      ) {
        cambios.push({
          idRol,
          idUsuarioModifico: idUsuario,
          campoModificado: "permisos",
          valorAnterior: JSON.stringify(idPermisosAnteriores),
          valorNuevo: JSON.stringify(idPermisosNuevos),
        });
      }

      await db.PermisosXRol.destroy({ where: { idRol }, transaction: t });

      if (idPermisos.length > 0) {
        const nuevosPermisos = idPermisos.map((idPermiso) => ({
          idRol,
          idPermiso,
          asignadoPor: idUsuario,
        }));
        await db.PermisosXRol.bulkCreate(nuevosPermisos, { transaction: t });
      }
    }

    // 6. Guardar todos los cambios en el historial
    if (cambios.length > 0) {
      await db.HistorialCambiosRol.bulkCreate(cambios, { transaction: t });
    }

    // 5. Si todo fue exitoso, confirmar la transacción
    await t.commit();

    // 6. Devolver el rol actualizado con su lista de permisos final
    const rolActualizadoConPermisos = await db.Rol.findByPk(idRol, {
      include: [
        {
          model: db.Permisos,
          as: "permisos",
          attributes: ["idPermiso", "nombre", "descripcion"],
          through: { attributes: [] },
        },
      ],
    });

    // Devolvemos un objeto JSON plano
    return rolActualizadoConPermisos.toJSON();
    
  } catch (error) {
    // Si algo falla, revertir todos los cambios
    await t.rollback();

    // Re-lanzar errores conocidos
    if (error instanceof NotFoundError || error instanceof ConflictError) {
      throw error;
    }
    // Para cualquier otro error, lo registramos y lanzamos uno genérico
    console.error(
      `Error al actualizar el rol con ID ${idRol} en el servicio:`,
      error.message
    );
    throw new CustomError(`Error al actualizar el rol: ${error.message}`, 500);
  }
};

/**
 * Desactiva un rol (cambia su estado a false).
 * @param {number} idRol - ID del rol a anular.
 */
const anularRol = async (idRol) => {
  try {
    return await cambiarEstadoRol(idRol, false);
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(`Error al anular el rol con ID ${idRol} en el servicio:`, error.message);
    throw new CustomError(`Error al anular el rol: ${error.message}`, 500);
  }
};

/**
 * Activa un rol (cambia su estado a true).
 * @param {number} idRol - ID del rol a habilitar.
 */
const habilitarRol = async (idRol) => {
  try {
    return await cambiarEstadoRol(idRol, true);
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(`Error al habilitar el rol con ID ${idRol} en el servicio:`, error.message);
    throw new CustomError(`Error al habilitar el rol: ${error.message}`, 500);
  }
};

/**
 * Elimina un rol de la base de datos de forma permanente.
 * @param {number} idRol - ID del rol a eliminar.
 */
const eliminarRolFisico = async (idRol) => {
  try {
    const rol = await db.Rol.findByPk(idRol);
    if (!rol) {
      throw new NotFoundError('Rol no encontrado para eliminar físicamente.');
    }
    return await db.Rol.destroy({ where: { idRol } });
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      throw new ConflictError('No se puede eliminar el rol porque está siendo referenciado. Considere anularlo.');
    }
    console.error(`Error al eliminar físicamente el rol con ID ${idRol}:`, error.message);
    throw new CustomError(`Error al eliminar físicamente el rol: ${error.message}`, 500);
  }
};

/**
 * Obtiene el historial de cambios de un rol por su ID.
 * @param {number} idRol - ID del rol.
 * @returns {Promise<Array<object>>} - Una lista del historial de cambios.
 */
const obtenerHistorialPorRolId = async (idRol) => {
  try {
    const historial = await db.HistorialCambiosRol.findAll({
      where: { id_rol: idRol },
      include: [
        {
          model: db.Usuario,
          as: "usuarioModificador",
          attributes: ["correo"],
          // --- INICIO DE LA MODIFICACIÓN ---
          include: [
            {
              model: db.Rol,
              as: "rol", // Este alias viene de la asociación en Usuario.model.js
              attributes: ["nombre"], // Solo necesitamos el nombre del rol
            },
          ],
          // --- FIN DE LA MODIFICACIÓN ---
        },
      ],
      order: [["fecha_cambio", "DESC"]],
    });
    return historial;
  } catch (error) {
    console.error(
      `Error al obtener el historial del rol con ID ${idRol}:`,
      error.message
    );
    throw new CustomError(
      `Error al obtener el historial del rol: ${error.message}`,
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
  obtenerHistorialPorRolId,
};