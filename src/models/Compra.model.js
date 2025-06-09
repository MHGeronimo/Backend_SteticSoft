// src/models/Compra.model.js
"use strict";

module.exports = (sequelize, DataTypes) => {
  const Compra = sequelize.define(
    "Compra",
    {
      idCompra: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idcompra",
      },
      fecha: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW, // Sequelize puede manejar el default
        field: "fecha",
      },
      total: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
        field: "total",
      },
      iva: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
        field: "iva",
      },
      proveedorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "proveedor_idproveedor",
        references: {
          model: "proveedor",
          key: "idproveedor",
        },
        onDelete: "SET NULL",
      },
      dashboardId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "dashboard_iddashboard",
        references: {
          model: "dashboard",
          key: "iddashboard",
        },
        onDelete: "SET NULL",
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: "estado",
      },
    },
    {
      tableName: "compra",
      timestamps: false, // Asumiendo que no tienes createdAt/updatedAt aquí
    }
  );

  Compra.associate = (models) => {
    if (models.Proveedor) {
      Compra.belongsTo(models.Proveedor, {
        foreignKey: { name: "proveedorId", field: "proveedor_idproveedor" },
        as: "proveedor",
      });
    }
    if (models.Dashboard) {
      Compra.belongsTo(models.Dashboard, {
        foreignKey: { name: "dashboardId", field: "dashboard_iddashboard" },
        as: "dashboard",
      });
    }
    if (models.Producto && models.CompraXProducto) {
      Compra.belongsToMany(models.Producto, {
        through: models.CompraXProducto,
        foreignKey: { name: "compraId", field: "compra_idcompra" }, // Clave en CompraXProducto que referencia a Compra
        otherKey: { name: "productoId", field: "producto_idproducto" }, // Clave en CompraXProducto que referencia a Producto
        as: "productosComprados",
      });
    }
  };

  return Compra;
};
