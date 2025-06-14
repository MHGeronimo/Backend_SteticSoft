// src/services/abastecimiento.service.js
const db = require("../models");
const { Op } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors");
const { checkAndSendStockAlert } = require('../utils/stockAlertHelper.js'); // Import stock alert helper

/**
 * Crear un nuevo registro de abastecimiento (salida de producto para empleado)
 * y DISMINUIR la existencia del producto.
 * @param {object} datosAbastecimiento - Datos del abastecimiento.
 * Ej: { productoId, cantidad, fechaIngreso?, empleadoAsignado?, estado? }
 * @returns {Promise<object>} El registro de abastecimiento creado.
 */
// src/services/abastecimiento.service.js

const crearAbastecimiento = async (datosAbastecimiento) => {
  const {
    productoId,
    cantidad,
    fechaIngreso,
    empleadoAsignado,
    estado,
  } = datosAbastecimiento;

  let producto = await db.Producto.findByPk(productoId);
  if (!producto)
    throw new BadRequestError(`Producto con ID ${productoId} no encontrado.`);
  if (!producto.estado)
    throw new BadRequestError(
      `Producto '${producto.nombre}' (ID: ${productoId}) no está activo.`
    );

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
  let nuevoAbastecimiento;
  try {
    nuevoAbastecimiento = await db.Abastecimiento.create(
      {
        idProducto: productoId, 
        idEmpleadoAsignado: empleadoAsignado || null, 
        cantidad: Number(cantidad),
        fechaIngreso: fechaIngreso || new Date(),
        estaAgotado: false,
        estado: estadoAbastecimiento,
      },
      { transaction }
    );

    if (estadoAbastecimiento) {
      await producto.decrement("existencia", {
        by: Number(cantidad),
        transaction,
      });
    }

    await transaction.commit();

    if (estadoAbastecimiento) {
      const productoActualizado = await db.Producto.findByPk(productoId);
      if (productoActualizado) {
        await checkAndSendStockAlert(productoActualizado, `tras abastecimiento ID ${nuevoAbastecimiento.idAbastecimiento}`);
      }
    }
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
          as: "producto", 
          attributes: ["idProducto", "nombre", "stockMinimo", "existencia"],
        },
        {
          model: db.Empleado,
          as: "empleado", 
          attributes: ["idEmpleado", "nombre"],
          required: false,
        },
      ],
      order: [
        ["fechaIngreso", "DESC"],
        ["idAbastecimiento", "DESC"],
      ],
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
        { model: db.Producto, as: "producto", attributes: ["idProducto", "nombre", "stockMinimo", "existencia"] }, // Corregido
        { model: db.Empleado, as: "empleado", required: false }, // Corregido
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
 * Actualizar un registro de abastecimiento. (Esta es la función "cambiarEstado" combinada para 'estado' y 'cantidad')
 * La actualización de 'cantidad' es delicada y debe ajustar el inventario.
 */
