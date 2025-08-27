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
  const { estado, empleadoId } = opcionesDeFiltro;
  const whereClause = {};
  
  // ✅ Se modifica el 'include' para traer el perfil del empleado
  const includeOptions = {
    model: db.Usuario,
    as: 'empleados',
    attributes: ['idUsuario', 'correo'], // Traemos los datos base del usuario
    through: { attributes: [] },
    include: [{ // Y DENTRO del usuario, incluimos su perfil de empleado
        model: db.Empleado,
        as: 'empleadoInfo',
        attributes: ['nombre', 'apellido', 'numeroDocumento'],
        required: true // Solo trae usuarios que tengan un perfil de empleado
    }]
  };

  if (estado === 'true' || estado === 'false') {
    whereClause.estado = estado === 'true';
  }

  if (empleadoId) {
    includeOptions.where = { idUsuario: empleadoId };
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