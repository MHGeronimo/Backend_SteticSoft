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
 * ✅ NUEVA FUNCIÓN: Obtiene solo las novedades activas para el módulo de citas.
 */
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

/**
 * Obtiene días disponibles para una novedad (para el Paso 2 del frontend)
 */
const obtenerDiasDisponibles = async (idNovedad, anio, mes) => {
  const novedad = await db.Novedad.findByPk(idNovedad);
  if (!novedad) {
    throw new NotFoundError('Novedad no encontrada');
  }

  // Convertir días JSON a array de números
  const diasDisponibles = Array.isArray(novedad.dias) ? novedad.dias : JSON.parse(novedad.dias);
  
  // Generar todos los días del mes que coincidan con los días disponibles
  const fechaInicio = moment(`${anio}-${mes}-01`);
  const fechaFin = fechaInicio.clone().endOf('month');
  const diasDelMes = [];

  while (fechaInicio.isSameOrBefore(fechaFin)) {
    if (diasDisponibles.includes(fechaInicio.isoWeekday())) {
      // Verificar que la fecha esté dentro del rango de la novedad
      const fechaActual = fechaInicio.clone();
      const fechaInicioNovedad = moment(novedad.fechaInicio);
      const fechaFinNovedad = moment(novedad.fechaFin);
      
      if (fechaActual.isBetween(fechaInicioNovedad, fechaFinNovedad, null, '[]')) {
        diasDelMes.push(fechaActual.format('YYYY-MM-DD'));
      }
    }
    fechaInicio.add(1, 'day');
  }

  return diasDelMes;
};

/**
 * Obtiene horarios disponibles para una novedad y fecha (Paso 3 del frontend)
 */
const obtenerHorasDisponibles = async (idNovedad, fecha) => {
  const novedad = await db.Novedad.findByPk(idNovedad);
  if (!novedad) {
    throw new NotFoundError('Novedad no encontrada');
  }

  const fechaMoment = moment(fecha);
  const diaSemana = fechaMoment.isoWeekday();
  
  // Verificar si el día está disponible en la novedad
  const diasDisponibles = Array.isArray(novedad.dias) ? novedad.dias : JSON.parse(novedad.dias);
  if (!diasDisponibles.includes(diaSemana)) {
    return [];
  }

  // Verificar que la fecha esté dentro del rango de la novedad
  const fechaInicioNovedad = moment(novedad.fechaInicio);
  const fechaFinNovedad = moment(novedad.fechaFin);
  if (!fechaMoment.isBetween(fechaInicioNovedad, fechaFinNovedad, null, '[]')) {
    return [];
  }

  // Generar slots de tiempo disponibles
  const horariosDisponibles = [];
  const horaInicio = moment(novedad.horaInicio, 'HH:mm:ss');
  const horaFin = moment(novedad.horaFin, 'HH:mm:ss');
  
  // Obtener citas existentes para esta fecha y novedad
  const citasExistentes = await db.Cita.findAll({
    where: {
      fechaHora: {
        [Op.between]: [
          fechaMoment.startOf('day').toDate(),
          fechaMoment.endOf('day').toDate()
        ]
      },
      idNovedad: idNovedad
    }
  });

  // Generar horarios cada 30 minutos
  let horaActual = horaInicio.clone();
  while (horaActual.isBefore(horaFin)) {
    const horarioFormateado = horaActual.format('HH:mm');
    
    // Verificar si ya existe una cita en este horario
    const citaExistente = citasExistentes.find(cita => 
      moment(cita.fechaHora).format('HH:mm') === horarioFormateado
    );
    
    if (!citaExistente) {
      horariosDisponibles.push(horarioFormateado);
    }
    
    horaActual.add(30, 'minutes');
  }

  return horariosDisponibles;
};

/**
 * Obtiene empleados asociados a una novedad (Paso 5 del frontend)
 */
const obtenerEmpleadosPorNovedad = async (idNovedad) => {
  const novedad = await db.Novedad.findByPk(idNovedad, {
    include: [{
      model: db.Usuario,
      as: 'empleados',
      attributes: ['idUsuario', 'nombre', 'correo'],
      through: { attributes: [] },
      include: [{
        model: db.Empleado,
        as: 'empleadoInfo',
        attributes: ['telefono']
      }]
    }]
  });

  if (!novedad) {
    throw new NotFoundError('Novedad no encontrada');
  }

  // Formatear respuesta para incluir teléfono
  return novedad.empleados.map(empleado => ({
    idUsuario: empleado.idUsuario,
    nombre: empleado.nombre,
    correo: empleado.correo,
    telefono: empleado.empleadoInfo?.telefono || 'No disponible'
  }));
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
  obtenerEmpleadosPorNovedad
};