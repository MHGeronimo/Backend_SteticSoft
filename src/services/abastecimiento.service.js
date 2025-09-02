// src/services/abastecimiento.service.js
const { Sequelize, Producto, sequelize, Abastecimiento, CategoriaProducto } = require("../models");
const { Op } = Sequelize;
const { NotFoundError, ConflictError, CustomError, BadRequestError } = require("../errors");
const { checkAndSendStockAlert } = require('../utils/stockAlertHelper.js'); // Import stock alert helper
 
/**
 * Crear un nuevo registro de abastecimiento (salida de producto para empleado)
 * y DISMINUIR la existencia del producto.
 * @param {object} datosAbastecimiento - Datos del abastecimiento.
 * Ej: { productoId, cantidad, fechaIngreso?, empleadoId?, estado? }
 * @returns {Promise<object>} El registro de abastecimiento creado.
 */
const crearAbastecimiento = async (datosAbastecimiento) => {
  const {
    idProducto,
    cantidad,
    fechaIngreso,
    estado,
    empleadoAsignado,
  } = datosAbastecimiento;

  const producto = await Producto.findByPk(idProducto);
  if (!producto) throw new BadRequestError(`Producto con ID ${idProducto} no encontrado.`);
  if (!producto.estado) throw new BadRequestError(`Producto '${producto.nombre}' no está activo.`);

  console.log("### Objeto 'producto' completo que se está validando ###");
  console.log(producto.toJSON()); // Usamos .toJSON() para ver los datos puros del objeto.
  console.log("###################################################");

  // --- INICIO DE NUEVA VALIDACIÓN ---
  if (producto.tipoUso?.toLowerCase() !== 'interno') {
    throw new BadRequestError(`El producto '${producto.nombre}' (ID: ${idProducto}) no es de tipo 'Interno' y no puede ser asignado mediante este módulo de abastecimiento.`);
  }
  // --- FIN DE NUEVA VALIDACIÓN ---

  if (producto.existencia < cantidad) {
    throw new ConflictError(`No hay suficiente stock para '${producto.nombre}'. Solicitado: ${cantidad}, Disponible: ${producto.existencia}.`);
  }

  const transaction = await sequelize.transaction();
  try {
    const nuevoAbastecimiento = await Abastecimiento.create({
        idProducto: idProducto,
        cantidad: Number(cantidad),
        fechaIngreso: fechaIngreso || new Date(),
        estaAgotado: false,
        estado: typeof estado === "boolean" ? estado : true,
        empleadoAsignado: empleadoAsignado,
    }, { transaction });

    await producto.decrement("existencia", { by: Number(cantidad), transaction });
    await transaction.commit();

    const productoActualizado = await Producto.findByPk(idProducto);
    if (productoActualizado) {
        await checkAndSendStockAlert(productoActualizado, `tras abastecimiento ID ${nuevoAbastecimiento.idAbastecimiento}`);
    }

    return nuevoAbastecimiento;

  } catch (error) {
    await transaction.rollback();
    console.error("Error detallado al crear abastecimiento:", error);
    throw new CustomError(`Error al crear el abastecimiento: ${error.message}`, 500);
  }
};

// ... (El resto de las funciones: obtenerTodosLosAbastecimientos, obtenerAbastecimientoPorId, etc. se mantienen igual que en tu archivo original)
// Aquí pego el resto del archivo para que lo tengas completo.

