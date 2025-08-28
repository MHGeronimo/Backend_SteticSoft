// src/services/novedades.service.js
const db = require("../models");
const { Op } = db.Sequelize;
const { NotFoundError, BadRequestError, CustomError } = require("../errors");

/**
 * Crea una nueva novedad y la asigna a los empleados especificados.
 * Utiliza una transacción para asegurar la integridad de los datos.
 * @param {object} datosNovedad - Datos de la novedad (fechas, horas, etc.).
 * @param {number[]} empleadosIds - Array de IDs de los empleados a asignar.
 * @returns {Promise<object>} La nueva novedad creada con sus empleados asociados.
 */
const crearNovedad = async (datosNovedad, empleadosIds) => {
  const t = await db.sequelize.transaction();
  try {
    if (empleadosIds && empleadosIds.length > 0) {
      // 1. Busca el ID del rol "Empleado"
      const rolEmpleado = await db.Rol.findOne({ where: { nombre: 'Empleado' }, transaction: t });
      if (!rolEmpleado) {
        throw new CustomError("El rol 'Empleado' no está configurado en el sistema.", 500);
      }

      // 2. Valida que los IDs pertenezcan a usuarios activos Y con el rol de Empleado
      const usuariosValidos = await db.Usuario.count({
        where: {
          idUsuario: empleadosIds,
          estado: true,
          idRol: rolEmpleado.idRol 
        },
        transaction: t,
      });

      if (usuariosValidos !== empleadosIds.length) {
        // Este es el error que estabas viendo. Ahora la validación es correcta.
        throw new BadRequestError("Uno o más de los IDs proporcionados no corresponden a empleados válidos y activos.");
      }
    }

    const nuevaNovedad = await db.Novedad.create(datosNovedad, { transaction: t });

    if (empleadosIds && empleadosIds.length > 0) {
      await nuevaNovedad.setEmpleados(empleadosIds, { transaction: t });
    }

    await t.commit();
    return await db.Novedad.findByPk(nuevaNovedad.idNovedad, {
      include: [{ model: db.Usuario, as: 'empleados', attributes: ['idUsuario', 'correo'] }],
    });
  } catch (error) {
    await t.rollback();
    console.error("Error al crear la novedad en el servicio:", error);
    throw error;
  }
};


// --- FUNCIÓN DE OBTENER NOVEDADES (CORREGIDA) ---
const obtenerTodasLasNovedades = async (opcionesDeFiltro = {}) => {
  // Ahora también recibimos 'busqueda'
  const { estado, empleadoId, busqueda } = opcionesDeFiltro;
  const whereClause = {};

  const includeOptions = {
    model: db.Usuario,
    as: 'empleados',
    attributes: ['idUsuario', 'correo'],
    through: { attributes: [] },
    include: [{
      model: db.Empleado,
      as: 'empleadoInfo',
      attributes: ['nombre', 'apellido'],
    }],
    required: false // Usamos LEFT JOIN para no excluir novedades
  };

  // Filtro por estado (se mantiene igual)
  if (estado === 'true' || estado === 'false') {
    whereClause.estado = estado === 'true';
  }

  // Filtro por empleadoId (se mantiene igual)
  if (empleadoId) {
    includeOptions.where = { idUsuario: empleadoId };
    includeOptions.required = true; // Hacemos INNER JOIN si se filtra por empleado
  }

  // ✅ NUEVA LÓGICA DE BÚSQUEDA GENERAL
  if (busqueda) {
    const searchTerm = `%${busqueda}%`;

    // Usamos Op.or para buscar en múltiples campos de la novedad y sus empleados
    whereClause[Op.or] = [
      // Campos de la tabla Novedad
      { fechaInicio: { [Op.like]: searchTerm } },
      { fechaFin: { [Op.like]: searchTerm } },
      { horaInicio: { [Op.like]: searchTerm } },
      { horaFin: { [Op.like]: searchTerm } },
      // Campos de las tablas asociadas (Usuario y Empleado)
      { '$empleados.correo$': { [Op.like]: searchTerm } },
      { '$empleados.empleadoInfo.nombre$': { [Op.like]: searchTerm } },
      { '$empleados.empleadoInfo.apellido$': { [Op.like]: searchTerm } },
    ];
  }

  try {
    const novedades = await db.Novedad.findAll({
      where: whereClause,
      include: [includeOptions],
      order: [["fechaInicio", "DESC"]],
    });
    return novedades;
  } catch (error) {
    console.error("Error al obtener todas las novedades:", error);
    throw new CustomError(`Error al obtener novedades: ${error.message}`, 500);
  }
};

