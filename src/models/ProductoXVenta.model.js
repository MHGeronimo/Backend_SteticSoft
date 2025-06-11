// src/models/ProductoXVenta.model.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const ProductoXVenta = sequelize.define(
    'ProductoXVenta',
    {
      idProductoXVenta: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id_producto_x_venta' 
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
      idProducto: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'id_producto', 
        references: {
          model: 'producto',
          key: 'id_producto' 
        },
        onDelete: 'RESTRICT' 
      },
      idVenta: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'id_venta', 
        references: {
          model: 'venta',
          key: 'id_venta' 
        },
        onDelete: 'CASCADE' 
      },
      idDashboard: { 
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'id_dashboard', 
        references: {
          model: 'dashboard',
          key: 'id_dashboard' 
        },
        onDelete: 'SET NULL' 
      }
    },
    {
      tableName: 'producto_x_venta', 
      timestamps: false
    }
  );

  ProductoXVenta.associate = (models) => {
    // Indica que cada registro de 'ProductoXVenta' (un detalle de la venta) pertenece a un solo 'Producto'.
    ProductoXVenta.belongsTo(models.Producto, {
      foreignKey: "idProducto",
      as: "producto",
    });

    // Indica que cada registro de 'ProductoXVenta' pertenece a una sola 'Venta'.
    ProductoXVenta.belongsTo(models.Venta, {
      foreignKey: "idVenta",
      as: "venta",
    });

    // Indica que cada registro de 'ProductoXVenta' puede estar opcionalmente asociado a un 'Dashboard'.
    ProductoXVenta.belongsTo(models.Dashboard, {
      foreignKey: "idDashboard",
      as: "dashboard",
    });
  };

  return ProductoXVenta;
};