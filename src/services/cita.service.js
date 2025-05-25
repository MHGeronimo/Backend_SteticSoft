// src/services/cita.service.js
const db = require("../models");
const { Op } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors"); // Ajusta la ruta
const moment = require("moment-timezone"); // Para manejo de fechas y duraciones

/**
 * Crear una nueva cita y asociar sus servicios.
 * @param {object} datosCita - Datos de la cita.
 * Ej: { fechaHora, clienteId, empleadoId?, estadoCitaId, servicios: [idServicio1, idServicio2], estado? }
 * @returns {Promise<object>} La cita creada con sus servicios.
 */
const crearCita = async (datosCita) => {
  const {
    fechaHora,
    clienteId,
    empleadoId,
    estadoCitaId,
    servicios = [], // Array de IDs de servicio
    estado, // Estado booleano del registro Cita
  } = datosCita;

  // Validación de IDs y existencia de entidades relacionadas
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

  // Validar que todos los servicios existan y estén activos
  const serviciosConsultados = [];
  if (servicios.length > 0) {
    const serviciosDB = await db.Servicio.findAll({
      where: {
        idServicio: servicios, // Busca todos los IDs del array
        estado: true,
      },
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
    // Dependiendo de tus reglas de negocio, una cita podría requerir al menos un servicio.
    // El validador ya tiene un check opcional para esto.
    // throw new BadRequestError('Se requiere al menos un servicio para crear la cita.');
  }

  // Lógica de validación de disponibilidad de horario (Simplificada por ahora)
  // Esto puede ser muy complejo: verificar horarios del empleado, otras citas, duración de servicios.
  // Por ahora, solo una verificación básica si hay empleado y servicios.
  if (empleado && serviciosConsultados.length > 0) {
    const fechaHoraInicioMoment = moment(fechaHora); // Asume que fechaHora es una cadena ISO o Date
    let duracionTotalCitaMinutos = 0;
    serviciosConsultados.forEach((s) => {
      duracionTotalCitaMinutos += s.duracion_estimada || 0;
    });
    const fechaHoraFinMoment = fechaHoraInicioMoment
      .clone()
      .add(duracionTotalCitaMinutos, "minutes");

    // Ejemplo de verificación de colisión (muy simplificada)
    const citasSuperpuestas = await db.Cita.findOne({
      where: {
        idEmpleado: empleado.idEmpleado,
        estado: true, // Solo considerar citas activas para colisiones
        [Op.or]: [
          // La nueva cita no debe empezar ni terminar dentro de otra cita existente,
          // ni una cita existente debe empezar o terminar dentro de la nueva cita.
          {
            // Caso 1: Nueva cita empieza durante una existente
            fechaHora: {
              [Op.lt]: fechaHoraFinMoment.toDate(), // Menor que el fin de la nueva cita
              [Op.gte]: moment(fechaHoraInicioMoment)
                .subtract(duracionTotalCitaMinutos - 1, "minutes")
                .toDate(), // Evitar que el inicio sea exactamente el fin de la anterior, dar margen
            },
          },
          // Podrías necesitar casos más complejos para la superposición
          // Este es un ejemplo básico y podría necesitar refinamiento.
        ],
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

    // Asociar servicios a la cita a través de ServicioXCita
    if (serviciosConsultados.length > 0) {
      // Usar el método de asociación 'addServiciosProgramados' o el nombre del alias que hayas definido
      // en Cita.belongsToMany(models.Servicio, { as: 'serviciosProgramados', ... })
      await nuevaCita.addServiciosProgramados(serviciosConsultados, {
        transaction,
      });
    }

    await transaction.commit();

    // Devolver la cita con sus detalles (incluyendo servicios)
    return obtenerCitaPorId(nuevaCita.idCita); // Llama a la función que ya incluye los detalles
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

/**
 * Obtener todas las citas.
 * @param {object} [opcionesDeFiltro={}] - Opciones para filtrar (ej. { estado: true, clienteId: 1, empleadoId: 1, fechaHora: 'YYYY-MM-DD' }).
 * @returns {Promise<Array<object>>} Lista de citas.
 */
const obtenerTodasLasCitas = async (opcionesDeFiltro = {}) => {
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
    // Para filtrar por una fecha específica (todo el día)
    const fechaInicio = moment(opcionesDeFiltro.fecha).startOf("day").toDate();
    const fechaFin = moment(opcionesDeFiltro.fecha).endOf("day").toDate();
    whereClause.fechaHora = {
      [Op.gte]: fechaInicio,
      [Op.lte]: fechaFin,
    };
  }
  // Podrías añadir filtros por rango de fechas (fechaDesde, fechaHasta)

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
        }, // Empleado puede ser null
        {
          model: db.Estado,
          as: "estadoDetalle",
          attributes: ["idEstado", "nombreEstado"],
        },
        {
          model: db.Servicio,
          as: "serviciosProgramados", // Alias de la asociación Cita.belongsToMany(Servicio)
          attributes: ["idServicio", "nombre", "precio", "duracion_estimada"],
          through: { attributes: [] }, // No necesitamos los atributos de ServicioXCita aquí
        },
      ],
      order: [["fechaHora", "ASC"]], // O el orden que prefieras
    });
  } catch (error) {
    console.error("Error al obtener todas las citas:", error.message);
    throw new CustomError(`Error al obtener citas: ${error.message}`, 500);
  }
};

/**
 * Obtener una cita por su ID.
 */
const obtenerCitaPorId = async (idCita) => {
  try {
    const cita = await db.Cita.findByPk(idCita, {
      include: [
        { model: db.Cliente, as: "cliente" },
        { model: db.Empleado, as: "empleado", required: false },
        { model: db.Estado, as: "estadoDetalle" },
        {
          model: db.Servicio,
          as: "serviciosProgramados",
          attributes: ["idServicio", "nombre", "precio", "duracion_estimada"],
          through: { attributes: [] },
        },
      ],
    });
    if (!cita) {
      throw new NotFoundError("Cita no encontrada.");
    }
    return cita;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al obtener la cita con ID ${idCita} en el servicio:`,
      error.message
    );
    throw new CustomError(`Error al obtener la cita: ${error.message}`, 500);
  }
};

/**
 * Actualizar una cita existente (ej. reagendar, cambiar empleado, estado del proceso).
 * La modificación de servicios de una cita se manejaría con funciones/endpoints separados.
 * @param {number} idCita - ID de la cita a actualizar.
 * @param {object} datosActualizar - Datos para actualizar.
 * @returns {Promise<object>} La cita actualizada.
 */
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

    // Validaciones si los campos vienen en datosActualizar
    if (clienteId && clienteId !== cita.clienteId) {
      const cliente = await db.Cliente.findOne({
        where: { idCliente: clienteId, estado: true },
        transaction,
      });
      if (!cliente) {
        await transaction.rollback();
        throw new BadRequestError(
          `Nuevo cliente con ID ${clienteId} no encontrado o inactivo.`
        );
      }
    }
    if (empleadoId !== undefined && empleadoId !== cita.empleadoId) {
      // Permite cambiar a null
      if (empleadoId !== null) {
        const empleado = await db.Empleado.findOne({
          where: { idEmpleado: empleadoId, estado: true },
          transaction,
        });
        if (!empleado) {
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

    // Lógica de validación de disponibilidad de horario si fechaHora o empleadoId cambian (similar a crearCita)
    // Esta parte es compleja y depende de tus reglas de negocio.

    await cita.update(datosActualizar, { transaction });
    await transaction.commit();
    return obtenerCitaPorId(idCita); // Devolver la cita con todos sus includes
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

/**
 * Anular una cita (estado booleano = false).
 */
const anularCita = async (idCita) => {
  try {
    const cita = await db.Cita.findByPk(idCita);
    if (!cita) {
      throw new NotFoundError("Cita no encontrada para anular.");
    }
    if (!cita.estado) {
      return cita; // Ya está anulada
    }
    // Aquí podrías añadir lógica adicional, como cambiar el estadoCitaId a 'Cancelado' si es relevante
    // const estadoCancelado = await db.Estado.findOne({ where: { nombreEstado: 'Cancelado' } });
    // if (estadoCancelado) {
    //   await cita.update({ estado: false, estadoCitaId: estadoCancelado.idEstado });
    // } else {
    //   await cita.update({ estado: false });
    // }
    await cita.update({ estado: false });
    return cita;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al anular la cita con ID ${idCita} en el servicio:`,
      error.message
    );
    throw new CustomError(`Error al anular la cita: ${error.message}`, 500);
  }
};