/**
 * Obtiene una novedad por su ID, incluyendo los empleados asignados.
 */
const obtenerNovedadPorId = async (idNovedad) => {
  const novedad = await db.Novedad.findByPk(idNovedad, {
    include: [{ model: db.Usuario, as: 'empleados', attributes: ['idUsuario', 'correo'] }],
  });
  if (!novedad) {
    throw new NotFoundError("Novedad no encontrada.");
  }
  return novedad;
};

/**
 * Actualiza una novedad y sus empleados asignados.
 */
const actualizarNovedad = async (idNovedad, datosActualizar, empleadosIds) => {
  const t = await db.sequelize.transaction();
  try {
    const novedad = await db.Novedad.findByPk(idNovedad, { transaction: t });
    if (!novedad) {
      throw new NotFoundError("Novedad no encontrada para actualizar.");
    }

    // ✅ NUEVA VALIDACIÓN: Se añade la misma lógica de validación que en 'crearNovedad'
    if (empleadosIds) { // Solo se valida si se está enviando una nueva lista de empleados
      const rolEmpleado = await db.Rol.findOne({ where: { nombre: 'Empleado' }, transaction: t });
      if (!rolEmpleado) {
        throw new CustomError("El rol 'Empleado' no está configurado en el sistema.", 500);
      }
      const usuariosValidos = await db.Usuario.count({
        where: {
          idUsuario: empleadosIds,
          estado: true,
          idRol: rolEmpleado.idRol
        },
        transaction: t
      });
      if (usuariosValidos !== empleadosIds.length) {
        throw new BadRequestError("Uno o más de los IDs proporcionados para actualizar no corresponden a empleados válidos y activos.");
      }
      // Si la validación pasa, se sincronizan los empleados
      await novedad.setEmpleados(empleadosIds, { transaction: t });
    }
    
    // Se actualizan los demás datos de la novedad (fechas, horas, etc.)
    await novedad.update(datosActualizar, { transaction: t });

    await t.commit();
    return await obtenerNovedadPorId(idNovedad); // Devuelve la novedad actualizada

  } catch (error) {
    await t.rollback();
    console.error("Error al actualizar la novedad en el servicio:", error);
    throw error;
  }
};


/**
 * Cambia el estado de una novedad.
 */
const cambiarEstadoNovedad = async (idNovedad, estado) => {
  const novedad = await db.Novedad.findByPk(idNovedad);
  if (!novedad) {
    throw new NotFoundError("Novedad no encontrada.");
  }
  await novedad.update({ estado });
  return novedad;
};

/**
 * Elimina una novedad. La tabla de unión se limpia gracias a ON DELETE CASCADE.
 */
const eliminarNovedadFisica = async (idNovedad) => {
  const novedad = await db.Novedad.findByPk(idNovedad);
  if (!novedad) {
    throw new NotFoundError("Novedad no encontrada para eliminar.");
  }
  await novedad.destroy();
};

module.exports = {
  crearNovedad,
  obtenerTodasLasNovedades,
  obtenerNovedadPorId,
  actualizarNovedad,
  cambiarEstadoNovedad,
  eliminarNovedadFisica,
};