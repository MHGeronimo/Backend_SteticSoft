// src/models/ProductoXVenta.model.js
"use strict";

module.exports = (sequelize, DataTypes) => {
  const ProductoXVenta = sequelize.define(
    "ProductoXVenta",
    {
      idProductoXVenta: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idproductoxventa",
      },
      cantidad: {
        type: DataTypes.INTEGER,
        field: "cantidad",
      },
      valorUnitario: {
        type: DataTypes.DECIMAL(10, 2),
        field: "valorunitario",
      },
      productoId: {
        // JS: productoId, FK: Producto_idProducto
        type: DataTypes.INTEGER,
        field: "producto_idproducto",
        references: {
          model: "producto",
          key: "idproducto",
        },
      },
      ventaId: {
        // JS: ventaId, FK: Venta_idVenta
        type: DataTypes.INTEGER,
        field: "venta_idventa",
        references: {
          model: "venta",
          key: "idventa",
        },
      },
      dashboardId: {
        // JS: dashboardId, FK: Dashboard_idDashboard
        type: DataTypes.INTEGER,
        allowNull: true, // Asumiendo que puede ser nulo según DDL
        field: "dashboard_iddashboard",
        references: {
          model: "dashboard",
          key: "iddashboard",
        },
      },
    },
    {
      tableName: "productoxventa",
      timestamps: false,
    }
  );

  ProductoXVenta.associate = (models) => {
    if (models.Producto) {
      ProductoXVenta.belongsTo(models.Producto, {
        foreignKey: { name: "productoId", field: "producto_idproducto" },
        as: "producto",
      });
    }
    if (models.Venta) {
      ProductoXVenta.belongsTo(models.Venta, {
        foreignKey: { name: "ventaId", field: "venta_idventa" },
        as: "venta",
      });
    }
    if (models.Dashboard) {
      ProductoXVenta.belongsTo(models.Dashboard, {
        foreignKey: { name: "dashboardId", field: "dashboard_iddashboard" },
        as: "dashboard",
      });
    }
  };

  return ProductoXVenta;
};
