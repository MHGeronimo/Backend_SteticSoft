// src/services/cita.service.js
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


const calcularDuracionTotalParaCorreo = (serviciosProgramados) => {
  let duracionTotal = 0;
  if (serviciosProgramados && serviciosProgramados.length > 0) {
    duracionTotal = serviciosProgramados.reduce(
      (sum, s) => {
        // Corregido: Usar duracionEstimadaMin
        const duracion = s.dataValues ? s.dataValues.duracionEstimadaMin : s.duracionEstimadaMin;
        return sum + (Number(duracion) || 0);
      },
      0
    );
  }
  return duracionTotal;
};

const obtenerCitaCompletaPorIdInterno = async (idCita, transaction = null) => {
  return db.Cita.findByPk(idCita, {
    include: [
      {
        model: db.Cliente,
        as: "cliente",
        attributes: ["idCliente", "nombre", "apellido", "correo", "estado"],
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
          "duracionEstimadaMin", // Corregido: Propiedad del modelo
        ],
        through: { attributes: [] },
      },
    ],
    transaction,
  });
};

/**
 * Helper interno para cambiar el estado booleano de una cita.
 * @param {number} idCita - ID de la cita.
 * @param {boolean} nuevoEstadoBooleano - El nuevo estado (true para habilitar, false para anular).
 * @param {string} accionCorreo - Descripción de la acción para el correo.
 * @returns {Promise<object>} La cita con el estado cambiado.
 */
const cambiarEstadoCita = async (idCita, nuevoEstadoBooleano, accionCorreo) => {
    const transaction = await db.sequelize.transaction();
    try {
        const cita = await db.Cita.findByPk(idCita, {
            include: [
                { model: db.Cliente, as: 'cliente', attributes: ['nombre', 'correo'] },
                { model: db.Empleado, as: 'empleado', attributes: ['nombre'], required: false },
                { model: db.Estado, as: 'estadoDetalle' },
                { model: db.Servicio, as: 'serviciosProgramados', attributes: ["idServicio", "nombre", "precio", "descripcion", "duracionEstimadaMin"], through: { attributes: [] } } // Corregido
            ],
            transaction
        });

        if (!cita) {
            await transaction.rollback();
            throw new NotFoundError(`Cita no encontrada para ${accionCorreo}.`);
        }

        if (cita.estado === nuevoEstadoBooleano) {
            await transaction.rollback();
            return cita; // Ya está en el estado deseado
        }

        const updates = { estado: nuevoEstadoBooleano };
        if (!nuevoEstadoBooleano) { // Si se está anulando
            const estadoCancelado = await db.Estado.findOne({ where: { nombreEstado: 'Cancelado' }, transaction });
            if (estadoCancelado) {
                updates.estadoCitaId = estadoCancelado.idEstado;
            }
        } else { // Si se está habilitando/reactivando
            const estadoPendiente = await db.Estado.findOne({ where: { nombreEstado: 'Pendiente' }, transaction }); // o 'Agendada'
            if (estadoPendiente) {
                updates.estadoCitaId = estadoPendiente.idEstado;
            }
        }

        await cita.update(updates, { transaction });
        await transaction.commit();

        const citaActualizadaConDetalles = await obtenerCitaCompletaPorIdInterno(idCita);

        if (citaActualizadaConDetalles && cita.cliente && cita.cliente.correo) {
            try {
                const duracionTotalParaCorreo = calcularDuracionTotalParaCorreo(citaActualizadaConDetalles.serviciosProgramados);
                await enviarCorreoCita({
                    correo: cita.cliente.correo,
                    nombreCliente: cita.cliente.nombre || 'Cliente',
                    citaInfo: {
                        accion: accionCorreo,
                        fechaHora: formatDateTime(citaActualizadaConDetalles.fechaHora),
                        empleado: citaActualizadaConDetalles.empleado ? citaActualizadaConDetalles.empleado.nombre : 'No asignado',
                        estado: citaActualizadaConDetalles.estadoDetalle ? citaActualizadaConDetalles.estadoDetalle.nombreEstado : (nuevoEstadoBooleano ? 'Pendiente' : 'Cancelada'),
                        servicios: citaActualizadaConDetalles.serviciosProgramados.map(s => ({ nombre: s.nombre, precio: s.precio, descripcion: s.descripcion, duracion_estimada: s.duracionEstimadaMin })), // Corregido aquí y debajo
                        total: citaActualizadaConDetalles.serviciosProgramados.reduce((sum, s) => sum + Number(s.precio || 0), 0),
                        duracionTotalEstimada: duracionTotalParaCorreo,
                    }
                });
            } catch (emailError) {
                console.error(`Error al enviar correo de ${accionCorreo} de cita ${idCita}:`, emailError);
            }
        }
        return citaActualizadaConDetalles;
    } catch (error) {
        await transaction.rollback();
        if (error instanceof NotFoundError) throw error;
        console.error(`Error al ${accionCorreo} la cita con ID ${idCita} en el servicio:`, error.message);
        throw new CustomError(`Error al ${accionCorreo} la cita: ${error.message}`, 500);
    }
};


