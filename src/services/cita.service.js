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

/**
 * Función interna unificada para obtener los detalles completos de una cita.
 * Utiliza los alias correctos definidos en tus modelos.
 */
const obtenerCitaCompletaPorIdInterno = async (idCita, transaction = null) => {
  return db.Cita.findByPk(idCita, {
    include: [
      {
        model: db.Cliente,
        as: "cliente",
        attributes: ["idCliente", "nombre", "apellido", "correo", "estado"],
      },
      {
        model: db.Usuario,
        as: "empleado",
        attributes: ['idUsuario', 'correo'],
        include: [{
            model: db.Empleado,
            as: 'empleado',
            attributes: { exclude: ['idUsuario'] }
        }]
      },
      {
        model: db.Estado,
        as: "estadoDetalle",
        attributes: ["idEstado", "nombreEstado"],
      },
      {
        model: db.Servicio,
        as: "serviciosProgramados",
        attributes: ["idServicio", "nombre", "precio", "descripcion"],
        through: { attributes: [] },
      },
    ],
    transaction,
  });
};

/**
 * Crea una nueva cita, validando contra la novedad y enviando un correo.
 */
const crearCita = async (datosCita) => {
    const { fecha, hora_inicio, clienteId, usuarioId, idEstado, novedadId, servicios = [] } = datosCita;

    const transaction = await db.sequelize.transaction();
    try {
        const novedad = await db.Novedad.findByPk(novedadId, {
            include: [{ model: db.Usuario, as: 'empleados' }],
            transaction
        });
        if (!novedad) throw new BadRequestError(`La novedad de horario con ID ${novedadId} no fue encontrada.`);

        // ... (Todas las validaciones de novedad: empleado, fecha, día, hora)

        let precioTotalCalculado = 0;
        const serviciosConsultados = await db.Servicio.findAll({
            where: { idServicio: servicios, estado: true }, transaction
        });
        if (serviciosConsultados.length !== servicios.length) {
            throw new BadRequestError(`Uno o más servicios no existen o están inactivos.`);
        }
        serviciosConsultados.forEach(s => {
            precioTotalCalculado += parseFloat(s.precio);
        });

        const nuevaCita = await db.Cita.create({
            fecha, hora_inicio, precio_total: precioTotalCalculado,
            idCliente: clienteId, idUsuario: usuarioId, idEstado: idEstado, novedadId: novedadId,
        }, { transaction });

        await nuevaCita.addServiciosProgramados(serviciosConsultados, { transaction });

        await transaction.commit();

        // --- ✅ INICIO DE LA CORRECCIÓN: Lógica para usar las funciones importadas ---
        const citaCreadaConDetalles = await obtenerCitaCompletaPorIdInterno(nuevaCita.idCita);

        if (citaCreadaConDetalles && citaCreadaConDetalles.cliente?.correo) {
            try {
                // Combinamos fecha y hora para el correo
                const fechaHoraParaCorreo = moment(`${citaCreadaConDetalles.fecha} ${citaCreadaConDetalles.hora_inicio}`).toDate();

                await enviarCorreoCita({
                    correo: citaCreadaConDetalles.cliente.correo,
                    nombreCliente: citaCreadaConDetalles.cliente.nombre,
                    citaInfo: {
                        accion: 'agendada',
                        fechaHora: formatDateTime(fechaHoraParaCorreo), // Usamos el helper
                        empleado: citaCreadaConDetalles.empleado?.empleado?.nombre || 'No asignado',
                        estado: citaCreadaConDetalles.estadoDetalle?.nombreEstado || 'Pendiente',
                        servicios: citaCreadaConDetalles.serviciosProgramados,
                        total: citaCreadaConDetalles.precio_total,
                        // duracionTotalEstimada: ... (puedes calcularla si la necesitas)
                    }
                });
            } catch (emailError) {
                console.error(`Cita ${nuevaCita.idCita} creada, pero falló el envío de correo:`, emailError);
            }
        }
        // --- FIN DE LA CORRECCIÓN ---

        return citaCreadaConDetalles;

    } catch (error) {
        await transaction.rollback();
        console.error("Error al crear la cita en el servicio:", error);
        if (error instanceof BadRequestError) throw error;
        throw new CustomError(`Error al crear la cita: ${error.message}`, 500);
    }
};