const obtenerTodosLosAbastecimientos = async (opcionesDeFiltro = {}) => {
  const { page = 1, limit = 10, ...filtros } = opcionesDeFiltro;
  const offset = (page - 1) * limit;

  try {
    const { count, rows } = await Abastecimiento.findAndCountAll({
      where: filtros,
      include: [
        {
          model: Producto,
          as: "producto",
          attributes: [
            "idProducto",
            "nombre",
            "stockMinimo",
            "existencia",
            "vida_util_dias",
          ],
          include: [
            {
              model: CategoriaProducto,
              as: "categoria",
              attributes: ["idCategoria", "nombre"],
            },
          ],
        },
      ],
      order: [
        ["fechaIngreso", "DESC"],
        ["idAbastecimiento", "DESC"],
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
    });

    return {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: rows,
    };
  } catch (error) {
    console.error("Error al obtener todos los abastecimientos:", error.message);
    throw new CustomError(
      `Error al obtener abastecimientos: ${error.message}`,
      500
    );
  }
};

const obtenerAbastecimientoPorId = async (idAbastecimiento) => {
  try {
    const abastecimiento = await Abastecimiento.findByPk(idAbastecimiento, {
      include: [
        { model: Producto, as: "producto", attributes: ["idProducto", "nombre", "stockMinimo", "existencia"] },
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

const actualizarAbastecimiento = async (idAbastecimiento, datosActualizar) => {
  const {
    estaAgotado,
    razonAgotamiento,
    fechaAgotamiento,
    estado,
    cantidad,
    empleadoAsignado,
  } = datosActualizar;

  const transaction = await sequelize.transaction();
  let productoIdAfectado;
  try {
    const abastecimiento = await Abastecimiento.findByPk(idAbastecimiento, {
      transaction,
    });
    if (!abastecimiento) {
      await transaction.rollback();
      throw new NotFoundError("Registro de abastecimiento no encontrado.");
    }
    productoIdAfectado = abastecimiento.idProducto;

    const producto = await Producto.findByPk(abastecimiento.idProducto, {
      transaction,
    });
    if (!producto) {
      await transaction.rollback();
      throw new BadRequestError(
        `Producto asociado (ID: ${abastecimiento.idProducto}) no encontrado.`
      );
    }

    const estadoOriginal = abastecimiento.estado;
    const cantidadOriginal = abastecimiento.cantidad;
    const camposAActualizar = {};

    if (estaAgotado !== undefined) camposAActualizar.estaAgotado = estaAgotado;
    if (empleadoAsignado !== undefined) camposAActualizar.empleadoAsignado = empleadoAsignado;
    if (estaAgotado === true) {
      if (razonAgotamiento !== undefined) camposAActualizar.razonAgotamiento = razonAgotamiento;
      if (fechaAgotamiento !== undefined) camposAActualizar.fechaAgotamiento = fechaAgotamiento;
    } else if (estaAgotado === false) {
      camposAActualizar.razonAgotamiento = null;
      camposAActualizar.fechaAgotamiento = null;
    }
    
    const nuevoEstado = Object.prototype.hasOwnProperty.call(datosActualizar, "estado") ? estado : abastecimiento.estado;
    const nuevaCantidad = Object.prototype.hasOwnProperty.call(datosActualizar, "cantidad") ? Number(cantidad) : abastecimiento.cantidad;

    camposAActualizar.estado = nuevoEstado;
    camposAActualizar.cantidad = nuevaCantidad;

    if (Object.keys(camposAActualizar).length > 0) {
        await abastecimiento.update(camposAActualizar, { transaction });
    }
    
    let diferenciaCantidadInventario = 0;

    if (estadoOriginal === true && nuevoEstado === true) {
        diferenciaCantidadInventario = cantidadOriginal - nuevaCantidad;
    } else if (estadoOriginal === false && nuevoEstado === true) {
        diferenciaCantidadInventario = -nuevaCantidad;
    } else if (estadoOriginal === true && nuevoEstado === false) {
        diferenciaCantidadInventario = cantidadOriginal;
    }

    if (diferenciaCantidadInventario !== 0) {
        if (diferenciaCantidadInventario > 0) {
            await producto.increment("existencia", { by: diferenciaCantidadInventario, transaction });
        } else {
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
        const productoActualizadoPostCommit = await Producto.findByPk(productoIdAfectado);
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

const eliminarAbastecimientoFisico = async (idAbastecimiento) => {
  const transaction = await sequelize.transaction();
  let productoIdAfectado;
  let productoOriginal;
  try {
    const abastecimiento = await Abastecimiento.findByPk(idAbastecimiento, {
      transaction,
    });
    if (!abastecimiento) {
      await transaction.rollback();
      throw new NotFoundError("Abastecimiento no encontrado.");
    }
    productoIdAfectado = abastecimiento.idProducto;


    if (abastecimiento.estado) {
      productoOriginal = await Producto.findByPk(abastecimiento.idProducto, {
        transaction,
      });
      if (productoOriginal) {
        await productoOriginal.increment("existencia", {
          by: abastecimiento.cantidad,
          transaction,
        });
      } else {
        console.warn(
          `Advertencia: Producto ID ${abastecimiento.idProducto} no encontrado al eliminar abastecimiento ID ${idAbastecimiento}. No se pudo revertir stock.`
        );
      }
    }

    const filasEliminadas = await Abastecimiento.destroy({
      where: { idAbastecimiento },
      transaction,
    });
    await transaction.commit();

    if (productoIdAfectado && abastecimiento.estado && productoOriginal) {
        const productoActualizadoPostCommit = await Producto.findByPk(productoIdAfectado);
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

// Nueva función para marcar un abastecimiento como agotado
const agotarAbastecimiento = async (idAbastecimiento, razonAgotamiento) => {
  const abastecimiento = await Abastecimiento.findByPk(idAbastecimiento);
  if (!abastecimiento) {
    throw new NotFoundError(`Abastecimiento con ID ${idAbastecimiento} no encontrado.`);
  }
  if (abastecimiento.estaAgotado) { // Corresponde a esta_agotado en BD
    throw new ConflictError(`El abastecimiento con ID ${idAbastecimiento} ya está marcado como agotado.`);
  }

  abastecimiento.estaAgotado = true;
  abastecimiento.razonAgotamiento = razonAgotamiento || null; // Corresponde a razon_agotamiento
  abastecimiento.fechaAgotamiento = new Date(); // Corresponde a fecha_agotamiento

  await abastecimiento.save();
  return abastecimiento;
};


module.exports = {
  crearAbastecimiento,
  obtenerTodosLosAbastecimientos,
  obtenerAbastecimientoPorId,
  actualizarAbastecimiento,
  eliminarAbastecimientoFisico,
  agotarAbastecimiento,
};