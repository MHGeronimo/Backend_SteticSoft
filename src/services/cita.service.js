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

// Helper para obtener la información completa de una cita
const obtenerCitaCompletaPorIdInterno = async (idCita, transaction = null) => {
  return db.Cita.findByPk(idCita, {
    include: [
      { model: db.Cliente, as: "cliente" },
      { model: db.Usuario, as: "empleado", required: false },
      { model: db.Servicio, as: "servicios", through: { attributes: [] } },
    ],
    transaction,
  });
};

// Crea una cita, con validaciones robustas
const crearCita = async (datosCita) => {
  const { fecha, horaInicio, idCliente, idUsuario, servicios = [], idNovedad, estado } = datosCita;

  const novedad = await db.Novedad.findByPk(idNovedad, {
    include: [{ model: db.Usuario, as: "empleados", attributes: ["idUsuario"] }],
  });
  if (!novedad)
    throw new BadRequestError(`La novedad con ID ${idNovedad} no fue encontrada.`);

  if (idUsuario) {
    const empleadoValido = novedad.empleados.some(
      (emp) => emp.idUsuario === idUsuario
    );
    if (!empleadoValido)
      throw new BadRequestError(
        `El empleado con ID ${idUsuario} no está asociado a la novedad.`
      );
  }

  const transaction = await db.sequelize.transaction();
  try {
    const citaExistente = await db.Cita.findOne({
      where: {
        fecha,
        horaInicio,
        idNovedad: idNovedad,
      },
      transaction,
    });

    if (citaExistente) {
      throw new ConflictError(
        "Este horario acaba de ser reservado. Por favor, selecciona otro."
      );
    }

    let precioTotal = 0;
    if (servicios.length > 0) {
      const serviciosDb = await db.Servicio.findAll({
        where: { idServicio: servicios, estado: true },
      });
      if (serviciosDb.length !== servicios.length)
        throw new BadRequestError(
          "Uno o más servicios no existen o están inactivos."
        );
      precioTotal = serviciosDb.reduce(
        (total, servicio) => total + parseFloat(servicio.precio),
        0
      );
    }

    const nuevaCita = await db.Cita.create(
      {
        fecha,
        horaInicio,
        idCliente,
        idUsuario,
        idNovedad,
        precioTotal,
        estado: estado || "Activa",
      },
      { transaction }
    );

    if (servicios.length > 0) {
      await nuevaCita.setServicios(servicios, { transaction });
    }

    await transaction.commit();
    return await obtenerCitaCompletaPorIdInterno(nuevaCita.idCita);
  } catch (error) {
    await transaction.rollback();
    if (error instanceof BadRequestError || error instanceof ConflictError)
      throw error;
    console.error("Error al crear la cita en el servicio:", error.stack);
    throw new CustomError(`Error al crear la cita: ${error.message}`, 500);
  }
};

// Obtiene todas las citas, permitiendo filtrar por estado, cliente, empleado y fecha
const obtenerTodasLasCitas = async (opcionesDeFiltro = {}) => {
  const whereClause = {};

  if (opcionesDeFiltro.estado) whereClause.estado = opcionesDeFiltro.estado;
  if (opcionesDeFiltro.idCliente)
    whereClause.idCliente = opcionesDeFiltro.idCliente;
  if (opcionesDeFiltro.idUsuario)
    whereClause.idUsuario = opcionesDeFiltro.idUsuario;
  if (opcionesDeFiltro.fecha) whereClause.fecha = opcionesDeFiltro.fecha;

  try {
    return await db.Cita.findAll({
      where: whereClause,
      attributes: [
        "idCita",
        "fecha",
        "horaInicio",
        "precioTotal",
        "estado",
        "idCliente",
        "idUsuario",
        "idNovedad",
      ],
      include: [
        { model: db.Cliente, as: "cliente" },
        { model: db.Usuario, as: "empleado", required: false },
        { model: db.Servicio, as: "servicios", through: { attributes: [] } },
      ],
      order: [
        ["fecha", "ASC"],
        ["horaInicio", "ASC"],
      ],
    });
  } catch (error) {
    console.error("Error al obtener todas las citas:", error.message);
    throw new CustomError(`Error al obtener citas: ${error.message}`, 500);
  }
};

