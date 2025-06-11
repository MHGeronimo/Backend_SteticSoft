// src/shared/src_api/services/compra.service.js

const db = require('../models');
const {
  NotFoundError,
  BadRequestError,
  ConflictError,
} = require('../errors');
const productoService = require('./producto.service');
const proveedorService = require('./proveedor.service');

const crearCompra = async (datosCompra) => {
  const { proveedorId, fecha, total, iva, estado, productos } = datosCompra;

  // Validar que el proveedor exista
  const proveedor = await proveedorService.getProveedorById(proveedorId);
  if (!proveedor) {
    throw new NotFoundError(`El proveedor con ID ${proveedorId} no existe.`);
  }

  // Validar que la lista de productos no esté vacía
  if (!productos || productos.length === 0) {
    throw new BadRequestError('La compra debe tener al menos un producto.');
  }

  // Validar cada producto de la lista
  const productosValidados = [];
  for (const item of productos) {
    const producto = await productoService.getProductoById(item.productoId);
    if (!producto) {
      throw new NotFoundError(`El producto con ID ${item.productoId} no existe.`);
    }
    productosValidados.push({
      ...item,
      producto, // Guardamos el objeto completo para usarlo después
    });
  }

  // Iniciar una transacción
  const transaction = await db.sequelize.transaction();
  let nuevaCompra;

  try {
    // 1. Crear la compra principal
    nuevaCompra = await db.Compra.create(
      {
        idProveedor: proveedorId,
        fechaCompra: fecha,
        totalCompra: parseFloat(total).toFixed(2),
        iva: parseFloat(iva).toFixed(2),
        estado: estado,
      },
      { transaction }
    );

    // Si la compra no se creó, lanzar un error
    if (!nuevaCompra || !nuevaCompra.idCompra) {
      throw new Error('Falló la creación del registro de compra principal.');
    }

    const detallesCompra = [];
    // 2. Crear los detalles en la tabla CompraXProducto y actualizar el inventario
    for (const item of productosValidados) {
      // Crear el registro en la tabla de unión
      const detalle = await db.CompraXProducto.create(
        {
          // =================================================================
          // AQUÍ ESTÁ LA CORRECCIÓN ✅
          // Se cambiaron los nombres 'compraId' y 'productoId' por los
          // nombres correctos definidos en el modelo: 'idCompra' y 'idProducto'.
          // =================================================================
          idCompra: nuevaCompra.idCompra, // Corregido
          idProducto: item.productoId,   // Corregido
          cantidad: item.cantidad,
          valorUnitario: parseFloat(item.valorUnitario).toFixed(2),
        },
        { transaction }
      );
      detallesCompra.push(detalle);

      // Actualizar el stock del producto
      const nuevoStock = item.producto.stock + item.cantidad;
      await db.Producto.update(
        { stock: nuevoStock },
        { where: { idProducto: item.productoId }, transaction }
      );
    }

    // Si todo salió bien, confirmar la transacción
    await transaction.commit();

    // Devolver la compra creada con sus detalles
    return {
      ...nuevaCompra.toJSON(),
      productos: detallesCompra.map((d) => d.toJSON()),
    };
  } catch (error) {
    // Si algo falla, revertir la transacción
    await transaction.rollback();
    console.error('Error al crear la compra:', error);
    // Verificar si el error es de la base de datos para dar un mensaje más específico
    if (error.name && error.name.includes('Sequelize')) {
      throw new ConflictError(`Error en la base de datos: ${error.message}`);
    }
    throw new BadRequestError(`No se pudo completar la compra: ${error.message}`);
  }
};


const getCompraById = async (id) => {
    const compra = await db.Compra.findByPk(id, {
        include: [
            {
                model: db.Proveedor,
                as: 'proveedor',
            },
            {
                model: db.CompraXProducto,
                as: 'detalles',
                include: [{
                    model: db.Producto,
                    as: 'producto',
                }, ],
            },
        ],
    });
    if (!compra) {
        throw new NotFoundError(`Compra con id ${id} no encontrada`);
    }
    return compra;
};


const getAllCompras = async () => {
  try {
    const compras = await db.Compra.findAll({
      include: [{
        model: db.Proveedor,
        as: 'proveedor'
      }]
    });
    return compras;
  } catch (error) {
    console.error("Error al obtener todas las compras:", error);
    throw new Error('No se pudieron obtener las compras.');
  }
};


const anularCompra = async (idCompra) => {
  const compra = await getCompraById(idCompra);

  if (!compra) {
    throw new NotFoundError(`La compra con ID ${idCompra} no existe.`);
  }

  if (compra.estado === false) {
    throw new ConflictError('La compra ya ha sido anulada.');
  }

  // Iniciar una transacción
  const transaction = await db.sequelize.transaction();

  try {
    // 1. Revertir el stock de cada producto
    for (const detalle of compra.detalles) {
      const producto = await db.Producto.findByPk(detalle.idProducto, { transaction });
      if (producto) {
        const nuevoStock = producto.stock - detalle.cantidad;
        if (nuevoStock < 0) {
          throw new ConflictError(`No se puede anular la compra. El producto ${producto.nombre} tendría stock negativo.`);
        }
        await db.Producto.update(
          { stock: nuevoStock },
          { where: { idProducto: detalle.idProducto }, transaction }
        );
      }
    }

    // 2. Actualizar el estado de la compra a "anulado" (false)
    await db.Compra.update(
      { estado: false },
      { where: { idCompra }, transaction }
    );

    // Confirmar la transacción
    await transaction.commit();

    return { message: 'Compra anulada y stock revertido correctamente.' };
  } catch (error) {
    // Revertir la transacción si hay un error
    await transaction.rollback();
    console.error('Error al anular la compra:', error);
    throw new BadRequestError(`No se pudo anular la compra: ${error.message}`);
  }
};


module.exports = {
    crearCompra,
    getAllCompras,
    getCompraById,
    anularCompra
};