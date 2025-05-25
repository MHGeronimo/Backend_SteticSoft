// src/services/cita.service.js
"use strict";

const db = require("../models");
const { Op } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors"); // Ajusta la ruta si es necesario
const moment = require("moment-timezone");
const { enviarCorreoCita } = require('../utils/CitaEmailTemplate.js');
const { formatDateTime } = require('../utils/dateHelpers.js');

/**
 * Calcula la duración total estimada de los servicios de una cita.
 * @param {Array<object>} serviciosProgramados - Array de objetos de servicio con 'duracion_estimada'.
 * @returns {number} Duración total en minutos.
 */
// src/services/cita.service.js

const calcularDuracionTotalParaCorreo = (serviciosProgramados) => {
  let duracionTotal = 0;
  if (serviciosProgramados && serviciosProgramados.length > 0) {
    // console.log("[calcularDuracionTotalParaCorreo] DEBUG: serviciosProgramados recibidos:", JSON.stringify(serviciosProgramados, null, 2));
// Dentro de calcularDuracionTotalParaCorreo en cita.service.js
duracionTotal = serviciosProgramados.reduce(
  (sum, s) => {
    // Intenta acceder a través de dataValues
    const duracion = s.dataValues ? s.dataValues.duracion_estimada : s.duracion_estimada;
    // console.log(`[calcularDuracionTotalParaCorreo] DEBUG: Servicio: ${s.nombre}, s.dataValues.duracion_estimada: ${s.dataValues ? s.dataValues.duracion_estimada : 'N/A'}, s.duracion_estimada: ${s.duracion_estimada}`);
    return sum + (Number(duracion) || 0);
  },
  0
);
  }
  // console.log("[calcularDuracionTotalParaCorreo] DEBUG: duracionTotal calculada:", duracionTotal);
  return duracionTotal;
};

/**
 * Obtener una cita por su ID con todos los detalles necesarios para notificaciones y lógica interna.
 * Esta es una función helper interna.
 */
const obtenerCitaCompletaPorIdInterno = async (idCita, transaction = null) => {
  return db.Cita.findByPk(idCita, {
    include: [
      {
        model: db.Cliente,
        as: "cliente",
        attributes: ["idCliente", "nombre", "correo", "estado"], // Asegúrate de incluir 'apellido' si lo necesitas para 'nombreCliente'
      },
      {
        model: db.Empleado,
        as: "empleado",
        attributes: ["idEmpleado", "nombre"],
        required: false,
      },
      {
        model: db.Estado,
        as: "estadoDetalle",
        attributes: ["idEstado", "nombreEstado"],
      },
      {
        model: db.Servicio,
        as: "serviciosProgramados",
        attributes: [
          "idServicio",
          "nombre",
          "precio",
          "descripcion",
          "duracion_estimada",
        ],
        through: { attributes: [] },
      },
    ],
    transaction,
  });
};

/**
 * Crear una nueva cita y asociar sus servicios.
 */
