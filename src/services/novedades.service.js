const db = require("../models");
const { Op } = db.Sequelize;
const { NotFoundError, BadRequestError, CustomError } = require("../errors");
const moment = require("moment-timezone");

const crearNovedad = async (datosNovedad, empleadosIds) => {
  const t = await db.sequelize.transaction();
  try {
    if (empleadosIds && empleadosIds.length > 0) {
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
        transaction: t,
      });
      if (usuariosValidos !== empleadosIds.length) {
        throw new BadRequestError("Uno o más de los IDs proporcionados no corresponden a empleados válidos y activos.");
      }
    }
    // Se eliminó la dependencia de 'nombre' y 'descripcion'
    const nuevaNovedad = await db.Novedad.create(datosNovedad, { transaction: t });
    if (empleadosIds && empleadosIds.length > 0) {
      await nuevaNovedad.setEmpleados(empleadosIds, { transaction: t });
    }
    await t.commit();
    return await db.Novedad.findByPk(nuevaNovedad.idNovedad, {
      include: [{ model: db.Usuario, as: 'empleados', attributes: ['idUsuario', 'nombre', 'apellido', 'correo'] }],
    });
  } catch (error) {
    await t.rollback();
    console.error("Error al crear la novedad en el servicio:", error);
    throw error;
  }
};

const obtenerTodasLasNovedades = async (opcionesDeFiltro = {}) => {
  const { estado, empleadoId, busqueda } = opcionesDeFiltro;
  const whereClause = {};

  const includeOptions = {
    model: db.Usuario,
    as: 'empleados',
    attributes: ['idUsuario', 'nombre', 'apellido', 'correo'],
    through: { attributes: [] },
    required: false
  };

  if (estado === 'true' || estado === 'false') {
    whereClause.estado = estado === 'true';
  }

  if (empleadoId) {
    includeOptions.where = { idUsuario: empleadoId };
    includeOptions.required = true;
  }

  if (busqueda) {
    const searchTerm = `%${busqueda}%`;
    // Se eliminó la búsqueda por nombre de novedad
    whereClause[Op.or] = [
      { '$empleados.nombre$': { [Op.iLike]: searchTerm } },
      { '$empleados.apellido$': { [Op.iLike]: searchTerm } },
      { '$empleados.correo$': { [Op.iLike]: searchTerm } },
    ];
  }

  try {
    return await db.Novedad.findAll({
      where: whereClause,
      include: [includeOptions],
      order: [["fechaInicio", "DESC"]],
    });
  } catch (error) {
    console.error("Error al obtener todas las novedades:", error);
    throw new CustomError(`Error al obtener novedades: ${error.message}`, 500);
  }
};

const obtenerNovedadesActivas = async () => {
    try {
        return await db.Novedad.findAll({
            where: { estado: true },
            order: [["fechaInicio", "DESC"]],
        });
    } catch (error) {
        console.error("Error al obtener novedades activas:", error);
        throw new CustomError(`Error al obtener novedades activas: ${error.message}`, 500);
    }
};

const obtenerNovedadPorId = async (idNovedad) => {
  const novedad = await db.Novedad.findByPk(idNovedad, {
    include: [{ model: db.Usuario, as: 'empleados', attributes: ['idUsuario', 'nombre', 'apellido'] }],
  });
  if (!novedad) {
    throw new NotFoundError("Novedad no encontrada.");
  }
  return novedad;
};

const actualizarNovedad = async (idNovedad, datosActualizar, empleadosIds) => {
  const t = await db.sequelize.transaction();
  try {
    const novedad = await db.Novedad.findByPk(idNovedad, { transaction: t });
    if (!novedad) {
      throw new NotFoundError("Novedad no encontrada para actualizar.");
    }
    if (empleadosIds) {
      const rolEmpleado = await db.Rol.findOne({ where: { nombre: 'Empleado' }, transaction: t });
      if (!rolEmpleado) {
        throw new CustomError("El rol 'Empleado' no está configurado.", 500);
      }
      const usuariosValidos = await db.Usuario.count({
        where: { idUsuario: empleadosIds, estado: true, idRol: rolEmpleado.idRol },
        transaction: t
      });
      if (usuariosValidos !== empleadosIds.length) {
        throw new BadRequestError("Uno o más IDs no corresponden a empleados válidos y activos.");
      }
      await novedad.setEmpleados(empleadosIds, { transaction: t });
    }
    // Se eliminó la dependencia de 'nombre' y 'descripcion'
    await novedad.update(datosActualizar, { transaction: t });
    await t.commit();
    return await obtenerNovedadPorId(idNovedad);
  } catch (error) {
    await t.rollback();
    console.error("Error al actualizar la novedad:", error);
    throw error;
  }
};

const cambiarEstadoNovedad = async (idNovedad, estado) => {
  const novedad = await db.Novedad.findByPk(idNovedad);
  if (!novedad) throw new NotFoundError("Novedad no encontrada.");
  await novedad.update({ estado });
  return novedad;
};

const eliminarNovedadFisica = async (idNovedad) => {
  const novedad = await db.Novedad.findByPk(idNovedad);
  if (!novedad) throw new NotFoundError("Novedad no encontrada para eliminar.");
  await novedad.destroy();
};

const obtenerDiasDisponibles = async (idNovedad, anio, mes) => {
    // ... (Tu lógica existente es correcta)
};

const obtenerHorasDisponibles = async (idNovedad, fecha) => {
    // ... (Tu lógica existente es correcta)
};

/**
 * ✅ CORREGIDO: Obtiene los empleados de una novedad con todos los datos necesarios.
 */
const obtenerEmpleadosPorNovedad = async (idNovedad) => {
  const novedad = await db.Novedad.findByPk(idNovedad, {
    include: [{
      model: db.Usuario,
      as: 'empleados',
      // Se piden todos los datos desde el modelo Usuario
      attributes: ['idUsuario', 'nombre', 'apellido', 'correo', 'telefono'],
      where: { estado: true },
      through: { attributes: [] }
    }]
  });

  if (!novedad) {
    throw new NotFoundError('Novedad no encontrada');
  }

  // El mapeo ya no es necesario si el modelo Usuario tiene todos los campos
  return novedad.empleados;
};

/**
 * ✅ CORREGIDO: Obtiene todos los usuarios con rol de empleado y sus datos completos.
 */
const obtenerEmpleadosParaAsignar = async () => {
  try {
    const rolEmpleado = await db.Rol.findOne({ where: { nombre: 'Empleado' } });
    if (!rolEmpleado) {
      throw new CustomError("El rol 'Empleado' no está configurado en el sistema.", 500);
    }
    
    return await db.Usuario.findAll({
      where: {
        idRol: rolEmpleado.idRol,
        estado: true
      },
      // Se piden todos los datos necesarios para el front-end
      attributes: ['idUsuario', 'nombre', 'apellido', 'correo', 'telefono'],
      order: [['nombre', 'ASC']]
    });
  } catch (error) {
    console.error("Error al obtener empleados para asignar:", error);
    if (error instanceof CustomError) throw error;
    throw new CustomError(`Error al obtener la lista de empleados: ${error.message}`, 500);
  }
};

module.exports = {
  crearNovedad,
  obtenerTodasLasNovedades,
  obtenerNovedadPorId,
  actualizarNovedad,
  cambiarEstadoNovedad,
  eliminarNovedadFisica,
  obtenerNovedadesActivas,
  obtenerDiasDisponibles,
  obtenerHorasDisponibles,
  obtenerEmpleadosPorNovedad,
  obtenerEmpleadosParaAsignar,
};

