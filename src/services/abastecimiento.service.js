// src/services/abastecimiento.service.js
const db = require("../models");
const { Op } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors");

/**
 * Crear un nuevo registro de abastecimiento (salida de producto para empleado)
 * y DISMINUIR la existencia del producto.
 * @param {object} datosAbastecimiento - Datos del abastecimiento.
 * Ej: { productoId, cantidad, fechaIngreso?, empleadoAsignado?, estado? }
 * @returns {Promise<object>} El registro de abastecimiento creado.
 */
const crearAbastecimiento = async (datosAbastecimiento) => {
  const {
    productoId,
    cantidad,
    fechaIngreso, // Podría renombrarse a fechaSalida o fechaAsignacion si es más claro
    empleadoAsignado,
    estado,
  } = datosAbastecimiento;

  const producto = await db.Producto.findByPk(productoId);
  if (!producto)
    throw new BadRequestError(`Producto con ID ${productoId} no encontrado.`);
  if (!producto.estado)
    throw new BadRequestError(
      `Producto '${producto.nombre}' (ID: ${productoId}) no está activo.`
    );

  // Verificar si hay suficiente existencia ANTES de disminuir
  if (producto.existencia < cantidad) {
    throw new ConflictError(
      `No hay suficiente existencia para el producto '${producto.nombre}'. Solicitado: ${cantidad}, Disponible: ${producto.existencia}.`
    );
  }

  if (empleadoAsignado) {
    const empleado = await db.Empleado.findOne({
      where: { idEmpleado: empleadoAsignado, estado: true },
    });
    if (!empleado)
      throw new BadRequestError(
        `Empleado asignado con ID ${empleadoAsignado} no encontrado o inactivo.`
      );
  }

  const estadoAbastecimiento = typeof estado === "boolean" ? estado : true;

  const transaction = await db.sequelize.transaction();
  try {
    const nuevoAbastecimiento = await db.Abastecimiento.create(
      {
        productoId,
        cantidad: Number(cantidad),
        fechaIngreso: fechaIngreso || new Date(), // O fechaSalida
        empleadoAsignado: empleadoAsignado || null,
        estaAgotado: false, // Esto se refiere al estado del producto DESPUÉS de este movimiento, no al abastecimiento en sí.
        estado: estadoAbastecimiento,
      },
      { transaction }
    );

    // DISMINUIR la existencia del producto SI el abastecimiento está activo
    if (estadoAbastecimiento) {
      await producto.decrement("existencia", {
        by: Number(cantidad),
        transaction,
      });
    }

    await transaction.commit();
    return nuevoAbastecimiento;
  } catch (error) {
    await transaction.rollback();
    console.error(
      "Error al crear el abastecimiento:",
      error.message,
      error.stack
    );
    throw new CustomError(
      `Error al crear el abastecimiento: ${error.message}`,
      500
    );
  }
};

/**
 * Obtener todos los registros de abastecimiento.
 */
const obtenerTodosLosAbastecimientos = async (opcionesDeFiltro = {}) => {
  try {
    return await db.Abastecimiento.findAll({
      where: opcionesDeFiltro,
      include: [
        {
          model: db.Producto,
          as: "productoAbastecido",
          attributes: ["idProducto", "nombre"],
        },
        {
          model: db.Empleado,
          as: "empleadoResponsable",
          attributes: ["idEmpleado", "nombre"],
          required: false,
        },
      ],
      order: [
        ["fechaIngreso", "DESC"],
        ["idAbastecimiento", "DESC"],
      ], // 'fechaIngreso' podría ser 'fechaSalida'
    });
  } catch (error) {
    console.error("Error al obtener todos los abastecimientos:", error.message);
    throw new CustomError(
      `Error al obtener abastecimientos: ${error.message}`,
      500
    );
  }
};

/**
 * Obtener un registro de abastecimiento por su ID.
 */
