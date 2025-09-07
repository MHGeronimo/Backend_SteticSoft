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
        attributes: ["idUsuario", "nombre"],
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
        attributes: ["idServicio", "nombre", "precio", "descripcion"],
        through: { attributes: [] },
      },
    ],
    transaction,
  });
};

const cambiarEstadoCita = async (idCita, nuevoEstadoBooleano, accionCorreo) => {
    const transaction = await db.sequelize.transaction();
    try {
        const cita = await db.Cita.findByPk(idCita, {
            include: [
                { model: db.Cliente, as: 'cliente', attributes: ['nombre', 'correo'] },
                { model: db.Usuario, as: 'empleado', attributes: ['nombre'], required: false },
                { model: db.Estado, as: 'estadoDetalle' },
                { model: db.Servicio, as: 'serviciosProgramados', attributes: ["idServicio", "nombre", "precio", "descripcion"], through: { attributes: [] } }
            ],
            transaction
        });

        if (!cita) {
            await transaction.rollback();
            throw new NotFoundError(`Cita no encontrada para ${accionCorreo}.`);
        }

        if (cita.estado === nuevoEstadoBooleano) {
            await transaction.rollback();
            return cita;
        }

        const updates = { estado: nuevoEstadoBooleano };
        const estadoNombre = nuevoEstadoBooleano ? 'Pendiente' : 'Cancelado';
        const estadoCita = await db.Estado.findOne({ where: { nombreEstado: estadoNombre }, transaction });
        if (estadoCita) {
            updates.idEstado = estadoCita.idEstado;
        }

        await cita.update(updates, { transaction });
        await transaction.commit();

        const citaActualizadaConDetalles = await obtenerCitaCompletaPorIdInterno(idCita);

        if (citaActualizadaConDetalles && cita.cliente && cita.cliente.correo) {
            // ... (lógica de envío de correo)
        }
        return citaActualizadaConDetalles;
    } catch (error) {
        await transaction.rollback();
        console.error(`Error al ${accionCorreo} la cita con ID ${idCita}:`, error.message);
        throw new CustomError(`Error al ${accionCorreo} la cita: ${error.message}`, 500);
    }
};


const crearCita = async (datosCita) => {
  const { fechaHora, idCliente, idUsuario, idEstado, servicios = [], idNovedad } = datosCita;

  const novedad = await db.Novedad.findByPk(idNovedad, {
    include: [{ model: db.Usuario, as: 'empleados' }]
  });
  if (!novedad) {
    throw new BadRequestError(`La novedad con ID ${idNovedad} no fue encontrada.`);
  }

  const empleadoValido = novedad.empleados.some(emp => emp.idUsuario === idUsuario);
  if (!empleadoValido) {
    throw new BadRequestError(`El empleado con ID ${idUsuario} no está asociado a la novedad seleccionada.`);
  }

  // ... (validaciones de fecha/hora)

  const transaction = await db.sequelize.transaction();
  try {
    const nuevaCita = await db.Cita.create(
      {
        fechaHora,
        idCliente,
        idUsuario,
        idEstado,
        idNovedad,
        estado: true,
      },
      { transaction }
    );

    if (servicios.length > 0) {
        const serviciosConsultados = await db.Servicio.findAll({ where: { idServicio: servicios, estado: true }});
        if (serviciosConsultados.length !== servicios.length) {
            throw new BadRequestError("Uno o más servicios no existen o están inactivos.");
        }
        await nuevaCita.addServiciosProgramados(serviciosConsultados, { transaction });
    }

    await transaction.commit();
    return await obtenerCitaCompletaPorIdInterno(nuevaCita.idCita);
  } catch (error) {
    await transaction.rollback();
    console.error("Error al crear la cita en el servicio:", error.stack);
    throw new CustomError(`Error al crear la cita: ${error.message}`, 500);
  }
};

