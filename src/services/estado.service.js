// src/services/estado.service.js
const db = require("../models");
const { Op } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors");

/**
 * Crear un nuevo estado.
 */
const crearEstado = async (datosEstado) => {
    const { nombreEstado } = datosEstado; 

    // Log para ver qué se está buscando
    console.log(`Buscando estado existente con nombre: '${nombreEstado}'`);
    const estadoExistente = await db.Estado.findOne({ where: { nombreEstado } });
    console.log('Resultado de estadoExistente:', estadoExistente); 
  
    if (estadoExistente) { 
      console.log(`Estado existente encontrado: ID ${estadoExistente.idEstado}, Nombre: ${estadoExistente.nombreEstado}`);
      throw new ConflictError(`El estado con el nombre '${nombreEstado}' ya existe.`);
    }
  
    try{
    const nuevoEstado = await db.Estado.create({ nombreEstado });
    return nuevoEstado;
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      // Doble check por si acaso
      throw new ConflictError(
        `El estado con el nombre '${nombreEstado}' ya existe.`
      );
    }
    console.error("Error al crear el estado en el servicio:", error.message);
    throw new CustomError(`Error al crear el estado: ${error.message}`, 500);
  }
};

/**
 * Obtener todos los estados.
 */
const obtenerTodosLosEstados = async () => {
  try {
    return await db.Estado.findAll({ order: [["nombreEstado", "ASC"]] });
  } catch (error) {
    console.error(
      "Error al obtener todos los estados en el servicio:",
      error.message
    );
    throw new CustomError(`Error al obtener estados: ${error.message}`, 500);
  }
};

/**
 * Obtener un estado por su ID.
 */
const obtenerEstadoPorId = async (idEstado) => {
  try {
    const estado = await db.Estado.findByPk(idEstado);
    if (!estado) {
      throw new NotFoundError("Estado no encontrado.");
    }
    return estado;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al obtener el estado con ID ${idEstado} en el servicio:`,
      error.message
    );
    throw new CustomError(`Error al obtener el estado: ${error.message}`, 500);
  }
};

/**
 * Actualizar un estado existente.
 */
const actualizarEstado = async (idEstado, datosActualizar) => {
  const { nombreEstado } = datosActualizar;
  try {
    const estado = await db.Estado.findByPk(idEstado);
    if (!estado) {
      throw new NotFoundError("Estado no encontrado para actualizar.");
    }

    if (nombreEstado && nombreEstado !== estado.nombreEstado) {
      const estadoConMismoNombre = await db.Estado.findOne({
        where: {
          nombreEstado: nombreEstado,
          idEstado: { [Op.ne]: idEstado },
        },
      });
      if (estadoConMismoNombre) {
        throw new ConflictError(
          `Ya existe otro estado con el nombre '${nombreEstado}'.`
        );
      }
    }

    await estado.update({ nombreEstado }); // Solo actualizamos nombreEstado
    return estado;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ConflictError)
      throw error;
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ConflictError(
        `Ya existe otro estado con el nombre '${nombreEstado}'.`
      );
    }
    console.error(
      `Error al actualizar el estado con ID ${idEstado} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al actualizar el estado: ${error.message}`,
      500
    );
  }
};

/**
 * Eliminar un estado físicamente.
 * ¡ADVERTENCIA: Riesgoso si el estado está siendo referenciado en Venta o Cita!
 * El DDL tiene ON DELETE SET NULL para estas FKs, por lo que las ventas/citas quedarían sin estado.
 */
const eliminarEstadoFisico = async (idEstado) => {
  try {
    const estado = await db.Estado.findByPk(idEstado);
    if (!estado) {
      throw new NotFoundError("Estado no encontrado para eliminar.");
    }

    // Verificar si el estado está en uso ANTES de intentar borrarlo
    // Esto es una protección adicional, aunque la BD lo manejaría con SET NULL.
    const citasConEsteEstado = await db.Cita.count({
      where: { estadoCitaId: idEstado },
    });
    const ventasConEsteEstado = await db.Venta.count({
      where: { estadoVentaId: idEstado },
    });

    if (citasConEsteEstado > 0 || ventasConEsteEstado > 0) {
      throw new ConflictError(
        `El estado '${estado.nombreEstado}' está en uso y no puede ser eliminado. Considere actualizar los registros que lo usan o crear un nuevo estado.`
      );
    }

    const filasEliminadas = await db.Estado.destroy({
      where: { idEstado },
    });
    return filasEliminadas;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ConflictError)
      throw error;
    // SequelizeForeignKeyConstraintError no debería ocurrir si ON DELETE SET NULL está en las tablas referenciantes.
    // Pero si alguna otra tabla lo referencia con RESTRICT, podría ocurrir.
    console.error(
      `Error al eliminar físicamente el estado con ID ${idEstado} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al eliminar físicamente el estado: ${error.message}`,
      500
    );
  }
};

module.exports = {
  crearEstado,
  obtenerTodosLosEstados,
  obtenerEstadoPorId,
  actualizarEstado,
  eliminarEstadoFisico, 
};