const actualizarAbastecimiento = async (idAbastecimiento, datosActualizar) => {
  const {
    empleadoAsignado,
    estaAgotado,
    razonAgotamiento,
    fechaAgotamiento,
    estado, // Nuevo estado booleano del registro
    cantidad, // Nueva cantidad
  } = datosActualizar;

  const transaction = await db.sequelize.transaction();
  let productoIdAfectado;
  try {
    const abastecimiento = await db.Abastecimiento.findByPk(idAbastecimiento, {
      transaction,
    });
    if (!abastecimiento) {
      await transaction.rollback();
      throw new NotFoundError("Registro de abastecimiento no encontrado.");
    }
    productoIdAfectado = abastecimiento.productoId; // Guardar para alerta

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

    if (empleadoAsignado !== undefined) {
      camposAActualizar.empleadoAsignado = empleadoAsignado === null ? null : empleadoAsignado;
    }
    if (estaAgotado !== undefined) camposAActualizar.estaAgotado = estaAgotado;
    if (estaAgotado === true) {
      if (razonAgotamiento !== undefined) camposAActualizar.razonAgotamiento = razonAgotamiento;
      if (fechaAgotamiento !== undefined) camposAActualizar.fechaAgotamiento = fechaAgotamiento;
    } else if (estaAgotado === false) {
      camposAActualizar.razonAgotamiento = null;
      camposAActualizar.fechaAgotamiento = null;
    }
    
    // Manejo de 'estado' y 'cantidad'
    const nuevoEstado = datosActualizar.hasOwnProperty("estado") ? estado : abastecimiento.estado;
    const nuevaCantidad = datosActualizar.hasOwnProperty("cantidad") ? Number(cantidad) : abastecimiento.cantidad;

    camposAActualizar.estado = nuevoEstado;
    camposAActualizar.cantidad = nuevaCantidad;

    if (Object.keys(camposAActualizar).length > 0) {
        await abastecimiento.update(camposAActualizar, { transaction });
        // No es necesario reload si usamos los valores actualizados directamente.
    }
    
    let diferenciaCantidadInventario = 0;

    // Lógica de ajuste de inventario basada en el estado y la cantidad
    if (estadoOriginal === true && nuevoEstado === true) { // Sigue activo, cantidad pudo cambiar
        diferenciaCantidadInventario = cantidadOriginal - nuevaCantidad; // Positivo si se devuelve, negativo si se saca más
    } else if (estadoOriginal === false && nuevoEstado === true) { // Se está activando
        diferenciaCantidadInventario = -nuevaCantidad; // Se saca del stock
    } else if (estadoOriginal === true && nuevoEstado === false) { // Se está anulando
        diferenciaCantidadInventario = cantidadOriginal; // Se devuelve al stock
    }
    // Si estadoOriginal y nuevoEstado son false, no hay cambio de inventario.

    if (diferenciaCantidadInventario !== 0) {
        if (diferenciaCantidadInventario > 0) { // Aumentar stock
            await producto.increment("existencia", { by: diferenciaCantidadInventario, transaction });
        } else { // Disminuir stock (diferencia es negativa)
            if (producto.existencia < Math.abs(diferenciaCantidadInventario)) {
                await transaction.rollback();
                throw new ConflictError(
                    `No hay suficiente existencia para ajustar el producto '${producto.nombre}'. Requerido: ${Math.abs(diferenciaCantidadInventario)}, Disponible: ${producto.existencia}.`
                );
            }
            await producto.decrement("existencia", { by: Math.abs(diferenciaCantidadInventario), transaction });
        }
    }
    
    await transaction.commit();

    if (productoIdAfectado) {
        const productoActualizadoPostCommit = await db.Producto.findByPk(productoIdAfectado);
        if (productoActualizadoPostCommit) {
           await checkAndSendStockAlert(productoActualizadoPostCommit, `tras actualizar abastecimiento ID ${idAbastecimiento}`);
        }
    }

    return obtenerAbastecimientoPorId(idAbastecimiento);
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
 * Llama a actualizarAbastecimiento para manejar la lógica de estado e inventario.
 */
const anularAbastecimiento = async (idAbastecimiento) => {
  // Para anular, solo necesitamos pasar el nuevo estado. La cantidad no cambia en este acto.
  return actualizarAbastecimiento(idAbastecimiento, { estado: false });
};

/**
 * Habilitar un registro de abastecimiento (estado = true y DISMINUYE inventario).
 * Llama a actualizarAbastecimiento para manejar la lógica de estado e inventario.
 */
const habilitarAbastecimiento = async (idAbastecimiento) => {
  // Para habilitar, solo necesitamos pasar el nuevo estado. La cantidad no cambia en este acto.
  return actualizarAbastecimiento(idAbastecimiento, { estado: true });
};


/**
 * Eliminar un registro de abastecimiento físicamente.
 * AUMENTA la existencia del producto si el abastecimiento estaba activo.
 */
const eliminarAbastecimientoFisico = async (idAbastecimiento) => {
  const transaction = await db.sequelize.transaction();
  let productoIdAfectado;
  let productoOriginal;
  try {
    const abastecimiento = await db.Abastecimiento.findByPk(idAbastecimiento, {
      transaction,
    });
    if (!abastecimiento) {
      await transaction.rollback();
      throw new NotFoundError("Abastecimiento no encontrado.");
    }
    productoIdAfectado = abastecimiento.productoId;


    if (abastecimiento.estado) { // Si estaba activo, se revierte el stock
      productoOriginal = await db.Producto.findByPk(abastecimiento.productoId, {
        transaction,
      });
      if (productoOriginal) {
        await productoOriginal.increment("existencia", {
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

    if (productoIdAfectado && abastecimiento.estado && productoOriginal) {
        // Se revirtió stock, verificar si AÚN está bajo (menos probable, pero posible si estaba muy bajo antes de la reversión)
        // O si la reversión lo sacó de un estado crítico. Para la solicitud de "cuando se agotan",
        // una eliminación que AUMENTA stock no debería generar una alerta de "agotado".
        // Sin embargo, si el stock era, por ejemplo, -5 (hipotético), y el abastecimiento era de 3,
        // al eliminarlo y devolver 3, queda en -2. Sigue bajo.
        const productoActualizadoPostCommit = await db.Producto.findByPk(productoIdAfectado);
        if (productoActualizadoPostCommit) {
           await checkAndSendStockAlert(productoActualizadoPostCommit, `tras eliminar abastecimiento ID ${idAbastecimiento} (stock revertido)`);
        }
    }
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
  habilitarAbastecimiento,
  eliminarAbastecimientoFisico,
};