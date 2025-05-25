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
const { enviarCorreoCita } = require("../utils/CitaEmailTemplate.js"); // Asegúrate que esta ruta sea correcta
const { formatDateTime } = require("../utils/dateHelpers.js"); // Asegúrate que esta ruta sea correcta

/**
 * Obtener una cita por su ID con todos los detalles necesarios para notificaciones.
 * Esta es una función helper interna para evitar repetir includes.
 */
const obtenerCitaCompletaPorId = async (idCita, transaction = null) => {
  return db.Cita.findByPk(idCita, {
    include: [
      {
        model: db.Cliente,
        as: "cliente",
        attributes: ["idCliente", "nombre", "correo", "estado"],
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
  } else {
    // Considera si una cita DEBE tener servicios al crearse.
    // throw new BadRequestError('Se requiere al menos un servicio para crear la cita.');
  }

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
        idCita: { [Op.ne]: null }, // Excluir la cita actual si se estuviera actualizando
        [Op.or]: [
          {
            // Cita existente comienza durante la nueva cita
            fechaHora: {
              [Op.lt]: fechaHoraFinMoment.toDate(),
              [Op.gte]: fechaHoraInicioMoment.toDate(),
            },
          },
          {
            // Cita existente termina durante la nueva cita
            // Para esto, necesitaríamos la fechaHoraFin de las citas existentes.
            // Esta lógica de superposición puede ser más compleja y es un placeholder.
            // Por simplicidad, una cita existente que comienza antes de que la nueva termine
            // Y termina después de que la nueva comienza.
            // Asumimos que podemos calcular o tenemos fechaHoraFin en la BD para citas existentes
            // o una lógica que compare rangos (StartA < EndB && EndA > StartB)
            // Simplificación: Que ninguna otra cita comience en este intervalo
          },
        ],
      },
    });
    if (citasSuperpuestas) {
      throw new ConflictError(
        `El empleado ${empleado.nombre} ya tiene una cita que se superpone con el horario solicitado.`
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
    const citaCreadaConDetalles = await obtenerCitaCompletaPorId(
      nuevaCita.idCita
    );

    if (
      citaCreadaConDetalles &&
      citaCreadaConDetalles.cliente &&
      citaCreadaConDetalles.cliente.correo &&
      citaCreadaConDetalles.estado
    ) {
      try {
        await enviarCorreoCita({
          correo: citaCreadaConDetalles.cliente.correo,
          nombreCliente: citaCreadaConDetalles.cliente.nombre || "Cliente",
          citaInfo: {
            accion: "agendada",
            fechaHora: formatDateTime(citaCreadaConDetalles.fechaHora),
            empleado: citaCreadaConDetalles.empleado
              ? citaCreadaConDetalles.empleado.nombre
              : "No asignado",
            estado: citaCreadaConDetalles.estadoDetalle
              ? citaCreadaConDetalles.estadoDetalle.nombreEstado
              : "Desconocido",
            servicios: citaCreadaConDetalles.serviciosProgramados.map((s) => ({
              nombre: s.nombre,
              precio: s.precio,
              descripcion: s.descripcion,
            })),
            total: citaCreadaConDetalles.serviciosProgramados.reduce(
              (sum, s) => sum + Number(s.precio || 0),
              0
            ),
          },
        });
      } catch (emailError) {
        console.error(
          `Error al enviar correo de notificación de nueva cita ${nuevaCita.idCita} a ${cliente.correo}:`,
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
  // ... (implementación como la tenías, con includes correctos)
  const whereClause = {};
  if (opcionesDeFiltro.hasOwnProperty("estado"))
    whereClause.estado = opcionesDeFiltro.estado;
  if (opcionesDeFiltro.clienteId)
    whereClause.clienteId = opcionesDeFiltro.clienteId;
  if (opcionesDeFiltro.empleadoId)
    whereClause.empleadoId = opcionesDeFiltro.empleadoId;
  if (opcionesDeFiltro.estadoCitaId)
    whereClause.estadoCitaId = opcionesDeFiltro.estadoCitaId;
  if (opcionesDeFiltro.fecha) {
    const fechaInicio = moment(opcionesDeFiltro.fecha).startOf("day").toDate();
    const fechaFin = moment(opcionesDeFiltro.fecha).endOf("day").toDate();
    whereClause.fechaHora = { [Op.gte]: fechaInicio, [Op.lte]: fechaFin };
  }
  try {
    return await db.Cita.findAll({
      where: whereClause,
      include: [
        {
          model: db.Cliente,
          as: "cliente",
          attributes: ["idCliente", "nombre", "apellido"],
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
          attributes: ["idServicio", "nombre", "precio", "duracion_estimada"],
          through: { attributes: [] },
        },
      ],
      order: [["fechaHora", "ASC"]],
    });
  } catch (error) {
    console.error("Error al obtener todas las citas:", error.message);
    throw new CustomError(`Error al obtener citas: ${error.message}`, 500);
  }
};

const obtenerCitaPorId = async (idCita) => {
  // ... (implementación como la tenías, usando obtenerCitaCompletaPorId)
  const cita = await obtenerCitaCompletaPorId(idCita);
  if (!cita) {
    throw new NotFoundError("Cita no encontrada.");
  }
  return cita;
};

const actualizarCita = async (idCita, datosActualizar) => {
  const { fechaHora, clienteId, empleadoId, estadoCitaId, estado } =
    datosActualizar;
  const transaction = await db.sequelize.transaction();
  try {
    const cita = await db.Cita.findByPk(idCita, { transaction });
    if (!cita) {
      await transaction.rollback();
      throw new NotFoundError("Cita no encontrada para actualizar.");
    }

    let clienteParaCorreo = cita.clienteId
      ? await db.Cliente.findByPk(cita.clienteId)
      : null; // Cliente original para correo

    if (clienteId && clienteId !== cita.clienteId) {
      const clienteNuevo = await db.Cliente.findOne({
        where: { idCliente: clienteId, estado: true },
        transaction,
      });
      if (!clienteNuevo) {
        await transaction.rollback();
        throw new BadRequestError(
          `Nuevo cliente con ID ${clienteId} no encontrado o inactivo.`
        );
      }
      clienteParaCorreo = clienteNuevo; // Actualizar cliente para el correo
    }
    if (empleadoId !== undefined && empleadoId !== cita.empleadoId) {
      if (empleadoId !== null) {
        const empleadoNuevo = await db.Empleado.findOne({
          where: { idEmpleado: empleadoId, estado: true },
          transaction,
        });
        if (!empleadoNuevo) {
          await transaction.rollback();
          throw new BadRequestError(
            `Nuevo empleado con ID ${empleadoId} no encontrado o inactivo.`
          );
        }
      }
    }
    if (estadoCitaId && estadoCitaId !== cita.estadoCitaId) {
      const nuevoEstadoProceso = await db.Estado.findByPk(estadoCitaId, {
        transaction,
      });
      if (!nuevoEstadoProceso) {
        await transaction.rollback();
        throw new BadRequestError(
          `Nuevo estado de cita con ID ${estadoCitaId} no encontrado.`
        );
      }
    }

    // Aquí iría la lógica de validación de disponibilidad si fechaHora o empleado cambian (compleja)

    await cita.update(datosActualizar, { transaction });
    await transaction.commit();

    const citaActualizadaConDetalles = await obtenerCitaCompletaPorId(
      cita.idCita
    );

    if (
      citaActualizadaConDetalles &&
      clienteParaCorreo &&
      clienteParaCorreo.correo &&
      citaActualizadaConDetalles.estado
    ) {
      try {
        await enviarCorreoCita({
          correo: clienteParaCorreo.correo,
          nombreCliente: clienteParaCorreo.nombre || "Cliente",
          citaInfo: {
            accion: "actualizada",
            fechaHora: formatDateTime(citaActualizadaConDetalles.fechaHora),
            empleado: citaActualizadaConDetalles.empleado
              ? citaActualizadaConDetalles.empleado.nombre
              : "No asignado",
            estado: citaActualizadaConDetalles.estadoDetalle
              ? citaActualizadaConDetalles.estadoDetalle.nombreEstado
              : "Desconocido",
            servicios: citaActualizadaConDetalles.serviciosProgramados.map(
              (s) => ({
                nombre: s.nombre,
                precio: s.precio,
                descripcion: s.descripcion,
              })
            ),
            total: citaActualizadaConDetalles.serviciosProgramados.reduce(
              (sum, s) => sum + Number(s.precio || 0),
              0
            ),
            mensajeAdicional: "Los detalles de tu cita han sido actualizados.",
          },
        });
      } catch (emailError) {
        console.error(
          `Error al enviar correo de actualización de cita ${cita.idCita}:`,
          emailError
        );
      }
    }
    return citaActualizadaConDetalles;
  } catch (error) {
    await transaction.rollback();
    if (
      error instanceof NotFoundError ||
      error instanceof BadRequestError ||
      error instanceof ConflictError
    )
      throw error;
    console.error(
      `Error al actualizar la cita con ID ${idCita} en el servicio:`,
      error.message,
      error.stack
    );
    throw new CustomError(`Error al actualizar la cita: ${error.message}`, 500);
  }
};

const anularCita = async (idCita) => {
  const transaction = await db.sequelize.transaction();
  try {
    const cita = await db.Cita.findByPk(idCita, {
      include: [
        { model: db.Cliente, as: "cliente", attributes: ["nombre", "correo"] },
      ], // Para el correo
      transaction,
    });
    if (!cita) {
      await transaction.rollback();
      throw new NotFoundError("Cita no encontrada para anular.");
    }
    if (!cita.estado) {
      await transaction.rollback();
      return cita;
    }

    const estadoCancelado = await db.Estado.findOne({
      where: { nombreEstado: "Cancelado" },
      transaction,
    });
    await cita.update(
      {
        estado: false,
        estadoCitaId: estadoCancelado
          ? estadoCancelado.idEstado
          : cita.estadoCitaId,
      },
      { transaction }
    );
    await transaction.commit();

    const citaAnuladaConDetalles = await obtenerCitaCompletaPorId(cita.idCita);

    if (citaAnuladaConDetalles && cita.cliente && cita.cliente.correo) {
      // Usar 'cita.cliente' que ya teníamos
      try {
        await enviarCorreoCita({
          correo: cita.cliente.correo,
          nombreCliente: cita.cliente.nombre || "Cliente",
          citaInfo: {
            accion: "cancelada",
            fechaHora: formatDateTime(citaAnuladaConDetalles.fechaHora),
            empleado: citaAnuladaConDetalles.empleado
              ? citaAnuladaConDetalles.empleado.nombre
              : "No asignado",
            estado: citaAnuladaConDetalles.estadoDetalle
              ? citaAnuladaConDetalles.estadoDetalle.nombreEstado
              : "Cancelada",
            servicios: citaAnuladaConDetalles.serviciosProgramados.map((s) => ({
              nombre: s.nombre,
              precio: s.precio,
              descripcion: s.descripcion,
            })),
            total: citaAnuladaConDetalles.serviciosProgramados.reduce(
              (sum, s) => sum + Number(s.precio || 0),
              0
            ),
          },
        });
      } catch (emailError) {
        console.error(
          `Error al enviar correo de anulación de cita ${cita.idCita}:`,
          emailError
        );
      }
    }
    return citaAnuladaConDetalles;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al anular la cita con ID ${idCita} en el servicio:`,
      error.message
    );
    throw new CustomError(`Error al anular la cita: ${error.message}`, 500);
  }
};

const habilitarCita = async (idCita) => {
  const transaction = await db.sequelize.transaction();
  try {
    const cita = await db.Cita.findByPk(idCita, {
      include: [
        { model: db.Cliente, as: "cliente", attributes: ["nombre", "correo"] },
      ],
      transaction,
    });
    if (!cita) {
      await transaction.rollback();
      throw new NotFoundError("Cita no encontrada para habilitar.");
    }
    if (cita.estado) {
      await transaction.rollback();
      return cita;
    }

    const estadoPendiente = await db.Estado.findOne({
      where: { nombreEstado: "Pendiente" },
      transaction,
    });
    await cita.update(
      {
        estado: true,
        estadoCitaId: estadoPendiente
          ? estadoPendiente.idEstado
          : cita.estadoCitaId, // O el estado que consideres al reactivar
      },
      { transaction }
    );
    await transaction.commit();

    const citaHabilitadaConDetalles = await obtenerCitaCompletaPorId(
      cita.idCita
    );

    // Podrías enviar un correo de "Cita reactivada" aquí si lo deseas.
    if (citaHabilitadaConDetalles && cita.cliente && cita.cliente.correo) {
      try {
        await enviarCorreoCita({
          correo: cita.cliente.correo,
          nombreCliente: cita.cliente.nombre || "Cliente",
          citaInfo: {
            accion: "reactivada", // O 'reprogramada' o 'confirmada' según tu lógica
            fechaHora: formatDateTime(citaHabilitadaConDetalles.fechaHora),
            empleado: citaHabilitadaConDetalles.empleado
              ? citaHabilitadaConDetalles.empleado.nombre
              : "No asignado",
            estado: citaHabilitadaConDetalles.estadoDetalle
              ? citaHabilitadaConDetalles.estadoDetalle.nombreEstado
              : "Desconocido",
            servicios: citaHabilitadaConDetalles.serviciosProgramados.map(
              (s) => ({
                nombre: s.nombre,
                precio: s.precio,
                descripcion: s.descripcion,
              })
            ),
            total: citaHabilitadaConDetalles.serviciosProgramados.reduce(
              (sum, s) => sum + Number(s.precio || 0),
              0
            ),
          },
        });
      } catch (emailError) {
        console.error(
          `Error al enviar correo de habilitación de cita ${cita.idCita}:`,
          emailError
        );
      }
    }
    return citaHabilitadaConDetalles;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al habilitar la cita con ID ${idCita} en el servicio:`,
      error.message
    );
    throw new CustomError(`Error al habilitar la cita: ${error.message}`, 500);
  }
};

const eliminarCitaFisica = async (idCita) => {
  const transaction = await db.sequelize.transaction();
  try {
    const cita = await db.Cita.findByPk(idCita, { transaction });
    if (!cita) {
      await transaction.rollback();
      throw new NotFoundError("Cita no encontrada para eliminar físicamente.");
    }
    // Aquí podrías querer enviar un correo ANTES de borrarla, si es una acción que requiere notificación.
    // Pero usualmente la eliminación física es una acción administrativa que no se notifica al cliente.
    const filasEliminadas = await db.Cita.destroy({
      where: { idCita },
      transaction,
    });
    await transaction.commit();
    return filasEliminadas;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al eliminar físicamente la cita con ID ${idCita}:`,
      error.message
    );
    throw new CustomError(
      `Error al eliminar físicamente la cita: ${error.message}`,
      500
    );
  }
};

const agregarServiciosACita = async (idCita, idServicios) => {
  const transaction = await db.sequelize.transaction();
  try {
    const cita = await db.Cita.findByPk(idCita, {
      include: [
        { model: db.Cliente, as: "cliente", attributes: ["nombre", "correo"] },
      ],
      transaction,
    });
    if (!cita) {
      await transaction.rollback();
      throw new NotFoundError("Cita no encontrada para agregar servicios.");
    }
    if (!cita.estado) {
      await transaction.rollback();
      throw new BadRequestError(
        "No se pueden agregar servicios a una cita anulada."
      );
    }

    const serviciosDB = await db.Servicio.findAll({
      where: { idServicio: idServicios, estado: true },
      transaction,
    });
    if (serviciosDB.length !== idServicios.length) {
      await transaction.rollback();
      const idsEncontrados = serviciosDB.map((s) => s.idServicio);
      const idsNoEncontrados = idServicios.filter(
        (id) => !idsEncontrados.includes(id)
      );
      throw new NotFoundError(
        `Uno o más servicios no existen o están inactivos: IDs ${idsNoEncontrados.join(
          ", "
        )}`
      );
    }

    await cita.addServiciosProgramados(serviciosDB, { transaction });
    await transaction.commit();

    const citaActualizadaConDetalles = await obtenerCitaCompletaPorId(idCita);

    // --- ENVÍO DE CORREO AL AGREGAR SERVICIOS ---
    if (
      citaActualizadaConDetalles &&
      cita.cliente &&
      cita.cliente.correo &&
      citaActualizadaConDetalles.estado
    ) {
      try {
        await enviarCorreoCita({
          correo: cita.cliente.correo,
          nombreCliente: cita.cliente.nombre || "Cliente",
          citaInfo: {
            accion: "modificada (servicios agregados)",
            fechaHora: formatDateTime(citaActualizadaConDetalles.fechaHora),
            empleado: citaActualizadaConDetalles.empleado
              ? citaActualizadaConDetalles.empleado.nombre
              : "No asignado",
            estado: citaActualizadaConDetalles.estadoDetalle
              ? citaActualizadaConDetalles.estadoDetalle.nombreEstado
              : "Desconocido",
            servicios: citaActualizadaConDetalles.serviciosProgramados.map(
              (s) => ({
                nombre: s.nombre,
                precio: s.precio,
                descripcion: s.descripcion,
              })
            ),
            total: citaActualizadaConDetalles.serviciosProgramados.reduce(
              (sum, s) => sum + Number(s.precio || 0),
              0
            ),
            mensajeAdicional: "Se han añadido nuevos servicios a tu cita.",
          },
        });
      } catch (emailError) {
        console.error(
          `Error al enviar correo de actualización de servicios de cita ${cita.idCita}:`,
          emailError
        );
      }
    }
    // --- FIN ENVÍO DE CORREO ---
    return citaActualizadaConDetalles;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError || error instanceof BadRequestError)
      throw error;
    console.error(`Error al agregar servicios a la cita ID ${idCita}:`, error);
    throw new CustomError(
      `Error al agregar servicios a la cita: ${error.message}`,
      500
    );
  }
};

const quitarServiciosDeCita = async (idCita, idServicios) => {
  const transaction = await db.sequelize.transaction();
  try {
    const cita = await db.Cita.findByPk(idCita, {
      include: [
        { model: db.Cliente, as: "cliente", attributes: ["nombre", "correo"] },
      ],
      transaction,
    });
    if (!cita) {
      await transaction.rollback();
      throw new NotFoundError("Cita no encontrada para quitar servicios.");
    }
    if (!cita.estado) {
      await transaction.rollback();
      throw new BadRequestError(
        "No se pueden quitar servicios de una cita anulada."
      );
    }

    await cita.removeServiciosProgramados(idServicios, { transaction });
    await transaction.commit();

    const citaActualizadaConDetalles = await obtenerCitaCompletaPorId(idCita);

    // --- ENVÍO DE CORREO AL QUITAR SERVICIOS ---
    if (
      citaActualizadaConDetalles &&
      cita.cliente &&
      cita.cliente.correo &&
      citaActualizadaConDetalles.estado
    ) {
      try {
        await enviarCorreoCita({
          correo: cita.cliente.correo,
          nombreCliente: cita.cliente.nombre || "Cliente",
          citaInfo: {
            accion: "modificada (servicios quitados)",
            fechaHora: formatDateTime(citaActualizadaConDetalles.fechaHora),
            empleado: citaActualizadaConDetalles.empleado
              ? citaActualizadaConDetalles.empleado.nombre
              : "No asignado",
            estado: citaActualizadaConDetalles.estadoDetalle
              ? citaActualizadaConDetalles.estadoDetalle.nombreEstado
              : "Desconocido",
            servicios: citaActualizadaConDetalles.serviciosProgramados.map(
              (s) => ({
                nombre: s.nombre,
                precio: s.precio,
                descripcion: s.descripcion,
              })
            ),
            total: citaActualizadaConDetalles.serviciosProgramados.reduce(
              (sum, s) => sum + Number(s.precio || 0),
              0
            ),
            mensajeAdicional: "Se han quitado servicios de tu cita.",
          },
        });
      } catch (emailError) {
        console.error(
          `Error al enviar correo de actualización de servicios de cita ${cita.idCita}:`,
          emailError
        );
      }
    }
    // --- FIN ENVÍO DE CORREO ---
    return citaActualizadaConDetalles;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError || error instanceof BadRequestError)
      throw error;
    console.error(`Error al quitar servicios de la cita ID ${idCita}:`, error);
    throw new CustomError(
      `Error al quitar servicios de la cita: ${error.message}`,
      500
    );
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
