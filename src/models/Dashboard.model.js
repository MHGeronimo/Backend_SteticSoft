// src/models/Dashboard.model.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Dashboard = sequelize.define(
    'Dashboard',
    {
      idDashboard: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id_dashboard' 
      },
      fechaCreacion: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'fecha_creacion'
      },
      nombreDashboard: {
        type: DataTypes.STRING(100),
        field: 'nombre_dashboard'
      }
    },
    {
      tableName: 'dashboard',
      timestamps: false
    }
  );

  Dashboard.associate = (models) => {
    // Un Dashboard puede estar asociado a muchas Compras.
    Dashboard.hasMany(models.Compra, {
      foreignKey: 'idDashboard', // Se refiere al atributo en el modelo Compra.
      as: 'compras'
    });

    // Un Dashboard puede estar asociado a muchas Ventas.
    Dashboard.hasMany(models.Venta, {
      foreignKey: 'idDashboard', // Se refiere al atributo en el modelo Venta.
      as: 'ventas'
    });
    
    // Un Dashboard puede estar asociado a muchos detalles de Venta de Productos.
    Dashboard.hasMany(models.ProductoXVenta, {
      foreignKey: 'idDashboard', // Se refiere al atributo en el modelo ProductoXVenta.
      as: 'detallesVenta'
    });
  };

  return Dashboard;
};