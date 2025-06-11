// src/models/CompraXProducto.model.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const CompraXProducto = sequelize.define(
    'CompraXProducto',
    {
      idCompraXProducto: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id_compra_x_producto' 
      },
      cantidad: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        field: 'cantidad'
      },
      valorUnitario: {
        type: DataTypes.DECIMAL(12, 2), 
        defaultValue: 0.0,
        field: 'valor_unitario' 
      },
      idCompra: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'id_compra', 
        references: {
          model: 'compra',
          key: 'id_compra' 
        },
        onDelete: 'CASCADE' 
      },
      idProducto: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'id_producto', 
        references: {
          model: 'producto',
          key: 'id_producto' 
        },
        onDelete: 'RESTRICT' 
      }
    },
    {
      tableName: 'compra_x_producto', 
      timestamps: false
    }
  );

  CompraXProducto.associate = (models) => {
    // Un detalle de CompraXProducto pertenece a una Compra.
    CompraXProducto.belongsTo(models.Compra, {
      foreignKey: 'idCompra',
      as: 'compra'
    });
    // Un detalle de CompraXProducto pertenece a un Producto.
    CompraXProducto.belongsTo(models.Producto, {
      foreignKey: 'idProducto',
      as: 'producto'
    });
  };

  return CompraXProducto;
};