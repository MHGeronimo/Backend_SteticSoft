// src/shared/src_api/services/compra.service.js
import { sequelize } from '../config/sequelize.config.js';
import db from '../models/index.js'; // Importar el objeto db completo
import { NotFoundError, ConflictError } from '../errors/index.js';

/**
 * Crea una nueva compra y actualiza el stock de los productos.
 * @param {object} compraData - Los datos de la compra.
 * @returns {Promise<object>} - La nueva compra creada.
 */
async function create(compraData) {
  const { proveedorId, usuarioId, productos, ...compraInfo } = compraData;

  const resultado = await sequelize.transaction(async (t) => {
    const compra = await db.Compra.create(
      {
        ...compraInfo,
        proveedorId: proveedorId, // Asegurando el nombre correcto del campo
        usuarioId: usuarioId
      },
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

      const producto = await db.Producto.findByPk(prod.productoId, {
        transaction: t,
        lock: t.LOCK.UPDATE
      });
      if (producto) {
        // Al comprar, la existencia aumenta
        producto.existencia += prod.cantidad;
        await producto.save({ transaction: t });
      }
    }

    return compra;
  });

  return await findById(resultado.idCompra);
}

/**
 * Obtiene todas las compras.
 * @returns {Promise<Array<object>>} - Una lista de todas las compras.
 */
async function findAll() {
  return await db.Compra.findAll({
    include: [
      { model: db.Proveedor, as: 'proveedor', attributes: ['idProveedor', 'nombre'] },
      { model: db.Usuario, as: 'usuario', attributes: ['idUsuario', 'correo'] } // Asumiendo que el alias es 'usuario'
    ],
    order: [['fecha', 'DESC']]
  });
}

/**
 * Obtiene una compra por su ID.
 * @param {string} id - El ID de la compra.
 * @returns {Promise<object>} - Los detalles de la compra.
 */
async function findById(id) {
  const compra = await db.Compra.findByPk(id, {
    include: [
      { model: db.Proveedor, as: 'proveedor' },
      { model: db.Usuario, as: 'usuario', attributes: ['idUsuario', 'correo'] },
      {
        model: db.Producto, // Incluimos el modelo Producto directamente
        as: 'productosComprados', // Usando el alias correcto definido en Compra.model.js
        attributes: ['idProducto', 'nombre', 'descripcion'],
        through: {
          // A través de la tabla de unión, traemos sus atributos
          model: db.CompraXProducto,
          as: 'detalleCompra', // Damos un alias a la info de la tabla de unión
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

/**
 * Anula una compra y revierte el stock de los productos asociados.
 * @param {string} compraId - El ID de la compra a anular.
 * @returns {Promise<object>} - La compra actualizada.
 */
async function anular(compraId) {
  const resultado = await sequelize.transaction(async (t) => {
    const compra = await db.Compra.findByPk(compraId, {
      // CORRECCIÓN CLAVE: Se usa el alias 'productosComprados' definido en el modelo Compra.
      // Ya no se usa 'detalles'.
      include: [{
        model: db.Producto,
        as: 'productosComprados', 
        through: { 
          attributes: ['cantidad', 'valorUnitario'] 
        }
      }],
      transaction: t
    });

    if (!compra) {
      throw new NotFoundError('La compra no fue encontrada.');
    }

    if (compra.estado === false) {
      throw new ConflictError('Esta compra ya ha sido anulada.');
    }
    
    // CORRECCIÓN: Iteramos sobre 'productosComprados' y accedemos a la cantidad a través de 'CompraXProducto'
    for (const producto of compra.productosComprados) {
      const cantidadComprada = producto.CompraXProducto.cantidad;
      
      // Al anular, la existencia disminuye
      producto.existencia -= cantidadComprada;
      await producto.save({ transaction: t });
    }

    compra.estado = false;
    await compra.save({ transaction: t });

    return compra;
  });

  return resultado;
}

export const compraService = {
  create,
  findAll,
  findById,
  anular
};