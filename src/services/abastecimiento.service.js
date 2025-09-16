// src/services/abastecimiento.service.js
const db = require("../models");
const { Op } = db.Sequelize;
// ✅ CORRECCIÓN: Se importan todos los modelos necesarios para las consultas anidadas
const { Abastecimiento, Producto, Usuario, Rol, Empleado, sequelize } = db;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors");
const { checkAndSendStockAlert } = require("../utils/stockAlertHelper.js");

const crearAbastecimiento = async (datosAbastecimiento) => {
  const { idProducto, cantidad, fechaIngreso, estado, empleadoAsignado } =
    datosAbastecimiento;

  const producto = await Producto.findByPk(idProducto);
  if (!producto)
    throw new BadRequestError(`Producto con ID ${idProducto} no encontrado.`);
  if (!producto.estado)
    throw new BadRequestError(`Producto '${producto.nombre}' no está activo.`);

  if (producto.tipoUso?.toLowerCase() !== "interno") {
    throw new BadRequestError(
      `El producto '${producto.nombre}' no es de tipo 'Interno' y no puede ser asignado.`
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
        fechaIngreso: fechaIngreso || new Date(),
        estaAgotado: false,
        estado: typeof estado === "boolean" ? estado : true,
        idUsuario: empleadoAsignado, // Corregido para usar el campo correcto del modelo
      },
      { transaction }
    );

    await producto.decrement("existencia", {
      by: Number(cantidad),
      transaction,
    });
    await transaction.commit();

    const productoActualizado = await Producto.findByPk(idProducto);
    if (productoActualizado) {
      await checkAndSendStockAlert(productoActualizado, `tras abastecimiento ID ${nuevoAbastecimiento.idAbastecimiento}`);
    }
    return nuevoAbastecimiento;
  } catch (error) {
    await transaction.rollback();
    throw new CustomError(`Error al crear el abastecimiento: ${error.message}`, 500);
  }
};