const crearCita = async (datosCita) => {
  const {
    fechaHora,
    clienteId,
    empleadoId,
    estadoCitaId,
    servicios = [],
    estado,
  } = datosCita;

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

  const transaction = await db.sequelize.transaction(); // Mover la inicialización de la transacción

  try {
    if (empleado && serviciosConsultados.length > 0) {
        const fechaHoraInicioMoment = moment(fechaHora);
        let duracionTotalCitaMinutos = 0;
        serviciosConsultados.forEach((s) => {
            duracionTotalCitaMinutos += s.duracionEstimadaMin || 0; // Corregido: duracionEstimadaMin
        });
        const fechaHoraFinMoment = fechaHoraInicioMoment
            .clone()
            .add(duracionTotalCitaMinutos, "minutes");

        // Lógica de superposición de citas mejorada
        // Se buscan citas del empleado que se superpongan con el nuevo rango [fechaHoraInicioMoment, fechaHoraFinMoment]
        const citasSuperpuestas = await db.Cita.findAll({
            where: {
                empleadoId: empleado.idEmpleado,
                estado: true, // Considerar solo citas activas
                [Op.and]: [
                    {
                        fechaHora: { [Op.lt]: fechaHoraFinMoment.toDate() },
                    },
                    {
                        fechaHora: { [Op.lt]: fechaHoraFinMoment.toDate(), [Op.gte]: fechaHoraInicioMoment.toDate() },
                    },
                    {
                    }
                ]
            },
             // Incluye los servicios para calcular la duración de las citas existentes
            include: [{
                model: db.Servicio,
                as: "serviciosProgramados",
                attributes: ["duracionEstimadaMin"], // Solo necesitamos la duración
                through: { attributes: [] }
            }],
            transaction
        });

        // Lógica de superposición mejorada (post-consulta)
        const nuevaCitaStart = fechaHoraInicioMoment.toDate();
        const nuevaCitaEnd = fechaHoraFinMoment.toDate();

        for (const citaExistente of citasSuperpuestas) {
            let duracionExistenteMinutos = 0;
            if (citaExistente.serviciosProgramados && citaExistente.serviciosProgramados.length > 0) {
                duracionExistenteMinutos = citaExistente.serviciosProgramados.reduce((sum, s) => sum + (Number(s.duracionEstimadaMin) || 0), 0);
            }
            const citaExistenteStart = moment(citaExistente.fechaHora).toDate();
            const citaExistenteEnd = moment(citaExistente.fechaHora).add(duracionExistenteMinutos, 'minutes').toDate();

            // Check for overlap: (start1 < end2) && (end1 > start2)
            if (nuevaCitaStart < citaExistenteEnd && nuevaCitaEnd > citaExistenteStart) {
                await transaction.rollback();
                throw new ConflictError(
                    `El empleado ${empleado.nombre} ya tiene una cita programada (${formatDateTime(citaExistenteStart)} - ${formatDateTime(citaExistenteEnd)}) que se superpone con el horario solicitado (${formatDateTime(nuevaCitaStart)} - ${formatDateTime(nuevaCitaEnd)}).`
                );
            }
        }
    }


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
    const citaCreadaConDetalles = await obtenerCitaCompletaPorIdInterno(
      nuevaCita.idCita
    );

    if (
      citaCreadaConDetalles &&
      citaCreadaConDetalles.cliente &&
      citaCreadaConDetalles.cliente.correo &&
      citaCreadaConDetalles.estado 
    ) {
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
          duracion_estimada: s.duracionEstimadaMin // Corregido
        })),
        total: citaCreadaConDetalles.serviciosProgramados.reduce((sum, s) => sum + Number(s.precio || 0), 0),
        duracionTotalEstimada: duracionTotalParaCorreo,
      };
      
      try {
        await enviarCorreoCita({
          correo: citaCreadaConDetalles.cliente.correo,
          nombreCliente: citaCreadaConDetalles.cliente.nombre || 'Cliente',
          citaInfo: citaInfoParaCorreo
        });
      } catch (emailError) {
        console.error(
          `Error al enviar correo de notificación de nueva cita ${nuevaCita.idCita} a ${citaCreadaConDetalles.cliente.correo}:`,
          emailError
        );
      }
    }
    return citaCreadaConDetalles;
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
        { model: db.Servicio, as: "serviciosProgramados", attributes: ["idServicio", "nombre", "precio", "duracionEstimadaMin"], through: { attributes: [] } }, // Corregido
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
  // Esta función actualiza campos generales, no el estado booleano directamente con la lógica de anular/habilitar.
  // Si se incluye `estado` en datosActualizar, se actualizará el booleano, pero sin la lógica de correo específica de anular/habilitar.
  const transaction = await db.sequelize.transaction();
  try {
    const cita = await db.Cita.findByPk(idCita, { transaction });
    if (!cita) { await transaction.rollback(); throw new NotFoundError("Cita no encontrada para actualizar."); }

    let clienteParaCorreo = cita.clienteId ? await db.Cliente.findByPk(cita.clienteId, {attributes: ['nombre', 'correo'], transaction}) : null;

    if (datosActualizar.clienteId && datosActualizar.clienteId !== cita.clienteId) {
      const clienteNuevo = await db.Cliente.findOne({ where: { idCliente: datosActualizar.clienteId, estado: true }, transaction });
      if (!clienteNuevo) { await transaction.rollback(); throw new BadRequestError(`Nuevo cliente con ID ${datosActualizar.clienteId} no encontrado o inactivo.`); }
      clienteParaCorreo = clienteNuevo;
    }
      if (datosActualizar.empleadoId && datosActualizar.empleadoId !== cita.empleadoId) {
        const empleadoNuevo = await db.Empleado.findOne({ where: {idEmpleado: datosActualizar.empleadoId, estado: true}, transaction});
        if(!empleadoNuevo) { await transaction.rollback(); throw new BadRequestError(`Nuevo empleado con ID ${datosActualizar.empleadoId} no encontrado o inactivo.`);}
    }
    if (datosActualizar.estadoCitaId && datosActualizar.estadoCitaId !== cita.estadoCitaId) {
        const estadoNuevo = await db.Estado.findByPk(datosActualizar.estadoCitaId, {transaction});
        if(!estadoNuevo) {await transaction.rollback(); throw new BadRequestError(`Nuevo estado de cita con ID ${datosActualizar.estadoCitaId} no encontrado.`);}
    }


    await cita.update(datosActualizar, { transaction });
    await transaction.commit(); 

    const citaActualizadaConDetalles = await obtenerCitaCompletaPorIdInterno(cita.idCita);

    if (citaActualizadaConDetalles && clienteParaCorreo && clienteParaCorreo.correo && citaActualizadaConDetalles.estado) {
      // Solo enviar correo si la cita sigue activa y hay cambios significativos (ej. fecha, empleado, estado del proceso)
      if (datosActualizar.fechaHora || datosActualizar.empleadoId || datosActualizar.estadoCitaId) {
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
              servicios: citaActualizadaConDetalles.serviciosProgramados.map(s => ({ nombre: s.nombre, precio: s.precio, descripcion: s.descripcion, duracion_estimada: s.duracionEstimadaMin })), // Corregido
              total: citaActualizadaConDetalles.serviciosProgramados.reduce((sum, s) => sum + Number(s.precio || 0), 0),
              duracionTotalEstimada: duracionTotalParaCorreo,
              mensajeAdicional: 'Los detalles de tu cita han sido actualizados.'
            }
          });
        } catch (emailError) {
          console.error(`Error al enviar correo de actualización de cita ${cita.idCita}:`, emailError);
        }
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
  return cambiarEstadoCita(idCita, false, 'cancelada');
};

