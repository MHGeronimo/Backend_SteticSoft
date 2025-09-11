const db = require("../models");
const { Op } = db.Sequelize;
// Se importa el modelo Rol para usarlo en las consultas anidadas
const { Abastecimiento, Producto, Usuario, Rol, sequelize } = db;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors");
const { checkAndSendStockAlert } = require("../utils/stockAlertHelper.js");

const crearAbastecimiento = async (datosAbastecimiento) => {
  const { idProducto, cantidad, idUsuario } = datosAbastecimiento;

  const producto = await Producto.findByPk(idProducto);
  if (!producto) throw new BadRequestError(`Producto con ID ${idProducto} no encontrado.`);
  if (!producto.estado) throw new BadRequestError(`Producto '${producto.nombre}' no está activo.`);
  if (producto.tipoUso?.toLowerCase() !== "interno") {
    throw new BadRequestError(
      `El producto '${producto.nombre}' no es de tipo 'Interno' y no puede ser abastecido.`
    );
  }
  if (producto.existencia < cantidad) {
    throw new ConflictError(
      `No hay suficiente stock para '${producto.nombre}'. Solicitado: ${cantidad}, Disponible: ${producto.existencia}.`
    );
  }

  const transaction = await sequelize.transaction();
  try {
    const nuevoAbastecimiento = await Abastecimiento.create(
      {
        idProducto,
        cantidad: Number(cantidad),
        fechaIngreso: new Date(),
        idUsuario,
      },
      { transaction }
    );

    await producto.decrement("existencia", { by: Number(cantidad), transaction });
    await transaction.commit();

    const productoActualizado = await Producto.findByPk(idProducto);
    if (productoActualizado) {
      await checkAndSendStockAlert(
        productoActualizado,
        `tras abastecimiento ID ${nuevoAbastecimiento.idAbastecimiento}`
      );
    }
    return nuevoAbastecimiento;
  } catch (error) {
    await transaction.rollback();
    throw new CustomError(
      `Error al crear el abastecimiento: ${error.message}`,
      500
    );
  }
};

const obtenerTodosLosAbastecimientos = async (opcionesDeFiltro = {}) => {
  const { page = 1, limit = 10, search, estado } = opcionesDeFiltro;
  const offset = (page - 1) * limit;

  const whereClause = {};
  if (estado !== undefined && estado !== 'todos') {
    whereClause.estado = estado === 'true' || estado === true;
  }

  if (search) {
    whereClause[Op.or] = [
      { '$producto.nombre$': { [Op.iLike]: `%${search}%` } },
      { '$usuario.correo$': { [Op.iLike]: `%${search}%` } },
      { '$usuario.rol.nombre$': { [Op.iLike]: `%${search}%` } },
    ];
  }

  try {
    const { count, rows } = await Abastecimiento.findAndCountAll({
      where: whereClause, // CORRECCIÓN: Se usa la cláusula 'where' construida
      include: [
        { model: Producto, as: "producto", attributes: ["idProducto", "nombre", "existencia"] },
        {
          model: Usuario,
          as: "usuario",
          attributes: ["id_usuario", "correo"],
          include: {
            model: Rol,
            as: "rol",
            attributes: ["nombre"]
          }
        },
      ],
      order: [["fechaIngreso", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
      subQuery: false,
    });

    return {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: rows,
    };
  } catch (error) {
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
        { model: Producto, as: "producto" },
        {
          model: Usuario,
          as: "usuario",
          attributes: ["id_usuario", "correo"],
          include: {
            model: Rol,
            as: "rol",
            attributes: ["nombre"]
          }
        }
      ],
    });
    if (!abastecimiento)
      throw new NotFoundError("Registro de abastecimiento no encontrado.");
    return abastecimiento;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new CustomError(
      `Error al obtener el abastecimiento: ${error.message}`,
      500
    );
  }
};

