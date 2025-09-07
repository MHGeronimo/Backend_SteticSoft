//src/services/cita.service.js
"use strict";

const db = require("../models");
const { Op } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors");
const moment = require("moment-timezone");
const { enviarCorreoCita } = require('../utils/CitaEmailTemplate.js');
const { formatDateTime } = require('../utils/dateHelpers.js');

// Helper para obtener la información completa de una cita
const obtenerCitaCompletaPorIdInterno = async (idCita, transaction = null) => {
  return db.Cita.findByPk(idCita, {
    include: [
      { model: db.Cliente, as: "cliente" },
      { model: db.Usuario, as: "empleado", required: false },
      { model: db.Estado, as: "estadoDetalle" },
      { model: db.Servicio, as: "serviciosProgramados", through: { attributes: [] } },
    ],
    transaction,
  });
};

// Crea una cita, con validaciones robustas
const crearCita = async (datosCita) => {
  const { fechaHora, idCliente, idUsuario, servicios = [], idNovedad } = datosCita;

  const novedad = await db.Novedad.findByPk(idNovedad, { 
    include: [{ model: db.Usuario, as: 'empleados', attributes: ['idUsuario'] }] 
  });
  if (!novedad) throw new BadRequestError(`La novedad con ID ${idNovedad} no fue encontrada.`);
  
  const empleadoValido = novedad.empleados.some(emp => emp.idUsuario === idUsuario);
  if (!empleadoValido) throw new BadRequestError(`El empleado con ID ${idUsuario} no está asociado a la novedad.`);

  const estadoPendiente = await db.Estado.findOne({ where: { nombreEstado: 'Pendiente' } });
  if (!estadoPendiente) throw new BadRequestError('El estado inicial "Pendiente" no está configurado.');

  const transaction = await db.sequelize.transaction();
  try {
    // ✅ CORRECCIÓN: Se añade una validación de concurrencia.
    // Se verifica si ya existe una cita en el mismo slot justo antes de crearla.
    const citaExistente = await db.Cita.findOne({
      where: {
        fechaHora: fechaHora,
        idNovedad: idNovedad,
      },
      transaction
    });

    if (citaExistente) {
      throw new ConflictError("Este horario acaba de ser reservado. Por favor, selecciona otro.");
    }

    const nuevaCita = await db.Cita.create({
        fechaHora,
        idCliente,
        idUsuario,
        idEstado: estadoPendiente.idEstado,
        idNovedad,
        estado: true,
      }, { transaction }
    );

    if (servicios.length > 0) {
        const serviciosDb = await db.Servicio.findAll({ where: { idServicio: servicios, estado: true }});
        if (serviciosDb.length !== servicios.length) throw new BadRequestError("Uno o más servicios no existen o están inactivos.");
        await nuevaCita.addServiciosProgramados(serviciosDb, { transaction });
    }

    await transaction.commit();
    return await obtenerCitaCompletaPorIdInterno(nuevaCita.idCita);
  } catch (error) {
    await transaction.rollback();
    if (error instanceof BadRequestError || error instanceof ConflictError) throw error;
    console.error("Error al crear la cita en el servicio:", error.stack);
    throw new CustomError(`Error al crear la cita: ${error.message}`, 500);
  }
};


// Obtiene todas las citas, permitiendo filtrar por el ID del estado
const obtenerTodasLasCitas = async (opcionesDeFiltro = {}) => {
  const whereClause = {};
  
  // ✅ LÓGICA RESTAURADA: Se filtra por 'idEstado' (FK) en lugar del booleano.
  if (opcionesDeFiltro.idEstado) whereClause.idEstado = opcionesDeFiltro.idEstado;
  if (opcionesDeFiltro.idCliente) whereClause.idCliente = opcionesDeFiltro.idCliente;
  if (opcionesDeFiltro.idUsuario) whereClause.idUsuario = opcionesDeFiltro.idUsuario;

  if (opcionesDeFiltro.fecha) {
    const fechaInicio = moment(opcionesDeFiltro.fecha).startOf("day").toDate();
    const fechaFin = moment(opcionesDeFiltro.fecha).endOf("day").toDate();
    whereClause.fechaHora = { [Op.gte]: fechaInicio, [Op.lte]: fechaFin };
  }
  try {
    return await db.Cita.findAll({
      where: whereClause,
      include: [
        { model: db.Cliente, as: "cliente" },
        { model: db.Usuario, as: "empleado", required: false },
        { model: db.Estado, as: "estadoDetalle" },
        { model: db.Servicio, as: "serviciosProgramados", through: { attributes: [] } },
      ],
      order: [["fechaHora", "ASC"]],
    });
  } catch (error) {
    console.error("Error al obtener todas las citas:", error.message);
    throw new CustomError(`Error al obtener citas: ${error.message}`, 500);
  }
};

