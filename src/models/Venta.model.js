// src/models/Venta.model.js
"use strict";

module.exports = (sequelize, DataTypes) => {
  const Venta = sequelize.define(
    "Venta",
    {
      idVenta: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idventa",
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: "estado",
      }, // Ajustado
      fecha: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW,
        field: "fecha",
      }, // Ajustado
      total: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
        field: "total",
      }, // Ajustado
      iva: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0, field: "iva" }, // Ajustado
      clienteId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "cliente_idcliente",
        references: { model: "cliente", key: "idcliente" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      dashboardId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "dashboard_iddashboard",
        references: { model: "dashboard", key: "iddashboard" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      estadoVentaId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "estado_idestado",
        references: { model: "estado", key: "idestado" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
    },
    {
      tableName: "venta",
      timestamps: false,
    }
  );

  Venta.associate = (models) => {
    if (models.Cliente) {
      Venta.belongsTo(models.Cliente, {
        foreignKey: { name: "clienteId", field: "cliente_idcliente" },
        as: "cliente",
      });
    }
    if (models.Dashboard) {
      Venta.belongsTo(models.Dashboard, {
        foreignKey: { name: "dashboardId", field: "dashboard_iddashboard" },
        as: "dashboard",
      });
    }
    if (models.Estado) {
      Venta.belongsTo(models.Estado, {
        foreignKey: { name: "estadoVentaId", field: "estado_idestado" },
        as: "estadoDetalle",
      });
    }
    if (models.Producto && models.ProductoXVenta) {
      Venta.belongsToMany(models.Producto, {
        through: models.ProductoXVenta,
        foreignKey: { name: "ventaId", field: "venta_idventa" },
        otherKey: { name: "productoId", field: "producto_idproducto" },
        as: "productosVendidos",
      });
    }
    if (models.Servicio && models.VentaXServicio) {
      Venta.belongsToMany(models.Servicio, {
        through: models.VentaXServicio,
        foreignKey: { name: "ventaId", field: "venta_idventa" },
        otherKey: { name: "servicioId", field: "servicio_idservicio" },
        as: "serviciosVendidos",
      });
    }
  };

  return Venta;
};