const actualizarAbastecimiento = async (idAbastecimiento, datosActualizar) => {
  const transaction = await sequelize.transaction();
  try {
    const abastecimiento = await Abastecimiento.findByPk(idAbastecimiento, { transaction });
    if (!abastecimiento) {
      throw new NotFoundError("Registro de abastecimiento no encontrado.");
    }

    const producto = await Producto.findByPk(abastecimiento.idProducto, { transaction });
    if (!producto) {
      throw new BadRequestError(`Producto asociado no encontrado.`);
    }

    const cantidadOriginal = abastecimiento.cantidad;
    const estadoOriginal = abastecimiento.estado;
    const nuevaCantidad = datosActualizar.cantidad !== undefined ? Number(datosActualizar.cantidad) : cantidadOriginal;
    const nuevoEstado = datosActualizar.estado !== undefined ? datosActualizar.estado : estadoOriginal;
    
    // Lógica para ajustar el inventario
    let diferenciaStock = 0;
    if (estadoOriginal === true && nuevoEstado === true) {
      diferenciaStock = cantidadOriginal - nuevaCantidad; // Si se reduce la cantidad, se devuelve stock
    } else if (estadoOriginal === false && nuevoEstado === true) {
      diferenciaStock = -nuevaCantidad; // Se activa un registro, se resta stock
    } else if (estadoOriginal === true && nuevoEstado === false) {
      diferenciaStock = cantidadOriginal; // Se inactiva un registro, se devuelve todo el stock
    }

    if (producto.existencia + diferenciaStock < 0) {
      throw new ConflictError(`No hay suficiente stock para realizar el ajuste.`);
    }
    
    if (diferenciaStock !== 0) {
        await producto.increment('existencia', { by: diferenciaStock, transaction });
    }

    await abastecimiento.update(datosActualizar, { transaction });
    await transaction.commit();

    return obtenerAbastecimientoPorId(idAbastecimiento);
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError || error instanceof BadRequestError || error instanceof ConflictError) {
      throw error;
    }
    throw new CustomError(`Error al actualizar el abastecimiento: ${error.message}`, 500);
  }
};

const eliminarAbastecimientoFisico = async (idAbastecimiento) => {
  const transaction = await sequelize.transaction();
  try {
    const abastecimiento = await Abastecimiento.findByPk(idAbastecimiento, { transaction });
    if (!abastecimiento) {
      throw new NotFoundError("Registro de abastecimiento no encontrado.");
    }

    // Si el registro estaba activo, se devuelve la cantidad al inventario
    if (abastecimiento.estado) {
      await Producto.increment('existencia', {
        by: abastecimiento.cantidad,
        where: { idProducto: abastecimiento.idProducto },
        transaction
      });
    }
    
    await abastecimiento.destroy({ transaction });
    await transaction.commit();
    return true; // Indica que la eliminación fue exitosa
  } catch(error) {
    await transaction.rollback();
    if (error instanceof NotFoundError) throw error;
    throw new CustomError(`Error al eliminar abastecimiento: ${error.message}`, 500);
  }
};

const agotarAbastecimiento = async (idAbastecimiento, razonAgotamiento) => {
  const abastecimiento = await Abastecimiento.findByPk(idAbastecimiento);
  if (!abastecimiento) {
    throw new NotFoundError(`Abastecimiento con ID ${idAbastecimiento} no encontrado.`);
  }
  if (abastecimiento.estaAgotado) {
    throw new ConflictError(`El abastecimiento ya está marcado como agotado.`);
  }

  abastecimiento.estaAgotado = true;
  abastecimiento.razonAgotamiento = razonAgotamiento || null;
  abastecimiento.fechaAgotamiento = new Date();

  await abastecimiento.save();
  return abastecimiento;
};

const obtenerEmpleados = async () => {
  try {
    const empleados = await Usuario.findAll({
      include: {
        model: Rol,
        as: 'rol',
        where: {
          nombre: { [Op.iLike]: 'empleado' }
        },
        // CORRECCIÓN: Le pedimos que nos traiga el nombre del rol
        attributes: ['nombre'] 
      },
      where: {
        estado: true
      },
      attributes: ['id_usuario', 'correo']
    });
    return empleados;
  } catch (error) {
    throw new CustomError(`Error al obtener la lista de empleados: ${error.message}`, 500);
  }
};

module.exports = {
  crearAbastecimiento,
  obtenerTodosLosAbastecimientos,
  obtenerAbastecimientoPorId,
  actualizarAbastecimiento,
  eliminarAbastecimientoFisico,
  agotarAbastecimiento,
  obtenerEmpleados,
};