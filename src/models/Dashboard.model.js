// src/models/Dashboard.model.js
"use strict";

module.exports = (sequelize, DataTypes) => {
  const Dashboard = sequelize.define(
    "Dashboard",
    {
      idDashboard: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "iddashboard",
      },
      fechaCreacion: {
        // JS camelCase
        type: DataTypes.DATEONLY, // Tu DDL dice DATE
        allowNull: false,
        defaultValue: DataTypes.NOW, // Sequelize usará la función NOW() de la BD
        field: "fecha_creacion", // BD snake_case
      },
      nombreDashboard: {
        // JS camelCase
        type: DataTypes.STRING(100),
        field: "nombre_dashboard", // BD snake_case
      },
    },
    {
      tableName: "dashboard",
      // Para esta tabla, sí gestionamos un timestamp de creación, pero con nombre específico
      timestamps: true, // Habilitar timestamps
      createdAt: "fecha_creacion", // Mapear 'createdAt' de Sequelize a tu columna 'fecha_creacion'
      updatedAt: false, // No tienes columna 'updatedAt'
    }
  );

  Dashboard.associate = (models) => {
    if (models.Compra) {
      Dashboard.hasMany(models.Compra, {
        foreignKey: { name: "dashboardId", field: "dashboard_iddashboard" }, // FK en tabla 'compra'
        as: "compras",
      });
    }
    if (models.Venta) {
      Dashboard.hasMany(models.Venta, {
        foreignKey: { name: "dashboardId", field: "dashboard_iddashboard" }, // FK en tabla 'venta'
        as: "ventas",
      });
    }
    if (models.ProductoXVenta) {
      Dashboard.hasMany(models.ProductoXVenta, {
        foreignKey: { name: "dashboardId", field: "dashboard_iddashboard" }, // FK en tabla 'productoxventa'
        as: "detallesVentaConDashboard",
      });
    }
  };

  return Dashboard;
};