const crearCita = async (datosCita) => {
  const {
    fechaHora,
    clienteId,
    empleadoId,
    estadoCitaId,
    servicios = [],
    estado,
  } = datosCita;

  // Validación de IDs y existencia de entidades relacionadas (como lo tenías)
  const cliente = await db.Cliente.findOne({
    where: { idCliente: clienteId, estado: true },
  });
  if (!cliente)
    throw new BadRequestError(
      `Cliente con ID ${clienteId} no encontrado o inactivo.`
    );

  const estadoProcesoCita = await db.Estado.findByPk(estadoCitaId);
  if (!estadoProcesoCita)
    throw new BadRequestError(
      `Estado de cita con ID ${estadoCitaId} no encontrado.`
    );

  let empleado = null;
  if (empleadoId) {
    empleado = await db.Empleado.findOne({
      where: { idEmpleado: empleadoId, estado: true },
    });
    if (!empleado)
      throw new BadRequestError(
        `Empleado con ID ${empleadoId} no encontrado o inactivo.`
      );
  }

  const serviciosConsultados = [];
  if (servicios.length > 0) {
    const serviciosDB = await db.Servicio.findAll({
      where: { idServicio: servicios, estado: true },
    });
    if (serviciosDB.length !== servicios.length) {
      const idsEncontrados = serviciosDB.map((s) => s.idServicio);
      const idsNoEncontradosOInactivos = servicios.filter(
        (id) => !idsEncontrados.includes(id)
      );
      throw new BadRequestError(
        `Uno o más servicios no existen o están inactivos: IDs ${idsNoEncontradosOInactivos.join(
          ", "
        )}`
      );
    }
    serviciosConsultados.push(...serviciosDB);
  }

  // Lógica de validación de disponibilidad de horario (como la tenías)
  if (empleado && serviciosConsultados.length > 0) {
    const fechaHoraInicioMoment = moment(fechaHora);
    let duracionTotalCitaMinutos = 0;
    serviciosConsultados.forEach((s) => {
      duracionTotalCitaMinutos += s.duracion_estimada || 0;
    });
    const fechaHoraFinMoment = fechaHoraInicioMoment
      .clone()
      .add(duracionTotalCitaMinutos, "minutes");

    const citasSuperpuestas = await db.Cita.findOne({
      where: {
        empleadoId: empleado.idEmpleado,
        estado: true,
        idCita: { [Op.ne]: null }, // Para evitar auto-colisión en una actualización futura
        fechaHora: { // Lógica simplificada de superposición
          [Op.lt]: fechaHoraFinMoment.toDate(),
          [Op.gte]: fechaHoraInicioMoment.toDate(),
        }
      },
    });
    if (citasSuperpuestas) {
      throw new ConflictError(
        `El empleado ${empleado.nombre} ya tiene una cita programada que se superpone con el horario solicitado.`
      );
    }
  }

  const transaction = await db.sequelize.transaction();
  try {
    const nuevaCita = await db.Cita.create(
      {
        fechaHora,
        clienteId,
        empleadoId: empleadoId || null,
        estadoCitaId,
        estado: typeof estado === "boolean" ? estado : true,
      },
      { transaction }
    );

    if (serviciosConsultados.length > 0) {
      await nuevaCita.addServiciosProgramados(serviciosConsultados, {
        transaction,
      });
    }

    await transaction.commit();

    // Obtener la cita completa con todos los detalles para la respuesta Y el correo
    const citaCreadaConDetalles = await obtenerCitaCompletaPorIdInterno(
      nuevaCita.idCita
    );

    // --- ENVÍO DE CORREO AL CREAR CITA ---
    if (
      citaCreadaConDetalles &&
      citaCreadaConDetalles.cliente &&
      citaCreadaConDetalles.cliente.correo &&
      citaCreadaConDetalles.estado // Estado booleano de la Cita (activa/inactiva)
    ) {
      // Preparar información para el correo
      const duracionTotalParaCorreo = calcularDuracionTotalParaCorreo(
        citaCreadaConDetalles.serviciosProgramados
      );
      const citaInfoParaCorreo = {
        accion: 'agendada',
        fechaHora: formatDateTime(citaCreadaConDetalles.fechaHora),
        empleado: citaCreadaConDetalles.empleado ? citaCreadaConDetalles.empleado.nombre : 'No asignado',
        estado: citaCreadaConDetalles.estadoDetalle ? citaCreadaConDetalles.estadoDetalle.nombreEstado : 'Desconocido',
        servicios: citaCreadaConDetalles.serviciosProgramados.map(s => ({
          nombre: s.nombre,
          precio: s.precio,
          descripcion: s.descripcion,
          duracion_estimada: s.duracion_estimada
        })),
        total: citaCreadaConDetalles.serviciosProgramados.reduce((sum, s) => sum + Number(s.precio || 0), 0),
        duracionTotalEstimada: duracionTotalParaCorreo,
      };
      
      // OPCIONAL: Log de depuración antes de enviar el correo
      // console.log("DEBUG: citaInfo que se pasa a enviarCorreoCita:", JSON.stringify(citaInfoParaCorreo, null, 2));

      try {
        await enviarCorreoCita({
          correo: citaCreadaConDetalles.cliente.correo,
          nombreCliente: citaCreadaConDetalles.cliente.nombre || 'Cliente', // Ajusta el nombre del cliente si es necesario
          citaInfo: citaInfoParaCorreo
        });
      } catch (emailError) {
        console.error(
          // Corregido para usar el correo del cliente correcto en el log
          `Error al enviar correo de notificación de nueva cita ${nuevaCita.idCita} a ${citaCreadaConDetalles.cliente.correo}:`,
          emailError
        );
      }
    }
    // --- FIN ENVÍO DE CORREO ---

    return citaCreadaConDetalles; // Devolver la cita completa
  } catch (error) {
    await transaction.rollback();
    if (
      error instanceof NotFoundError ||
      error instanceof BadRequestError ||
      error instanceof ConflictError
    )
      throw error;
    console.error(
      "Error al crear la cita en el servicio:",
      error.message,
      error.stack
    );
    throw new CustomError(`Error al crear la cita: ${error.message}`, 500);
  }
};

