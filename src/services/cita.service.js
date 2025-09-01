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
        attributes: ["idCliente", "nombre", "apellido", "correo", "estado"], // Asegúrate de incluir 'estado' aquí
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
          "duracionEstimadaMin",
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
                { model: db.Servicio, as: 'serviciosProgramados', attributes: ["idServicio", "nombre", "precio", "descripcion", "duracionEstimadaMin"], through: { attributes: [] } }
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
            const estadoPendiente = await db.Estado.findOne({ where: { nombreEstado: 'Pendiente' }, transaction });
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
                        servicios: citaActualizadaConDetalles.serviciosProgramados.map(s => ({ nombre: s.nombre, precio: s.precio, descripcion: s.descripcion, duracion_estimada: s.duracionEstimadaMin })),
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
    usuarioId,
    estadoCitaId,
    servicios = [],
    estado,
    novedadId,
  } = datosCita;

  const novedad = await db.Novedad.findByPk(novedadId, {
    include: [{ model: db.Usuario, as: 'empleados' }]
  });

  if (!novedad) {
    throw new BadRequestError(`La novedad con ID ${novedadId} no fue encontrada.`);
  }

  const empleadoValido = novedad.empleados.some(emp => emp.id_usuario === usuarioId);
  if (!empleadoValido) {
    throw new BadRequestError(`El empleado con ID ${usuarioId} no está asociado a la novedad seleccionada.`);
  }

  const fechaCita = moment(fechaHora);
  const fechaInicioNovedad = moment(novedad.fechaInicio);
  const fechaFinNovedad = moment(novedad.fechaFin);

  if (!fechaCita.isBetween(fechaInicioNovedad, fechaFinNovedad, 'days', '[]')) {
    throw new BadRequestError(`La fecha de la cita está fuera del rango de fechas de la novedad.`);
  }

  const diaCita = fechaCita.day();
  if (!novedad.dias.includes(diaCita)) {
    throw new BadRequestError(`El día de la cita no está disponible en la novedad seleccionada.`);
  }

  const horaCita = fechaCita.format('HH:mm:ss');
  if (horaCita < novedad.horaInicio || horaCita > novedad.horaFin) {
    throw new BadRequestError(`La hora de la cita está fuera del rango de horas de la novedad.`);
  }

  const cliente = await db.Cliente.findOne({
    where: { idCliente: clienteId, estado: true },
    include: [{
      model: db.Usuario,
      as: 'usuario',
      include: [{
        model: db.Rol,
        as: 'rol'
      }]
    }]
  });

  if (!cliente) {
    throw new BadRequestError(`Cliente con ID ${clienteId} no encontrado o inactivo.`);
  }

  if (cliente.usuario.rol.nombre !== 'Cliente') {
    throw new BadRequestError(`El usuario asociado al cliente no tiene el rol de "Cliente".`);
  }

  const estadoProcesoCita = await db.Estado.findByPk(estadoCitaId);
  if (!estadoProcesoCita)
    throw new BadRequestError(
      `Estado de cita con ID ${estadoCitaId} no encontrado.`
    );

  let empleado = null;
  if (usuarioId) {
    empleado = await db.Usuario.findOne({
      where: { idUsuario: usuarioId, estado: true },
      include: [{
        model: db.Rol,
        as: 'rol'
      }]
    });
    if (!empleado) {
      throw new BadRequestError(
        `Usuario (empleado) con ID ${usuarioId} no encontrado o inactivo.`
      );
    }
    if (empleado.rol.nombre !== 'Empleado') {
      throw new BadRequestError(`El usuario (empleado) no tiene el rol de "Empleado".`);
    }
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

  const transaction = await db.sequelize.transaction();

  try {
    if (empleado && serviciosConsultados.length > 0) {
        const fechaHoraInicioMoment = moment(fechaHora);
        let duracionTotalCitaMinutos = 0;
        serviciosConsultados.forEach((s) => {
            duracionTotalCitaMinutos += s.duracionEstimadaMin || 0;
        });
        const fechaHoraFinMoment = fechaHoraInicioMoment
            .clone()
            .add(duracionTotalCitaMinutos, "minutes");

        const citasSuperpuestas = await db.Cita.findAll({
            where: {
                empleadoId: empleado.idEmpleado,
                estado: true,
                [Op.and]: [
                    {
                        fechaHora: { [Op.lt]: fechaHoraFinMoment.toDate() },
                    },
                    {
                        fechaHora: { [Op.gte]: fechaHoraInicioMoment.toDate() },
                    },
                    // La siguiente línea era redundante o incorrecta en tu código original
                    // { }
                ]
            },
            include: [{
                model: db.Servicio,
                as: "serviciosProgramados",
                attributes: ["duracionEstimadaMin"],
                through: { attributes: [] }
            }],
            transaction
        });

        const nuevaCitaStart = fechaHoraInicioMoment.toDate();
        const nuevaCitaEnd = fechaHoraFinMoment.toDate();

        for (const citaExistente of citasSuperpuestas) {
            let duracionExistenteMinutos = 0;
            if (citaExistente.serviciosProgramados && citaExistente.serviciosProgramados.length > 0) {
                duracionExistenteMinutos = citaExistente.serviciosProgramados.reduce((sum, s) => sum + (Number(s.duracionEstimadaMin) || 0), 0);
            }
            const citaExistenteStart = moment(citaExistente.fechaHora).toDate();
            const citaExistenteEnd = moment(citaExistente.fechaHora).add(duracionExistenteMinutos, 'minutes').toDate();

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
          duracion_estimada: s.duracionEstimadaMin
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
        { model: db.Servicio, as: "serviciosProgramados", attributes: ["idServicio", "nombre", "precio", "duracionEstimadaMin"], through: { attributes: [] } },
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
  const transaction = await db.sequelize.transaction();
  try {
    const cita = await db.Cita.findByPk(idCita, { transaction });
    if (!cita) { await transaction.rollback(); throw new NotFoundError("Cita no encontrada para actualizar."); }

    // --- NUEVA VALIDACIÓN: Cliente inactivo no puede actualizar su cita ---
    const clienteAsociado = await db.Cliente.findByPk(cita.idCliente, { transaction });
    if (!clienteAsociado || !clienteAsociado.estado) {
        await transaction.rollback();
        throw new BadRequestError("El cliente asociado a esta cita está inactivo y no puede realizar actualizaciones.");
    }
    // --- FIN NUEVA VALIDACIÓN ---

    let clienteParaCorreo = clienteAsociado; // Usamos el cliente validado

    if (datosActualizar.clienteId && datosActualizar.clienteId !== cita.clienteId) {
      const clienteNuevo = await db.Cliente.findOne({
        where: { idCliente: datosActualizar.clienteId, estado: true },
        include: [{
          model: db.Usuario,
          as: 'usuario',
          include: [{
            model: db.Rol,
            as: 'rol'
          }]
        }],
        transaction
      });
      if (!clienteNuevo) {
        await transaction.rollback();
        throw new BadRequestError(`Nuevo cliente con ID ${datosActualizar.clienteId} no encontrado o inactivo.`);
      }
      if (clienteNuevo.usuario.rol.nombre !== 'Cliente') {
        await transaction.rollback();
        throw new BadRequestError(`El usuario asociado al nuevo cliente no tiene el rol de "Cliente".`);
      }
      clienteParaCorreo = clienteNuevo;
    }
    if (datosActualizar.novedadId) {
      const novedad = await db.Novedad.findByPk(datosActualizar.novedadId, {
        include: [{ model: db.Usuario, as: 'empleados' }],
        transaction
      });

      if (!novedad) {
        await transaction.rollback();
        throw new BadRequestError(`La novedad con ID ${datosActualizar.novedadId} no fue encontrada.`);
      }

      const usuarioId = datosActualizar.usuarioId || cita.usuarioId;
      const empleadoValido = novedad.empleados.some(emp => emp.id_usuario === usuarioId);
      if (!empleadoValido) {
        await transaction.rollback();
        throw new BadRequestError(`El empleado con ID ${usuarioId} no está asociado a la novedad seleccionada.`);
      }

      const fechaCita = moment(datosActualizar.fechaHora || cita.fechaHora);
      const fechaInicioNovedad = moment(novedad.fechaInicio);
      const fechaFinNovedad = moment(novedad.fechaFin);

      if (!fechaCita.isBetween(fechaInicioNovedad, fechaFinNovedad, 'days', '[]')) {
        await transaction.rollback();
        throw new BadRequestError(`La fecha de la cita está fuera del rango de fechas de la novedad.`);
      }

      const diaCita = fechaCita.day();
      if (!novedad.dias.includes(diaCita)) {
        await transaction.rollback();
        throw new BadRequestError(`El día de la cita no está disponible en la novedad seleccionada.`);
      }

      const horaCita = fechaCita.format('HH:mm:ss');
      if (horaCita < novedad.horaInicio || horaCita > novedad.horaFin) {
        await transaction.rollback();
        throw new BadRequestError(`La hora de la cita está fuera del rango de horas de la novedad.`);
      }
    }

    if (datosActualizar.usuarioId && datosActualizar.usuarioId !== cita.usuarioId) {
      const empleadoNuevo = await db.Usuario.findOne({
        where: {idUsuario: datosActualizar.usuarioId, estado: true},
        include: [{
          model: db.Rol,
          as: 'rol'
        }],
        transaction
      });
      if(!empleadoNuevo) {
        await transaction.rollback();
        throw new BadRequestError(`Nuevo usuario (empleado) con ID ${datosActualizar.usuarioId} no encontrado o inactivo.`);
      }
      if (empleadoNuevo.rol.nombre !== 'Empleado') {
        await transaction.rollback();
        throw new BadRequestError(`El nuevo usuario (empleado) no tiene el rol de "Empleado".`);
      }
    }
    if (datosActualizar.estadoCitaId && datosActualizar.estadoCitaId !== cita.estadoCitaId) {
      const estadoNuevo = await db.Estado.findByPk(datosActualizar.estadoCitaId, {transaction});
      if(!estadoNuevo) {await transaction.rollback(); throw new BadRequestError(`Nuevo estado de cita con ID ${datosActualizar.estadoCitaId} no encontrado.`);}
    }


    await cita.update(datosActualizar, { transaction });
    await transaction.commit(); 

    const citaActualizadaConDetalles = await obtenerCitaCompletaPorIdInterno(cita.idCita);

    if (citaActualizadaConDetalles && clienteParaCorreo && clienteParaCorreo.correo && citaActualizadaConDetalles.estado) {
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
              servicios: citaActualizadaConDetalles.serviciosProgramados.map(s => ({ nombre: s.nombre, precio: s.precio, descripcion: s.descripcion, duracion_estimada: s.duracionEstimadaMin })),
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
    
    // --- NUEVA VALIDACIÓN: Cliente inactivo no puede eliminar su cita ---
    const clienteAsociado = await db.Cliente.findByPk(cita.idCliente, { transaction });
    if (!clienteAsociado || !clienteAsociado.estado) {
        await transaction.rollback();
        throw new BadRequestError("El cliente asociado a esta cita está inactivo y no puede eliminar la cita.");
    }
    // --- FIN NUEVA VALIDACIÓN ---

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
        include: [{model: db.Cliente, as: 'cliente', attributes: ['nombre', 'correo', 'estado']}], // Incluir estado del cliente
        transaction 
    });
    if (!cita) { await transaction.rollback(); throw new NotFoundError("Cita no encontrada para agregar servicios."); }
    if (!cita.estado) { await transaction.rollback(); throw new BadRequestError("No se pueden agregar servicios a una cita anulada.");}
    
    // --- NUEVA VALIDACIÓN: Cliente inactivo no puede agregar servicios a su cita ---
    if (!cita.cliente || !cita.cliente.estado) {
        await transaction.rollback();
        throw new BadRequestError("El cliente asociado a esta cita está inactivo y no puede agregar servicios.");
    }
    // --- FIN NUEVA VALIDACIÓN ---

    const serviciosDB = await db.Servicio.findAll({ where: { id: idServicios, estado: true }, transaction }); // Asumo que idServicios es un array de IDs
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
                    servicios: citaActualizadaConDetalles.serviciosProgramados.map(s => ({ nombre: s.nombre, precio: s.precio, descripcion: s.descripcion, duracion_estimada: s.duracionEstimadaMin })),
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
        include: [{model: db.Cliente, as: 'cliente', attributes: ['nombre', 'correo', 'estado']}], // Incluir estado del cliente
        transaction 
    });
    if (!cita) { await transaction.rollback(); throw new NotFoundError("Cita no encontrada para quitar servicios.");}
    if (!cita.estado) { await transaction.rollback(); throw new BadRequestError("No se pueden quitar servicios de una cita anulada.");}
    
    // --- NUEVA VALIDACIÓN: Cliente inactivo no puede quitar servicios de su cita ---
    if (!cita.cliente || !cita.cliente.estado) {
        await transaction.rollback();
        throw new BadRequestError("El cliente asociado a esta cita está inactivo y no puede quitar servicios.");
    }
    // --- FIN NUEVA VALIDACIÓN ---

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
                    servicios: citaActualizadaConDetalles.serviciosProgramados.map(s => ({ nombre: s.nombre, precio: s.precio, descripcion: s.descripcion, duracion_estimada: s.duracionEstimadaMin })),
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