const obtenerAbastecimientoPorId = async (idAbastecimiento) => {
  try {
    const abastecimiento = await db.Abastecimiento.findByPk(idAbastecimiento, {
      include: [
        { model: db.Producto, as: "productoAbastecido" },
        { model: db.Empleado, as: "empleadoResponsable", required: false },
      ],
    });
    if (!abastecimiento)
      throw new NotFoundError("Registro de abastecimiento no encontrado.");
    return abastecimiento;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al obtener el abastecimiento con ID ${idAbastecimiento}:`,
      error.message
    );
    throw new CustomError(
      `Error al obtener el abastecimiento: ${error.message}`,
      500
    );
  }
};

/**
 * Actualizar un registro de abastecimiento.
 * La actualización de 'cantidad' es delicada y debe ajustar el inventario.
 */
const actualizarAbastecimiento = async (idAbastecimiento, datosActualizar) => {
  const {
    empleadoAsignado,
    estaAgotado,
    razonAgotamiento,
    fechaAgotamiento,
    estado,
    cantidad,
  } = datosActualizar;

  const transaction = await db.sequelize.transaction();
  try {
    const abastecimiento = await db.Abastecimiento.findByPk(idAbastecimiento, {
      transaction,
    });
    if (!abastecimiento) {
      await transaction.rollback();
      throw new NotFoundError("Registro de abastecimiento no encontrado.");
    }

    const producto = await db.Producto.findByPk(abastecimiento.productoId, {
      transaction,
    });
    if (!producto) {
      await transaction.rollback();
      throw new BadRequestError(
        `Producto asociado (ID: ${abastecimiento.productoId}) no encontrado.`
      );
    }

    const estadoOriginal = abastecimiento.estado;
    const cantidadOriginal = abastecimiento.cantidad;
    const camposAActualizar = {};

    // Lógica para campos simples
    if (empleadoAsignado !== undefined) {
      /* ... tu lógica de validación de empleado ... */ camposAActualizar.empleadoAsignado =
        empleadoAsignado === null ? null : empleadoAsignado;
    }
    if (estaAgotado !== undefined) camposAActualizar.estaAgotado = estaAgotado;
    if (estaAgotado === true) {
      if (razonAgotamiento !== undefined)
        camposAActualizar.razonAgotamiento = razonAgotamiento;
      if (fechaAgotamiento !== undefined)
        camposAActualizar.fechaAgotamiento = fechaAgotamiento;
    } else if (estaAgotado === false) {
      camposAActualizar.razonAgotamiento = null;
      camposAActualizar.fechaAgotamiento = null;
    }
    if (estado !== undefined) camposAActualizar.estado = estado;
    if (cantidad !== undefined) camposAActualizar.cantidad = Number(cantidad);

    // Aplicar actualizaciones a la instancia para poder acceder a los nuevos valores
    if (Object.keys(camposAActualizar).length > 0) {
      await abastecimiento.update(camposAActualizar, { transaction });
      await abastecimiento.reload({ transaction }); // Asegurar que los datos estén frescos
    }

    let diferenciaCantidadInventario = 0;

    // 1. Ajuste por cambio de cantidad (si el registro estaba y sigue activo)
    if (
      datosActualizar.hasOwnProperty("cantidad") &&
      abastecimiento.cantidad !== cantidadOriginal
    ) {
      if (estadoOriginal && abastecimiento.estado) {
        // Solo si el abastecimiento estaba activo y sigue activo
        diferenciaCantidadInventario +=
          cantidadOriginal - abastecimiento.cantidad; // Si la nueva cantidad es menor, la diferencia es positiva (se devuelve al stock)
        // Si la nueva cantidad es mayor, la diferencia es negativa (se saca más del stock)
      } else if (!estadoOriginal && abastecimiento.estado) {
        // Se activó Y cambió cantidad
        diferenciaCantidadInventario -= abastecimiento.cantidad; // Se saca del stock la nueva cantidad
      } else if (estadoOriginal && !abastecimiento.estado) {
        // Se anuló Y cambió cantidad
        diferenciaCantidadInventario += cantidadOriginal; // Se devuelve al stock la cantidad original
      }
      // No hacer nada si estaba y sigue anulado respecto al cambio de cantidad
    }

    // 2. Ajuste por cambio de estado (usando la cantidad MÁS RECIENTE del abastecimiento)
    if (
      datosActualizar.hasOwnProperty("estado") &&
      estadoOriginal !== abastecimiento.estado
    ) {
      if (abastecimiento.estado) {
        // Si se está HABILITANDO (antes estaba false, ahora true)
        // El inventario DISMINUYE porque los productos salen para el empleado
        diferenciaCantidadInventario -= abastecimiento.cantidad;
      } else {
        // Si se está ANULANDO (antes estaba true, ahora false)
        // El inventario AUMENTA porque los productos se devuelven
        diferenciaCantidadInventario += abastecimiento.cantidad;
      }
    }

    // Aplicar el ajuste neto al inventario
    if (diferenciaCantidadInventario > 0) {
      await producto.increment("existencia", {
        by: diferenciaCantidadInventario,
        transaction,
      });
    } else if (diferenciaCantidadInventario < 0) {
      // Verificar si hay suficiente stock antes de decrementar por una actualización
      if (producto.existencia < Math.abs(diferenciaCantidadInventario)) {
        await transaction.rollback();
        throw new ConflictError(
          `No hay suficiente existencia para ajustar el producto '${
            producto.nombre
          }'. Requerido: ${Math.abs(
            diferenciaCantidadInventario
          )}, Disponible: ${producto.existencia}.`
        );
      }
      await producto.decrement("existencia", {
        by: Math.abs(diferenciaCantidadInventario),
        transaction,
      });
    }

    await transaction.commit();
    return obtenerAbastecimientoPorId(idAbastecimiento); // Devuelve con los datos actualizados
  } catch (error) {
    await transaction.rollback();
    if (
      error instanceof NotFoundError ||
      error instanceof BadRequestError ||
      error instanceof ConflictError
    )
      throw error;
    console.error(
      `Error al actualizar abastecimiento con ID ${idAbastecimiento}:`,
      error.message,
      error.stack
    );
    throw new CustomError(
      `Error al actualizar el abastecimiento: ${error.message}`,
      500
    );
  }
};

/**
 * Anular un registro de abastecimiento (estado = false y AUMENTA inventario).
 */
const anularAbastecimiento = async (idAbastecimiento) => {
  const abastecimiento = await db.Abastecimiento.findByPk(idAbastecimiento);
  if (!abastecimiento)
    throw new NotFoundError("Abastecimiento no encontrado para anular.");
  if (!abastecimiento.estado) return abastecimiento; // Ya está anulado

  // Se pasa la cantidad actual para la lógica de reversión en actualizarAbastecimiento
  return actualizarAbastecimiento(idAbastecimiento, { estado: false });
};

/**
 * Habilitar un registro de abastecimiento (estado = true y DISMINUYE inventario).
 */
const habilitarAbastecimiento = async (idAbastecimiento) => {
  const abastecimiento = await db.Abastecimiento.findByPk(idAbastecimiento);
  if (!abastecimiento)
    throw new NotFoundError("Abastecimiento no encontrado para habilitar.");
  if (abastecimiento.estado) return abastecimiento; // Ya está habilitado

  return actualizarAbastecimiento(idAbastecimiento, { estado: true });
};

/**
 * Eliminar un registro de abastecimiento físicamente.
 * AUMENTA la existencia del producto si el abastecimiento estaba activo.
 */
const eliminarAbastecimientoFisico = async (idAbastecimiento) => {
  const transaction = await db.sequelize.transaction();
  try {
    const abastecimiento = await db.Abastecimiento.findByPk(idAbastecimiento, {
      transaction,
    });
    if (!abastecimiento) {
      await transaction.rollback();
      throw new NotFoundError("Abastecimiento no encontrado.");
    }

    // Si el abastecimiento estaba activo, AUMENTAR el inventario porque se revierte la salida
    if (abastecimiento.estado) {
      const producto = await db.Producto.findByPk(abastecimiento.productoId, {
        transaction,
      });
      if (producto) {
        await producto.increment("existencia", {
          by: abastecimiento.cantidad,
          transaction,
        });
      } else {
        console.warn(
          `Advertencia: Producto ID ${abastecimiento.productoId} no encontrado al eliminar abastecimiento ID ${idAbastecimiento}. No se pudo revertir stock.`
        );
      }
    }

    const filasEliminadas = await db.Abastecimiento.destroy({
      where: { idAbastecimiento },
      transaction,
    });
    await transaction.commit();
    return filasEliminadas;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al eliminar abastecimiento con ID ${idAbastecimiento}:`,
      error.message
    );
    throw new CustomError(
      `Error al eliminar abastecimiento: ${error.message}`,
      500
    );
  }
};

module.exports = {
  crearAbastecimiento,
  obtenerTodosLosAbastecimientos,
  obtenerAbastecimientoPorId,
  actualizarAbastecimiento,
  anularAbastecimiento,
  habilitarAbastecimiento,
  eliminarAbastecimientoFisico,
};