const habilitarCita = async (idCita) => {
  return cambiarEstadoCita(idCita, true, 'reactivada');
};

const eliminarCitaFisica = async (idCita) => {
  const transaction = await db.sequelize.transaction();
  try {
    const cita = await db.Cita.findByPk(idCita, { transaction });
    if (!cita) { await transaction.rollback(); throw new NotFoundError("Cita no encontrada para eliminar físicamente.");}
    
    // Antes de eliminar, se podrían quitar asociaciones many-to-many explícitamente si no hay CASCADE bien configurado.
    // await cita.setServiciosProgramados([], { transaction }); // Si la tabla de unión no tiene ON DELETE CASCADE en Cita_idCita.
    // Sin embargo, la DDL para ServicioXCita tiene ON DELETE CASCADE en ambas FKs, por lo que se borrarán automáticamente.

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
    
    const serviciosDB = await db.Servicio.findAll({ where: { idServicios, estado: true }, transaction });
    if (serviciosDB.length !== idServicios.length) {
      await transaction.rollback();
      const idsEncontrados = serviciosDB.map((s) => s.idServicio);
      const idsNoEncontrados = idServicios.filter((id) => !idsEncontrados.includes(id));
      throw new NotFoundError(`Uno o más servicios no existen o están inactivos: IDs ${idsNoEncontrados.join(", ")}`);
    }
    
    await cita.addServiciosProgramados(serviciosDB, { transaction });
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
                    servicios: citaActualizadaConDetalles.serviciosProgramados.map(s => ({ nombre: s.nombre, precio: s.precio, descripcion: s.descripcion, duracion_estimada: s.duracionEstimadaMin })), // Corregido
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
    
    await cita.removeServiciosProgramados(idServicios, { transaction });
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
                    servicios: citaActualizadaConDetalles.serviciosProgramados.map(s => ({ nombre: s.nombre, precio: s.precio, descripcion: s.descripcion, duracion_estimada: s.duracionEstimadaMin })), // Corregido
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
  cambiarEstadoCita, 
};