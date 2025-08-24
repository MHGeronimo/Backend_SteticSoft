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
  // Iniciamos una transacción para asegurar que ambas operaciones (crear novedad y asignar empleados)
  // se completen exitosamente o ninguna lo haga.
  const t = await db.sequelize.transaction();

  try {
    // 1. Validar que los empleados existan y estén activos
    if (empleadosIds && empleadosIds.length > 0) {
      const usuarios = await db.Usuario.findAll({
        where: { idUsuario: empleadosIds, estado: true },
        transaction: t,
      });
      if (usuarios.length !== empleadosIds.length) {
        throw new BadRequestError("Uno o más de los empleados seleccionados no existen o no están activos.");
      }
    }

    // 2. Crear la novedad principal dentro de la transacción
    const nuevaNovedad = await db.Novedad.create(datosNovedad, { transaction: t });

    // 3. Asignar la novedad a los empleados usando el método de asociación de Sequelize
    if (empleadosIds && empleadosIds.length > 0) {
      await nuevaNovedad.setEmpleados(empleadosIds, { transaction: t });
    }

    // 4. Si todo salió bien, confirmamos la transacción
    await t.commit();

    // 5. Devolvemos la novedad creada, incluyendo los empleados asociados
    return await db.Novedad.findByPk(nuevaNovedad.idNovedad, {
      include: [{ model: db.Usuario, as: 'empleados', attributes: ['idUsuario', 'correo'] }],
    });

  } catch (error) {
    // 6. Si algo falla, revertimos todos los cambios
    await t.rollback();
    console.error("Error al crear la novedad en el servicio:", error);
    // Re-lanzamos el error para que el controlador lo maneje
    throw error;
  }
};

/**
 * Obtiene todas las novedades con filtros opcionales.
 */
const obtenerTodasLasNovedades = async (opcionesDeFiltro = {}) => {
  const { estado, empleadoId } = opcionesDeFiltro;
  const whereClause = {};
  const includeOptions = {
    model: db.Usuario,
    as: 'empleados',
    attributes: ['idUsuario', 'correo'],
    through: { attributes: [] } // No incluir datos de la tabla de unión
  };

  if (estado === 'true' || estado === 'false') {
    whereClause.estado = estado === 'true';
  }

  // Si se filtra por empleado, añadimos una condición al 'include'
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

    // Actualiza los datos de la novedad (fechas, horas, etc.)
    await novedad.update(datosActualizar, { transaction: t });

    // Si se proporciona un array de empleados, sincroniza las asignaciones.
    // .setEmpleados() elimina las asignaciones viejas y crea las nuevas.
    if (empleadosIds) {
      await novedad.setEmpleados(empleadosIds, { transaction: t });
    }

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