const obtenerTodasLasCitas = async (opcionesDeFiltro = {}) => {
  // ... (sin cambios, ya incluye los servicios y sus duraciones si están en el modelo)
  const whereClause = {};
  if (opcionesDeFiltro.hasOwnProperty('estado')) whereClause.estado = opcionesDeFiltro.estado;
  if (opcionesDeFiltro.clienteId) whereClause.clienteId = opcionesDeFiltro.clienteId;
  if (opcionesDeFiltro.empleadoId) whereClause.empleadoId = opcionesDeFiltro.empleadoId;
  if (opcionesDeFiltro.estadoCitaId) whereClause.estadoCitaId = opcionesDeFiltro.estadoCitaId;
  if (opcionesDeFiltro.fecha) {
    const fechaInicio = moment(opcionesDeFiltro.fecha).startOf("day").toDate();
    const fechaFin = moment(opcionesDeFiltro.fecha).endOf("day").toDate();
    whereClause.fechaHora = { [Op.gte]: fechaInicio, [Op.lte]: fechaFin };
  }
  try {
    return await db.Cita.findAll({
      where: whereClause,
      include: [
        { model: db.Cliente, as: "cliente", attributes: ["idCliente", "nombre", "apellido"] },
        { model: db.Empleado, as: "empleado", attributes: ["idEmpleado", "nombre"], required: false },
        { model: db.Estado, as: "estadoDetalle", attributes: ["idEstado", "nombreEstado"] },
        { model: db.Servicio, as: "serviciosProgramados", attributes: ["idServicio", "nombre", "precio", "duracion_estimada"], through: { attributes: [] } },
      ],
      order: [["fechaHora", "ASC"]],
    });
  } catch (error) {
    console.error("Error al obtener todas las citas:", error.message);
    throw new CustomError(`Error al obtener citas: ${error.message}`, 500);
  }
};

const obtenerCitaPorId = async (idCita) => {
  const cita = await obtenerCitaCompletaPorIdInterno(idCita);
  if (!cita) {
    throw new NotFoundError("Cita no encontrada.");
  }
  return cita;
};

const actualizarCita = async (idCita, datosActualizar) => {
  const { fechaHora, clienteId, empleadoId, estadoCitaId, estado } = datosActualizar;
  const transaction = await db.sequelize.transaction();
  try {
    const cita = await db.Cita.findByPk(idCita, { transaction });
    if (!cita) { await transaction.rollback(); throw new NotFoundError("Cita no encontrada para actualizar."); }

    let clienteParaCorreo = cita.clienteId ? await db.Cliente.findByPk(cita.clienteId, {attributes: ['nombre', 'correo'], transaction}) : null;

    if (clienteId && clienteId !== cita.clienteId) {
      const clienteNuevo = await db.Cliente.findOne({ where: { idCliente: clienteId, estado: true }, transaction });
      if (!clienteNuevo) { await transaction.rollback(); throw new BadRequestError(`Nuevo cliente con ID ${clienteId} no encontrado o inactivo.`); }
      clienteParaCorreo = clienteNuevo;
    }
    // ... (otras validaciones para empleadoId, estadoCitaId como las tenías)

    await cita.update(datosActualizar, { transaction });
    await transaction.commit(); // Commit antes de obtener datos para el correo

    const citaActualizadaConDetalles = await obtenerCitaCompletaPorIdInterno(cita.idCita);

    if (citaActualizadaConDetalles && clienteParaCorreo && clienteParaCorreo.correo && citaActualizadaConDetalles.estado) {
      try {
        const duracionTotalParaCorreo = calcularDuracionTotalParaCorreo(citaActualizadaConDetalles.serviciosProgramados);
        await enviarCorreoCita({
          correo: clienteParaCorreo.correo,
          nombreCliente: clienteParaCorreo.nombre || 'Cliente',
          citaInfo: {
            accion: 'actualizada',
            fechaHora: formatDateTime(citaActualizadaConDetalles.fechaHora),
            empleado: citaActualizadaConDetalles.empleado ? citaActualizadaConDetalles.empleado.nombre : 'No asignado',
            estado: citaActualizadaConDetalles.estadoDetalle ? citaActualizadaConDetalles.estadoDetalle.nombreEstado : 'Desconocido',
            servicios: citaActualizadaConDetalles.serviciosProgramados.map(s => ({ nombre: s.nombre, precio: s.precio, descripcion: s.descripcion, duracion_estimada: s.duracion_estimada })),
            total: citaActualizadaConDetalles.serviciosProgramados.reduce((sum, s) => sum + Number(s.precio || 0), 0),
            duracionTotalEstimada: duracionTotalParaCorreo,
            mensajeAdicional: 'Los detalles de tu cita han sido actualizados.'
          }
        });
      } catch (emailError) {
        console.error(`Error al enviar correo de actualización de cita ${cita.idCita}:`, emailError);
      }
    }
    return citaActualizadaConDetalles;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError || error instanceof BadRequestError || error instanceof ConflictError) throw error;
    console.error(`Error al actualizar la cita con ID ${idCita} en el servicio:`, error.message, error.stack);
    throw new CustomError(`Error al actualizar la cita: ${error.message}`, 500);
  }
};

