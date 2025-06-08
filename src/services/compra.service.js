// src/shared/src_api/services/compra.service.js

// CORRECCIÓN: Convertido a CommonJS
const { sequelize } = require('../config/sequelize.config.js');
const db = require('../models/index.js');
const { NotFoundError, ConflictError } = require('../errors/index.js');

async function create(compraData) {
  const { proveedorId, usuarioId, productos, ...compraInfo } = compraData;

  const resultado = await sequelize.transaction(async (t) => {
    const compra = await db.Compra.create(
      { ...compraInfo, proveedorId: proveedorId, usuarioId: usuarioId },
      { transaction: t }
    );

    for (const prod of productos) {
      await db.CompraXProducto.create(
        {
          compraId: compra.idCompra,
          productoId: prod.productoId,
          cantidad: prod.cantidad,
          valorUnitario: prod.valorUnitario
        },
        { transaction: t }
      );
      const producto = await db.Producto.findByPk(prod.productoId, { transaction: t, lock: t.LOCK.UPDATE });
      if (producto) {
        producto.existencia += prod.cantidad;
        await producto.save({ transaction: t });
      }
    }
    return compra;
  });
  return await findById(resultado.idCompra);
}

async function findAll() {
  return await db.Compra.findAll({
    include: [
      { model: db.Proveedor, as: 'proveedor', attributes: ['idProveedor', 'nombre'] },
      { model: db.Usuario, as: 'usuario', attributes: ['idUsuario', 'correo'] }
    ],
    order: [['fecha', 'DESC']]
  });
}

async function findById(id) {
  const compra = await db.Compra.findByPk(id, {
    include: [
      { model: db.Proveedor, as: 'proveedor' },
      { model: db.Usuario, as: 'usuario', attributes: ['idUsuario', 'correo'] },
      {
        model: db.Producto,
        as: 'productosComprados',
        attributes: ['idProducto', 'nombre', 'descripcion'],
        through: {
          model: db.CompraXProducto,
          as: 'detalleCompra',
          attributes: ['cantidad', 'valorUnitario']
        }
      }
    ]
  });
  if (!compra) {
    throw new NotFoundError('Compra no encontrada');
  }
  return compra;
}

async function anular(compraId) {
  const resultado = await sequelize.transaction(async (t) => {
    const compra = await db.Compra.findByPk(compraId, {
      include: [{
        model: db.Producto,
        as: 'productosComprados',
        through: { attributes: ['cantidad', 'valorUnitario'] }
      }],
      transaction: t
    });

    if (!compra) {
      throw new NotFoundError('La compra no fue encontrada.');
    }
    if (compra.estado === false) {
      throw new ConflictError('Esta compra ya ha sido anulada.');
    }
    
    for (const producto of compra.productosComprados) {
      const cantidadComprada = producto.CompraXProducto.cantidad;
      producto.existencia -= cantidadComprada;
      await producto.save({ transaction: t });
    }

    compra.estado = false;
    await compra.save({ transaction: t });
    return compra;
  });
  return resultado;
}

// CORRECCIÓN: Exportando con module.exports
module.exports = {
  create,
  findAll,
  findById,
  anular
};