/**
 * Habilitar una cita (estado booleano = true).
 */
const habilitarCita = async (idCita) => {
  try {
    const cita = await db.Cita.findByPk(idCita);
    if (!cita) {
      throw new NotFoundError("Cita no encontrada para habilitar.");
    }
    if (cita.estado) {
      return cita; // Ya está habilitada
    }
    await cita.update({ estado: true });
    return cita;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al habilitar la cita con ID ${idCita} en el servicio:`,
      error.message
    );
    throw new CustomError(`Error al habilitar la cita: ${error.message}`, 500);
  }
};

/**
 * Eliminar una cita físicamente.
 * DDL: Cliente_idCliente ON DELETE CASCADE (las citas se borran si se borra el cliente)
 * DDL: ServicioXCita.Cita_idCita ON DELETE CASCADE (los detalles de servicios de la cita se borran)
 */
const eliminarCitaFisica = async (idCita) => {
  const transaction = await db.sequelize.transaction();
  try {
    const cita = await db.Cita.findByPk(idCita, { transaction });
    if (!cita) {
      await transaction.rollback();
      throw new NotFoundError("Cita no encontrada para eliminar físicamente.");
    }

    // Los registros en ServicioXCita se eliminarán en cascada por la BD.
    const filasEliminadas = await db.Cita.destroy({
      where: { idCita },
      transaction,
    });
    await transaction.commit();
    return filasEliminadas;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError) throw error;
    // Podría haber un SequelizeForeignKeyConstraintError si VentaXServicio referencia a Cita
    // con ON DELETE RESTRICT y esa venta no se borra primero.
    // Tu DDL para VentaXServicio.Cita_idCita es ON DELETE SET NULL, así que no debería ser problema.
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

// --- Servicios para gestionar los servicios DENTRO de una cita existente ---

/**
 * Añade servicios a una cita existente.
 */
const agregarServiciosACita = async (idCita, idServicios) => {
  const transaction = await db.sequelize.transaction();
  try {
    const cita = await db.Cita.findByPk(idCita, { transaction });
    if (!cita) {
      await transaction.rollback();
      throw new NotFoundError("Cita no encontrada para agregar servicios.");
    }
    if (!cita.estado) {
      // No permitir modificar citas anuladas
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

    await cita.addServiciosProgramados(serviciosDB, { transaction }); // Usa el alias
    await transaction.commit();
    return obtenerCitaPorId(idCita); // Devuelve la cita actualizada con todos sus servicios
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

/**
 * Quita servicios de una cita existente.
 */
const quitarServiciosDeCita = async (idCita, idServicios) => {
  const transaction = await db.sequelize.transaction();
  try {
    const cita = await db.Cita.findByPk(idCita, { transaction });
    if (!cita) {
      await transaction.rollback();
      throw new NotFoundError("Cita no encontrada para quitar servicios.");
    }
    if (!cita.estado) {
      // No permitir modificar citas anuladas
      await transaction.rollback();
      throw new BadRequestError(
        "No se pueden quitar servicios de una cita anulada."
      );
    }

    // No es estrictamente necesario verificar si los servicios existen para quitarlos,
    // removeServiciosProgramados simplemente no hará nada si el ID no está asociado.
    await cita.removeServiciosProgramados(idServicios, { transaction }); // Usa el alias

    await transaction.commit();
    return obtenerCitaPorId(idCita);
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
  actualizarCita, // Actualiza campos principales de la cita
  anularCita, // Cambia estado booleano de la Cita a false
  habilitarCita, // Cambia estado booleano de la Cita a true
  eliminarCitaFisica,
  agregarServiciosACita, // Nuevo
  quitarServiciosDeCita, // Nuevo
};
