const db = require("../models");
const { Op } = db.Sequelize;
// CAMBIO: Se importa el modelo Rol para usarlo en las consultas anidadas
const { Abastecimiento, Producto, Usuario, Rol, sequelize } = db;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors");
const { checkAndSendStockAlert } = require("../utils/stockAlertHelper.js");

// --- La función crearAbastecimiento se mantiene igual en su lógica ---
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


/**
 * ==================================================================
 * FUNCIÓN CORREGIDA: Usa el correo y el rol del usuario
 * ==================================================================
 */
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
      { '$usuario.correo$': { [Op.iLike]: `%${search}%` } },      // <-- Busca en el correo
      { '$usuario.rol.nombre$': { [Op.iLike]: `%${search}%` } },  // <-- Busca en el nombre del rol
    ];
  }

  try {
    const { count, rows } = await Abastecimiento.findAndCountAll({
      where: whereClause,
      include: [
        { model: Producto, as: "producto", attributes: ["idProducto", "nombre", "existencia"] },
        {
          model: Usuario,
          as: "usuario",
          attributes: ["id_usuario", "correo"], // <-- Pide el correo
          include: {
            model: Rol,
            as: "rol",
            attributes: ["nombre"] // <-- Pide el nombre del rol
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
          attributes: ["id_usuario", "correo"], // <-- Pide el correo
          include: {
            model: Rol,
            as: "rol",
            attributes: ["nombre"] // <-- Pide el nombre del rol
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


// --- Las funciones de actualizar, eliminar y agotar se mantienen igual ---
// No necesitan cambios porque operan con IDs, no con nombres.
const actualizarAbastecimiento = async (idAbastecimiento, datosActualizar) => {
    // ... Tu código original para esta función
};

const eliminarAbastecimientoFisico = async (idAbastecimiento) => {
    // ... Tu código original para esta función
};

const agotarAbastecimiento = async (idAbastecimiento, razonAgotamiento) => {
    // ... Tu código original para esta función
};


/**
 * ==================================================================
 * FUNCIÓN CORREGIDA: Busca usuarios que pertenezcan al rol "Empleado"
 * ==================================================================
 */
const obtenerEmpleados = async () => {
  try {
    const empleados = await Usuario.findAll({
      include: {
        model: Rol,
        as: 'rol',
        where: {
          // Comparamos el nombre del rol, ignorando mayúsculas/minúsculas
          nombre: { [Op.iLike]: 'empleado' }
        },
        attributes: [] // No necesitamos las columnas del rol en el resultado final
      },
      where: {
        estado: true
      },
      attributes: ['id_usuario', 'correo'] // <-- Pide el correo del usuario
    });
    return empleados;
  } catch (error) {
    throw new CustomError(`Error al obtener la lista de empleados: ${error.message}`, 500);
  }
};


// --- EXPORTACIONES ---
module.exports = {
  crearAbastecimiento,
  obtenerTodosLosAbastecimientos,
  obtenerAbastecimientoPorId,
  actualizarAbastecimiento,
  eliminarAbastecimientoFisico,
  agotarAbastecimiento,
  obtenerEmpleados,
};