const obtenerDiasDisponiblesPorNovedad = async (idNovedad, mes, año) => {
  const novedad = await db.Novedad.findByPk(idNovedad);
  if (!novedad) {
    throw new NotFoundError('Novedad no encontrada');
  }

  // Convertir días JSON a array de números
  const diasDisponibles = Array.isArray(novedad.dias) ? novedad.dias : JSON.parse(novedad.dias);
  
  // Generar todos los días del mes que coincidan con los días disponibles
  const fechaInicio = moment(`${año}-${mes}-01`);
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

const obtenerHorariosDisponiblesPorNovedad = async (idNovedad, fecha) => {
  const novedad = await db.Novedad.findByPk(idNovedad);
  if (!novedad || !novedad.estado) throw new NotFoundError('Novedad no encontrada o inactiva');

  const fechaMoment = moment.tz(fecha, "America/Bogota");
  const diaSemana = fechaMoment.isoWeekday();
  
  const diasDisponibles = Array.isArray(novedad.dias) ? novedad.dias : JSON.parse(novedad.dias);
  if (!diasDisponibles.includes(diaSemana)) return [];

  if (!fechaMoment.isBetween(moment(novedad.fechaInicio), moment(novedad.fechaFin), 'day', '[]')) return [];

  // 1. Obtener las citas ya agendadas para ese día y esa novedad
  const citasExistentes = await db.Cita.findAll({
    where: {
      idNovedad,
      fechaHora: {
        [Op.between]: [fechaMoment.startOf('day').toDate(), fechaMoment.endOf('day').toDate()]
      }
    },
    attributes: ['fechaHora']
  });
  const horariosOcupados = new Set(citasExistentes.map(c => moment(c.fechaHora).format('HH:mm')));

  // 2. Generar dinámicamente los slots de tiempo
  const horariosDisponibles = [];
  let horaActual = moment.tz(`${fecha} ${novedad.horaInicio}`, "America/Bogota");
  const horaFin = moment.tz(`${fecha} ${novedad.horaFin}`, "America/Bogota");
  
  while (horaActual.isBefore(horaFin)) {
    const horarioFormateado = horaActual.format('HH:mm');
    // 3. Añadir el slot a la lista solo si no está en el conjunto de ocupados
    if (!horariosOcupados.has(horarioFormateado)) {
      horariosDisponibles.push(horaActual.format('HH:mm:ss'));
    }
    horaActual.add(30, 'minutes'); // Asumiendo slots de 30 minutos
  }
  
  return horariosDisponibles;
};

const obtenerCitaPorId = async (idCita) => {
  const cita = await obtenerCitaCompletaPorIdInterno(idCita);
  if (!cita) {
    throw new NotFoundError("Cita no encontrada.");
  }
  return cita;
};

const actualizarCita = async (idCita, datosActualizar) => {
  const transaction = await db.sequelize.transaction();
  try {
    const cita = await db.Cita.findByPk(idCita, { transaction });
    if (!cita) throw new NotFoundError("Cita no encontrada para actualizar.");
    
    await cita.update(datosActualizar, { transaction });

    if (datosActualizar.servicios && Array.isArray(datosActualizar.servicios)) {
        const serviciosDb = await db.Servicio.findAll({ where: { idServicio: datosActualizar.servicios, estado: true }, transaction });
        if (serviciosDb.length !== datosActualizar.servicios.length) throw new BadRequestError("Uno o más servicios para actualizar no existen o están inactivos.");
        await cita.setServiciosProgramados(serviciosDb, { transaction });
    }

    await transaction.commit();
    return await obtenerCitaCompletaPorIdInterno(idCita);
  } catch (error) {
    await transaction.rollback();
    throw new CustomError(`Error al actualizar la cita: ${error.message}`, 500);
  }
};

// Helper para cambiar el estado de la cita buscando el estado por nombre
const cambiarEstadoPorNombre = async (idCita, nombreEstado) => {
    const estado = await db.Estado.findOne({ where: { nombreEstado } });
    if (!estado) {
        throw new BadRequestError(`El estado "${nombreEstado}" no es válido.`);
    }
    const cita = await db.Cita.findByPk(idCita);
    if (!cita) {
        throw new NotFoundError("Cita no encontrada.");
    }
    await cita.update({ idEstado: estado.idEstado });
    return await obtenerCitaCompletaPorIdInterno(idCita);
}

const anularCita = async (idCita) => {
  return cambiarEstadoPorNombre(idCita, 'Cancelada');
};

const habilitarCita = async (idCita) => {
  // Habilitar generalmente significa volver al estado inicial o 'Pendiente'
  return cambiarEstadoPorNombre(idCita, 'Pendiente');
};

const eliminarCitaFisica = async (idCita) => {
  const cita = await db.Cita.findByPk(idCita);
  if (!cita) {
    throw new NotFoundError("Cita no encontrada para eliminar.");
  }
  
  const ventasAsociadasCount = await cita.countDetallesVenta();
  if (ventasAsociadasCount > 0) {
    throw new ConflictError(`No se puede eliminar la cita porque tiene ${ventasAsociadasCount} servicio(s) facturado(s).`);
  }

  await cita.destroy();
  return { message: "Cita eliminada permanentemente." };
};

const agregarServiciosACita = async (idCita, idServicios) => {
  const cita = await db.Cita.findByPk(idCita);
  if (!cita) throw new NotFoundError("Cita no encontrada.");

  const servicios = await db.Servicio.findAll({ where: { idServicio: idServicios, estado: true } });
  if (servicios.length !== idServicios.length) throw new BadRequestError("Uno o más servicios no existen o están inactivos.");

  await cita.addServiciosProgramados(servicios);
  return await obtenerCitaCompletaPorIdInterno(idCita);
};

const quitarServiciosDeCita = async (idCita, idServicios) => {
  const cita = await db.Cita.findByPk(idCita);
  if (!cita) throw new NotFoundError("Cita no encontrada.");
  
  await cita.removeServiciosProgramados(idServicios);
  return await obtenerCitaCompletaPorIdInterno(idCita);
};

// Función para cambiar estado booleano (debe llamarse diferente)
const cambiarEstadoBooleanoCita = async (idCita, estado) => {
  const cita = await db.Cita.findByPk(idCita);
  if (!cita) {
    throw new NotFoundError("Cita no encontrada.");
  }
  
  await cita.update({ estado });
  return await obtenerCitaCompletaPorIdInterno(idCita);
};

// Obtener empleados por novedad
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

// Buscar clientes
const buscarClientes = async (terminoBusqueda) => {
  return await db.Cliente.findAll({
    where: {
      [Op.or]: [
        { nombre: { [Op.iLike]: `%${terminoBusqueda}%` } },
        { apellido: { [Op.iLike]: `%${terminoBusqueda}%` } },
        { correo: { [Op.iLike]: `%${terminoBusqueda}%` } }
      ],
      estado: true
    },
    limit: 10,
    attributes: ['idCliente', 'nombre', 'apellido', 'correo', 'telefono']
  });
};

// Obtener servicios disponibles
const obtenerServiciosDisponibles = async () => {
  return await db.Servicio.findAll({
    where: { estado: true },
    attributes: ['idServicio', 'nombre', 'precio', 'descripcion'],
    order: [['nombre', 'ASC']]
  });
};

module.exports = {
  crearCita,
  obtenerTodasLasCitas,
  obtenerDiasDisponiblesPorNovedad,
  obtenerHorariosDisponiblesPorNovedad,
  buscarClientes,
  obtenerCitaPorId,
  actualizarCita,
  anularCita,
  habilitarCita,
  eliminarCitaFisica,
  agregarServiciosACita,
  quitarServiciosDeCita,
  obtenerEmpleadosPorNovedad,
  obtenerServiciosDisponibles,
  cambiarEstadoBooleanoCita
};