const obtenerDiasDisponiblesPorNovedad = async (idNovedad, mes, anio) => {
    const novedad = await db.Novedad.findByPk(idNovedad);
    if (!novedad) {
      throw new NotFoundError("Novedad no encontrada");
    }
  
    const diasDisponibles = Array.isArray(novedad.dias)
      ? novedad.dias
      : JSON.parse(novedad.dias);
  
    const fechaInicio = moment(`${anio}-${mes}-01`);
    const fechaFin = fechaInicio.clone().endOf("month");
    const diasDelMes = [];
  
    while (fechaInicio.isSameOrBefore(fechaFin)) {
      if (diasDisponibles.includes(fechaInicio.isoWeekday())) {
        const fechaActual = fechaInicio.clone();
        const fechaInicioNovedad = moment(novedad.fechaInicio);
        const fechaFinNovedad = moment(novedad.fechaFin);
  
        if (
          fechaActual.isBetween(fechaInicioNovedad, fechaFinNovedad, null, "[]")
        ) {
          diasDelMes.push(fechaActual.format("YYYY-MM-DD"));
        }
      }
      fechaInicio.add(1, "day");
    }
  
    return diasDelMes;
  };
  
  const obtenerHorariosDisponiblesPorNovedad = async (idNovedad, fecha) => {
    const novedad = await db.Novedad.findByPk(idNovedad);
    if (!novedad || !novedad.estado)
      throw new NotFoundError("Novedad no encontrada o inactiva");
  
    const fechaMoment = moment.tz(fecha, "America/Bogota");
    const diaSemana = fechaMoment.isoWeekday();
  
    const diasDisponibles = Array.isArray(novedad.dias)
      ? novedad.dias
      : JSON.parse(novedad.dias);
    if (!diasDisponibles.includes(diaSemana)) return [];
  
    if (
      !fechaMoment.isBetween(
        moment(novedad.fechaInicio),
        moment(novedad.fechaFin),
        "day",
        "[]"
      )
    )
      return [];
  
    const citasExistentes = await db.Cita.findAll({
      where: {
        idNovedad,
        fecha: fecha,
      },
      attributes: ["horaInicio"],
    });
    const horariosOcupados = new Set(
      citasExistentes.map((c) => c.horaInicio)
    );
  
    const horariosDisponibles = [];
    let horaActual = moment.tz(
      `${fecha} ${novedad.horaInicio}`,
      "America/Bogota"
    );
    const horaFin = moment.tz(`${fecha} ${novedad.horaFin}`, "America/Bogota");
  
    while (horaActual.isBefore(horaFin)) {
      const horarioFormateado = horaActual.format("HH:mm:ss");
      if (!horariosOcupados.has(horarioFormateado)) {
        horariosDisponibles.push(horarioFormateado);
      }
      horaActual.add(30, "minutes");
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
      const serviciosDb = await db.Servicio.findAll({
        where: { idServicio: datosActualizar.servicios, estado: true },
        transaction,
      });
      if (serviciosDb.length !== datosActualizar.servicios.length)
        throw new BadRequestError(
          "Uno o más servicios para actualizar no existen o están inactivos."
        );
      await cita.setServicios(serviciosDb, { transaction });

      const precioTotal = serviciosDb.reduce(
        (total, servicio) => total + parseFloat(servicio.precio),
        0
      );
      await cita.update({ precioTotal }, { transaction });
    }

    await transaction.commit();
    return await obtenerCitaCompletaPorIdInterno(idCita);
  } catch (error) {
    await transaction.rollback();
    throw new CustomError(`Error al actualizar la cita: ${error.message}`, 500);
  }
};

const cambiarEstadoCita = async (idCita, nuevoEstado) => {
  const cita = await db.Cita.findByPk(idCita);
  if (!cita) {
    throw new NotFoundError("Cita no encontrada.");
  }

  if (!["Activa", "En Proceso", "Finalizada", "Cancelada"].includes(nuevoEstado)) {
    throw new BadRequestError(`El estado "${nuevoEstado}" no es válido.`);
  }

  await cita.update({ estado: nuevoEstado });
  return await obtenerCitaCompletaPorIdInterno(idCita);
};

const eliminarCitaFisica = async (idCita) => {
  const cita = await db.Cita.findByPk(idCita);
  if (!cita) {
    throw new NotFoundError("Cita no encontrada para eliminar.");
  }

  const ventasAsociadasCount = await cita.countDetallesVenta();
  if (ventasAsociadasCount > 0) {
    throw new ConflictError(
      `No se puede eliminar la cita porque tiene ${ventasAsociadasCount} servicio(s) facturado(s).`
    );
  }

  await cita.destroy();
  return { message: "Cita eliminada permanentemente." };
};

const obtenerEmpleadosPorNovedad = async (idNovedad) => {
  const novedad = await db.Novedad.findByPk(idNovedad, {
    include: [
      {
        model: db.Usuario,
        as: "empleados",
        attributes: ["idUsuario", "nombre", "correo"],
        through: { attributes: [] },
        include: [
          {
            model: db.Empleado,
            as: "empleadoInfo",
            attributes: ["telefono"],
          },
        ],
      },
    ],
  });

  if (!novedad) {
    throw new NotFoundError("Novedad no encontrada");
  }

  return novedad.empleados.map((empleado) => ({
    idUsuario: empleado.idUsuario,
    nombre: empleado.nombre,
    apellido: empleado.apellido,
    telefono: empleado.empleadoInfo?.telefono || "No disponible",
  }));
};

const buscarClientes = async (terminoBusqueda) => {
  if (!terminoBusqueda) {
    return [];
  }
  return await db.Cliente.findAll({
    where: {
      [Op.or]: [
        { nombre: { [Op.iLike]: `%${terminoBusqueda}%` } },
        { apellido: { [Op.iLike]: `%${terminoBusqueda}%` } },
        { correo: { [Op.iLike]: `%${terminoBusqueda}%` } },
      ],
      estado: true,
    },
    limit: 10,
    attributes: ["idCliente", "nombre", "apellido", "correo", "telefono"],
  });
};

const obtenerServiciosDisponibles = async (terminoBusqueda) => {
  const whereClause = { estado: true };
  if (terminoBusqueda) {
    whereClause.nombre = { [Op.iLike]: `%${terminoBusqueda}%` };
  }
  return await db.Servicio.findAll({
    where: whereClause,
    attributes: ["idServicio", "nombre", "precio", "descripcion"],
    order: [["nombre", "ASC"]],
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
  cambiarEstadoCita,
  eliminarCitaFisica,
  obtenerEmpleadosPorNovedad,
  obtenerServiciosDisponibles,
};