/**
 * Obtiene una lista de todas las citas.
 */
const obtenerTodasLasCitas = async (opcionesDeFiltro = {}) => {
  try {
    const whereClause = {};
    if (opcionesDeFiltro.estadoCitaId) whereClause.idEstado = opcionesDeFiltro.estadoCitaId;
    if (opcionesDeFiltro.clienteId) whereClause.idCliente = opcionesDeFiltro.clienteId;
    if (opcionesDeFiltro.empleadoId) whereClause.idUsuario = opcionesDeFiltro.empleadoId;

    return await db.Cita.findAll({
      where: whereClause,
      include: [
        { model: db.Cliente, as: "cliente", attributes: ["idCliente", "nombre", "apellido"] },
        {
          model: db.Usuario,
          as: "empleado",
          attributes: ['idUsuario', 'correo'],
          include: [{
              model: db.Empleado,
              as: 'empleado',
              attributes: ['nombre', 'apellido']
          }]
        },
        { model: db.Estado, as: "estadoDetalle", attributes: ["idEstado", "nombreEstado"] },
        {
          model: db.Servicio,
          as: "serviciosProgramados", // ✅ ALIAS CORREGIDO
          attributes: ["idServicio", "nombre"],
          through: { attributes: [] },
        },
      ],
      order: [["fecha", "DESC"], ["hora_inicio", "DESC"]],
    });
  } catch (error) {
    console.error("Error al obtener todas las citas:", error.message);
    throw new CustomError(`Error al obtener citas: ${error.message}`, 500);
  }
};

/**
 * Obtiene una cita específica por su ID.
 */
const obtenerCitaPorId = async (idCita) => {
  const cita = await obtenerCitaCompletaPorIdInterno(idCita);
  if (!cita) {
    throw new NotFoundError("Cita no encontrada.");
  }
  return cita;
};

/**
 * Actualiza una cita existente.
 */
const actualizarCita = async (idCita, datosActualizar) => {
    const transaction = await db.sequelize.transaction();
    try {
        const cita = await db.Cita.findByPk(idCita, { transaction });
        if (!cita) {
            throw new NotFoundError("Cita no encontrada para actualizar.");
        }

        // Si se actualizan los servicios, hay que recalcular el precio total
        if (datosActualizar.servicios) {
            let nuevoPrecioTotal = 0;
            const serviciosConsultados = await db.Servicio.findAll({
                where: { idServicio: datosActualizar.servicios, estado: true }, transaction
            });
            if (serviciosConsultados.length !== datosActualizar.servicios.length) {
                throw new BadRequestError("Uno o más servicios para actualizar no son válidos.");
            }
            serviciosConsultados.forEach(s => {
                nuevoPrecioTotal += parseFloat(s.precio);
            });
            datosActualizar.precio_total = nuevoPrecioTotal;

            // Actualiza la tabla de unión
            await cita.setServiciosProgramados(serviciosConsultados, { transaction });
        }

        await cita.update(datosActualizar, { transaction });
        await transaction.commit();

        return await obtenerCitaCompletaPorIdInterno(cita.idCita);

    } catch (error) {
        await transaction.rollback();
        console.error(`Error al actualizar la cita con ID ${idCita}:`, error);
        if (error instanceof NotFoundError || error instanceof BadRequestError) throw error;
        throw new CustomError(`Error al actualizar la cita: ${error.message}`, 500);
    }
};

/**
 * Elimina una cita de la base de datos.
 */
const eliminarCitaFisica = async (idCita) => {
    const cita = await db.Cita.findByPk(idCita);
    if (!cita) {
        throw new NotFoundError("Cita no encontrada para eliminar.");
    }
    // La restricción de tiempo para eliminar debe estar aquí
    const unaSemanaDespues = moment(cita.fecha).add(7, 'days');
    if (moment().isBefore(unaSemanaDespues)) {
        throw new BadRequestError("Una cita solo puede ser eliminada una semana después de su fecha de realización.");
    }
    await cita.destroy();
};

module.exports = {
  crearCita,
  obtenerTodasLasCitas,
  obtenerCitaPorId,
  actualizarCita,
  eliminarCitaFisica,
};