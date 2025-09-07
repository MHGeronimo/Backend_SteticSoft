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

// Helper para obtener la información completa de una cita, incluyendo el estado
const obtenerCitaCompletaPorIdInterno = async (idCita, transaction = null) => {
  return db.Cita.findByPk(idCita, {
    include: [
      {
        model: db.Cliente,
        as: "cliente",
        attributes: ["idCliente", "nombre", "apellido", "correo", "estado"],
      },
      {
        model: db.Usuario, // ✅ CORRECCIÓN: Se usa el modelo correcto 'Usuario'
        as: "empleado",
        attributes: ["idUsuario", "nombre"],
        required: false,
      },
      {
        // ✅ RESTAURADO: Se vuelve a incluir la asociación con la tabla Estado
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

// Crea una cita, asignando un idEstado inicial
const crearCita = async (datosCita) => {
  const { fechaHora, idCliente, idUsuario, idEstado, servicios = [], idNovedad } = datosCita;

  const novedad = await db.Novedad.findByPk(idNovedad, { include: [{ model: db.Usuario, as: 'empleados' }] });
  if (!novedad) throw new BadRequestError(`La novedad con ID ${idNovedad} no fue encontrada.`);
  
  const empleadoValido = novedad.empleados.some(emp => emp.idUsuario === idUsuario);
  if (!empleadoValido) throw new BadRequestError(`El empleado con ID ${idUsuario} no está asociado a la novedad.`);

  const transaction = await db.sequelize.transaction();
  try {
    const nuevaCita = await db.Cita.create({
        fechaHora,
        idCliente,
        idUsuario,
        idEstado, // El front-end debe enviar el ID del estado 'Pendiente'
        idNovedad,
        estado: true, // El registro está activo por defecto
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