const anularCita = async (idCita) => {
  const transaction = await db.sequelize.transaction();
  try {
    const cita = await db.Cita.findByPk(idCita, { 
        include: [{model: db.Cliente, as: 'cliente', attributes: ['nombre', 'correo']}], // Para el correo
        transaction 
    });
    if (!cita) { await transaction.rollback(); throw new NotFoundError("Cita no encontrada para anular."); }
    if (!cita.estado) { await transaction.rollback(); return cita; }

    const estadoCancelado = await db.Estado.findOne({ where: { nombreEstado: 'Cancelado' }, transaction });
    await cita.update({ 
        estado: false, 
        estadoCitaId: estadoCancelado ? estadoCancelado.idEstado : cita.estadoCitaId 
    }, { transaction });
    await transaction.commit();
    
    const citaAnuladaConDetalles = await obtenerCitaCompletaPorIdInterno(cita.idCita);

    if (citaAnuladaConDetalles && cita.cliente && cita.cliente.correo) {
        try {
            const duracionTotalParaCorreo = calcularDuracionTotalParaCorreo(citaAnuladaConDetalles.serviciosProgramados);
            await enviarCorreoCita({
                correo: cita.cliente.correo,
                nombreCliente: cita.cliente.nombre || 'Cliente',
                citaInfo: {
                    accion: 'cancelada',
                    fechaHora: formatDateTime(citaAnuladaConDetalles.fechaHora),
                    empleado: citaAnuladaConDetalles.empleado ? citaAnuladaConDetalles.empleado.nombre : 'No asignado',
                    estado: citaAnuladaConDetalles.estadoDetalle ? citaAnuladaConDetalles.estadoDetalle.nombreEstado : 'Cancelada',
                    servicios: citaAnuladaConDetalles.serviciosProgramados.map(s => ({ nombre: s.nombre, precio: s.precio, descripcion: s.descripcion, duracion_estimada: s.duracion_estimada })),
                    total: citaAnuladaConDetalles.serviciosProgramados.reduce((sum, s) => sum + Number(s.precio || 0), 0),
                    duracionTotalEstimada: duracionTotalParaCorreo,
                }
            });
        } catch (emailError) {
            console.error(`Error al enviar correo de anulación de cita ${cita.idCita}:`, emailError);
        }
    }
    return citaAnuladaConDetalles;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError) throw error;
    console.error(`Error al anular la cita con ID ${idCita} en el servicio:`, error.message);
    throw new CustomError(`Error al anular la cita: ${error.message}`, 500);
  }
};