const obtenerTodasLasCitas = async (opcionesDeFiltro = {}) => {
  const whereClause = {};
  
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
        { model: db.Cliente, as: "cliente", attributes: ["idCliente", "nombre", "apellido"] },
        { model: db.Usuario, as: "empleado", attributes: ["idUsuario", "nombre"], required: false },
        { model: db.Estado, as: "estadoDetalle", attributes: ["idEstado", "nombreEstado"] },
        { model: db.Servicio, as: "serviciosProgramados", attributes: ["idServicio", "nombre", "precio", "descripcion"], through: { attributes: [] } },
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
    if (!cita) {
      throw new NotFoundError("Cita no encontrada para actualizar.");
    }

    // Aquí se realizarían todas las validaciones de negocio necesarias
    // como verificar si la nueva fecha/hora está disponible, si el empleado es válido, etc.
    // Esta es una implementación básica:
    await cita.update(datosActualizar, { transaction });

    // Si se envía una nueva lista de servicios, se actualiza la relación
    if (datosActualizar.servicios && Array.isArray(datosActualizar.servicios)) {
        const serviciosConsultados = await db.Servicio.findAll({ where: { idServicio: datosActualizar.servicios, estado: true }, transaction });
        if (serviciosConsultados.length !== datosActualizar.servicios.length) {
            throw new BadRequestError("Uno o más servicios para actualizar no existen o están inactivos.");
        }
        await cita.setServiciosProgramados(serviciosConsultados, { transaction });
    }

    await transaction.commit();
    return await obtenerCitaCompletaPorIdInterno(idCita);
  } catch (error) {
    await transaction.rollback();
    console.error("Error al actualizar la cita:", error);
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
  const cita = await db.Cita.findByPk(idCita);
  if (!cita) {
    throw new NotFoundError("Cita no encontrada para eliminar.");
  }
  
  // ✅ VALIDACIÓN AÑADIDA: Verificar si existen ventas asociadas a esta cita.
  // La asociación se llama 'detallesVenta' en el modelo Cita (hasMany VentaXServicio).
  const ventasAsociadasCount = await cita.countDetallesVenta();
  
  if (ventasAsociadasCount > 0) {
    throw new ConflictError(
      `No se puede eliminar la cita porque tiene ${ventasAsociadasCount} servicio(s) facturado(s) en una venta.`
    );
  }

  // Si no hay ventas asociadas, se procede con la eliminación.
  await cita.destroy();
  return { message: "Cita eliminada permanentemente." };
};

const agregarServiciosACita = async (idCita, idServicios) => {
  const transaction = await db.sequelize.transaction();
  try {
    const cita = await db.Cita.findByPk(idCita, { transaction });
    if (!cita) {
      throw new NotFoundError("Cita no encontrada.");
    }

    const servicios = await db.Servicio.findAll({ where: { idServicio: idServicios, estado: true }, transaction });
    if (servicios.length !== idServicios.length) {
      throw new BadRequestError("Uno o más servicios no existen o están inactivos.");
    }

    await cita.addServiciosProgramados(servicios, { transaction });
    await transaction.commit();
    return await obtenerCitaCompletaPorIdInterno(idCita);
  } catch (error) {
    await transaction.rollback();
    console.error("Error al agregar servicios a la cita:", error);
    throw new CustomError(`Error al agregar servicios: ${error.message}`, 500);
  }
};

const quitarServiciosDeCita = async (idCita, idServicios) => {
  const transaction = await db.sequelize.transaction();
  try {
    const cita = await db.Cita.findByPk(idCita, { transaction });
    if (!cita) {
      throw new NotFoundError("Cita no encontrada.");
    }
    // No es necesario buscar los servicios, Sequelize se encarga de la relación
    await cita.removeServiciosProgramados(idServicios, { transaction });
    await transaction.commit();
    return await obtenerCitaCompletaPorIdInterno(idCita);
  } catch (error) {
    await transaction.rollback();
    console.error("Error al quitar servicios de la cita:", error);
    throw new CustomError(`Error al quitar servicios: ${error.message}`, 500);
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

