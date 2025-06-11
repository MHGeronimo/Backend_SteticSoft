// src/models/Compra.model.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Compra = sequelize.define(
    'Compra',
    {
      idCompra: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id_compra'
      },
      fecha: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW,
        field: 'fecha'
      },
      total: {
        type: DataTypes.DECIMAL(12, 2), 
        defaultValue: 0.0,
        field: 'total'
      },
      iva: {
        type: DataTypes.DECIMAL(12, 2), 
        defaultValue: 0.0,
        field: 'iva'
      },
      idProveedor: { 
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'id_proveedor',
        references: {
          model: 'proveedor',
          key: 'id_proveedor'
        },
        onDelete: 'RESTRICT'
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
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: 'estado'
      }
    },
    {
      tableName: 'compra',
      timestamps: false
    }
  );

  Compra.associate = (models) => {
    // Una Compra pertenece a un Proveedor.
    Compra.belongsTo(models.Proveedor, {
      foreignKey: 'idProveedor',
      as: 'proveedor'
    });

    // Una Compra puede pertenecer a un Dashboard.
    Compra.belongsTo(models.Dashboard, {
      foreignKey: 'idDashboard',
      as: 'dashboard'
    });

    // Una Compra tiene muchos Productos (a través de CompraXProducto).
    Compra.belongsToMany(models.Producto, {
      through: 'compra_x_producto',
      foreignKey: 'id_compra',     
      otherKey: 'id_producto',     
      as: 'productos'
    });
  };

  return Compra;
};