// ✅ FUNCIÓN CORREGIDA DEFINITIVAMENTE
const obtenerTodosLosAbastecimientos = async (opcionesDeFiltro = {}) => {
  const { page = 1, limit = 10, search, estado } = opcionesDeFiltro;
  const offset = (page - 1) * limit;

  let whereClause = {};
  if (estado !== undefined && estado !== 'todos') {
    whereClause.estado = estado === 'activos';
  }

  if (search) {
    whereClause[Op.or] = [
      { '$producto.nombre$': { [Op.iLike]: `%${search}%` } },
      { '$usuario.correo$': { [Op.iLike]: `%${search}%` } },
      { '$usuario.empleadoInfo.nombre$': { [Op.iLike]: `%${search}%` } },
      { '$usuario.empleadoInfo.apellido$': { [Op.iLike]: `%${search}%` } },
    ];
  }

  try {
    const { count, rows } = await Abastecimiento.findAndCountAll({
      where: whereClause,
      include: [
        { model: Producto, as: "producto" },
        {
          model: Usuario,
          as: "usuario",
          include: [
            { model: Rol, as: "rol" },
            { model: Empleado, as: "empleadoInfo" }
          ]
        }
      ],
      order: [["fechaIngreso", "DESC"]],
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
    throw new CustomError(`Error al obtener abastecimientos: ${error.message}`, 500);
  }
};

const obtenerAbastecimientoPorId = async (idAbastecimiento) => {
    const abastecimiento = await Abastecimiento.findByPk(idAbastecimiento, {
      include: [
        { model: Producto, as: "producto" },
        {
          model: Usuario,
          as: "usuario",
          include: ["rol", "empleadoInfo"]
        },
      ],
    });
    if (!abastecimiento) throw new NotFoundError("Registro de abastecimiento no encontrado.");
    return abastecimiento;
};

const actualizarAbastecimiento = async (idAbastecimiento, datosActualizar) => {
  const transaction = await sequelize.transaction();
  try {
    const abastecimiento = await Abastecimiento.findByPk(idAbastecimiento, { transaction });
    if (!abastecimiento) throw new NotFoundError("Registro de abastecimiento no encontrado.");

    const producto = await Producto.findByPk(abastecimiento.idProducto, { transaction });
    if (!producto) throw new BadRequestError(`Producto asociado (ID: ${abastecimiento.idProducto}) no encontrado.`);

    // Lógica de actualización y ajuste de inventario...
    // (Se mantiene la lógica original que es robusta)
    const { cantidad, estado, empleadoAsignado } = datosActualizar;
    const camposAActualizar = {};
    if (cantidad !== undefined) camposAActualizar.cantidad = Number(cantidad);
    if (estado !== undefined) camposAActualizar.estado = estado;
    if (empleadoAsignado !== undefined) camposAActualizar.idUsuario = empleadoAsignado; // Corregido

    const cantidadOriginal = abastecimiento.cantidad;
    const estadoOriginal = abastecimiento.estado;
    await abastecimiento.update(camposAActualizar, { transaction });

    let diferencia = 0;
    if (estadoOriginal === true && (camposAActualizar.estado === undefined || camposAActualizar.estado === true)) {
        diferencia = cantidadOriginal - (camposAActualizar.cantidad || cantidadOriginal);
    } else if (estadoOriginal === false && camposAActualizar.estado === true) {
        diferencia = -(camposAActualizar.cantidad || cantidadOriginal);
    } else if (estadoOriginal === true && camposAActualizar.estado === false) {
        diferencia = cantidadOriginal;
    }

    if (diferencia !== 0) {
        if (diferencia > 0) await producto.increment('existencia', { by: diferencia, transaction });
        else {
            if (producto.existencia < Math.abs(diferencia)) throw new ConflictError('Stock insuficiente para el ajuste.');
            await producto.decrement('existencia', { by: Math.abs(diferencia), transaction });
        }
    }

    await transaction.commit();
    return obtenerAbastecimientoPorId(idAbastecimiento);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const eliminarAbastecimientoFisico = async (idAbastecimiento) => {
    const transaction = await sequelize.transaction();
    try {
        const abastecimiento = await Abastecimiento.findByPk(idAbastecimiento, { transaction });
        if (!abastecimiento) throw new NotFoundError("Abastecimiento no encontrado.");

        if (abastecimiento.estado) {
            await Producto.increment('existencia', { by: abastecimiento.cantidad, where: { idProducto: abastecimiento.idProducto }, transaction });
        }
        await abastecimiento.destroy({ transaction });
        await transaction.commit();
        return { message: "Abastecimiento eliminado y stock revertido si estaba activo." };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const agotarAbastecimiento = async (idAbastecimiento, razonAgotamiento) => {
    const abastecimiento = await Abastecimiento.findByPk(idAbastecimiento);
    if (!abastecimiento) throw new NotFoundError(`Abastecimiento con ID ${idAbastecimiento} no encontrado.`);
    if (abastecimiento.estaAgotado) throw new ConflictError(`El abastecimiento ya está marcado como agotado.`);

    abastecimiento.estaAgotado = true;
    abastecimiento.razonAgotamiento = razonAgotamiento || null;
    abastecimiento.fechaAgotamiento = new Date();
    await abastecimiento.save();
    return abastecimiento;
};

// ✅ FUNCIÓN OBTENER EMPLEADOS CORREGIDA
const obtenerEmpleados = async () => {
    try {
      const usuarios = await Usuario.findAll({
        include: [
          {
            model: Rol,
            as: 'rol',
            where: { nombre: 'Empleado' } // Asegúrate que el rol se llame 'Empleado'
          },
          {
            model: Empleado,
            as: 'empleadoInfo',
            required: true // Solo usuarios que tengan perfil de empleado
          }
        ],
        attributes: ['id_usuario', 'correo']
      });
      return usuarios;
    } catch (error) {
      console.error("Error al obtener la lista de empleados:", error);
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
  obtenerEmpleados
};