const habilitarCita = async (idCita) => {
  const transaction = await db.sequelize.transaction();
  try {
    const cita = await db.Cita.findByPk(idCita, { 
        include: [{model: db.Cliente, as: 'cliente', attributes: ['nombre', 'correo']}],
        transaction 
    });
    if (!cita) { await transaction.rollback(); throw new NotFoundError("Cita no encontrada para habilitar."); }
    if (cita.estado) { await transaction.rollback(); return cita; }

    const estadoPendiente = await db.Estado.findOne({ where: { nombreEstado: 'Pendiente' }, transaction }); // O 'Agendada'
    await cita.update({ 
        estado: true, 
        estadoCitaId: estadoPendiente ? estadoPendiente.idEstado : cita.estadoCitaId 
    }, { transaction });
    await transaction.commit();

    const citaHabilitadaConDetalles = await obtenerCitaCompletaPorIdInterno(cita.idCita);

    if (citaHabilitadaConDetalles && cita.cliente && cita.cliente.correo) {
        try {
            const duracionTotalParaCorreo = calcularDuracionTotalParaCorreo(citaHabilitadaConDetalles.serviciosProgramados);
            await enviarCorreoCita({
                correo: cita.cliente.correo,
                nombreCliente: cita.cliente.nombre || 'Cliente',
                citaInfo: {
                    accion: 'reactivada',
                    fechaHora: formatDateTime(citaHabilitadaConDetalles.fechaHora),
                    empleado: citaHabilitadaConDetalles.empleado ? citaHabilitadaConDetalles.empleado.nombre : 'No asignado',
                    estado: citaHabilitadaConDetalles.estadoDetalle ? citaHabilitadaConDetalles.estadoDetalle.nombreEstado : 'Desconocido',
                    servicios: citaHabilitadaConDetalles.serviciosProgramados.map(s => ({ nombre: s.nombre, precio: s.precio, descripcion: s.descripcion, duracion_estimada: s.duracion_estimada })),
                    total: citaHabilitadaConDetalles.serviciosProgramados.reduce((sum, s) => sum + Number(s.precio || 0), 0),
                    duracionTotalEstimada: duracionTotalParaCorreo,
                }
            });
        } catch (emailError) {
            console.error(`Error al enviar correo de habilitación de cita ${cita.idCita}:`, emailError);
        }
    }
    return citaHabilitadaConDetalles;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError) throw error;
    console.error(`Error al habilitar la cita con ID ${idCita} en el servicio:`, error.message);
    throw new CustomError(`Error al habilitar la cita: ${error.message}`, 500);
  }
};

const eliminarCitaFisica = async (idCita) => {
  // ... (sin cambios, el correo no suele enviarse al eliminar físicamente)
  const transaction = await db.sequelize.transaction();
  try {
    const cita = await db.Cita.findByPk(idCita, { transaction });
    if (!cita) { await transaction.rollback(); throw new NotFoundError("Cita no encontrada para eliminar físicamente.");}
    const filasEliminadas = await db.Cita.destroy({ where: { idCita }, transaction});
    await transaction.commit();
    return filasEliminadas;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError) throw error;
    console.error(`Error al eliminar físicamente la cita con ID ${idCita}:`, error.message);
    throw new CustomError(`Error al eliminar físicamente la cita: ${error.message}`, 500);
  }
};

const agregarServiciosACita = async (idCita, idServicios) => {
  const transaction = await db.sequelize.transaction();
  try {
    const cita = await db.Cita.findByPk(idCita, { 
        include: [{model: db.Cliente, as: 'cliente', attributes: ['nombre', 'correo']}],
        transaction 
    });
    if (!cita) { await transaction.rollback(); throw new NotFoundError("Cita no encontrada para agregar servicios."); }
    if (!cita.estado) { await transaction.rollback(); throw new BadRequestError("No se pueden agregar servicios a una cita anulada.");}
    
    const serviciosDB = await db.Servicio.findAll({ where: { idServicio: idServicios, estado: true }, transaction });
    if (serviciosDB.length !== idServicios.length) {
      await transaction.rollback();
      const idsEncontrados = serviciosDB.map((s) => s.idServicio);
      const idsNoEncontrados = idServicios.filter((id) => !idsEncontrados.includes(id));
      throw new NotFoundError(`Uno o más servicios no existen o están inactivos: IDs ${idsNoEncontrados.join(", ")}`);
    }
    
    await cita.addServiciosProgramados(serviciosDB, { transaction }); // Usa el alias 'serviciosProgramados'
    await transaction.commit();
    
    const citaActualizadaConDetalles = await obtenerCitaCompletaPorIdInterno(idCita);

    if (citaActualizadaConDetalles && cita.cliente && cita.cliente.correo && citaActualizadaConDetalles.estado) {
        try {
            const duracionTotalParaCorreo = calcularDuracionTotalParaCorreo(citaActualizadaConDetalles.serviciosProgramados);
            await enviarCorreoCita({
                correo: cita.cliente.correo,
                nombreCliente: cita.cliente.nombre || 'Cliente',
                citaInfo: {
                    accion: 'modificada (servicios agregados)',
                    fechaHora: formatDateTime(citaActualizadaConDetalles.fechaHora),
                    empleado: citaActualizadaConDetalles.empleado ? citaActualizadaConDetalles.empleado.nombre : 'No asignado',
                    estado: citaActualizadaConDetalles.estadoDetalle ? citaActualizadaConDetalles.estadoDetalle.nombreEstado : 'Desconocido',
                    servicios: citaActualizadaConDetalles.serviciosProgramados.map(s => ({ nombre: s.nombre, precio: s.precio, descripcion: s.descripcion, duracion_estimada: s.duracion_estimada })),
                    total: citaActualizadaConDetalles.serviciosProgramados.reduce((sum, s) => sum + Number(s.precio || 0), 0),
                    duracionTotalEstimada: duracionTotalParaCorreo,
                    mensajeAdicional: 'Se han añadido nuevos servicios a tu cita.'
                }
            });
        } catch (emailError) {
            console.error(`Error al enviar correo de actualización de servicios de cita ${cita.idCita}:`, emailError);
        }
    }
    return citaActualizadaConDetalles;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError || error instanceof BadRequestError) throw error;
    console.error(`Error al agregar servicios a la cita ID ${idCita}:`, error);
    throw new CustomError(`Error al agregar servicios a la cita: ${error.message}`, 500);
  }
};

const quitarServiciosDeCita = async (idCita, idServicios) => {
  const transaction = await db.sequelize.transaction();
  try {
    const cita = await db.Cita.findByPk(idCita, { 
        include: [{model: db.Cliente, as: 'cliente', attributes: ['nombre', 'correo']}],
        transaction 
    });
    if (!cita) { await transaction.rollback(); throw new NotFoundError("Cita no encontrada para quitar servicios.");}
    if (!cita.estado) { await transaction.rollback(); throw new BadRequestError("No se pueden quitar servicios de una cita anulada.");}
    
    await cita.removeServiciosProgramados(idServicios, { transaction }); // Usa el alias 'serviciosProgramados'
    await transaction.commit();
    
    const citaActualizadaConDetalles = await obtenerCitaCompletaPorIdInterno(idCita);

    if (citaActualizadaConDetalles && cita.cliente && cita.cliente.correo && citaActualizadaConDetalles.estado) {
        try {
            const duracionTotalParaCorreo = calcularDuracionTotalParaCorreo(citaActualizadaConDetalles.serviciosProgramados);
            await enviarCorreoCita({
                correo: cita.cliente.correo,
                nombreCliente: cita.cliente.nombre || 'Cliente',
                citaInfo: {
                    accion: 'modificada (servicios quitados)',
                    fechaHora: formatDateTime(citaActualizadaConDetalles.fechaHora),
                    empleado: citaActualizadaConDetalles.empleado ? citaActualizadaConDetalles.empleado.nombre : 'No asignado',
                    estado: citaActualizadaConDetalles.estadoDetalle ? citaActualizadaConDetalles.estadoDetalle.nombreEstado : 'Desconocido',
                    servicios: citaActualizadaConDetalles.serviciosProgramados.map(s => ({ nombre: s.nombre, precio: s.precio, descripcion: s.descripcion, duracion_estimada: s.duracion_estimada })),
                    total: citaActualizadaConDetalles.serviciosProgramados.reduce((sum, s) => sum + Number(s.precio || 0), 0),
                    duracionTotalEstimada: duracionTotalParaCorreo,
                    mensajeAdicional: 'Se han quitado servicios de tu cita.'
                }
            });
        } catch (emailError) {
            console.error(`Error al enviar correo de actualización de servicios de cita ${cita.idCita}:`, emailError);
        }
    }
    return citaActualizadaConDetalles;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError || error instanceof BadRequestError) throw error;
    console.error(`Error al quitar servicios de la cita ID ${idCita}:`, error);
    throw new CustomError(`Error al quitar servicios de la cita: ${error.message}`, 500);
  }
};

module.exports = {
  crearCita,
  obtenerTodasLasCitas,
  obtenerCitaPorId,
  actualizarCita,
  anularCita,
  habilitarCita,
  eliminarCitaFisica,
  agregarServiciosACita,
  quitarServiciosDeCita,
};