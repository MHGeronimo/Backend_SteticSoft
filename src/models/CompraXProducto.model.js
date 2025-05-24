// src/models/CompraXProducto.model.js
"use strict";

module.exports = (sequelize, DataTypes) => {
  const CompraXProducto = sequelize.define(
    "CompraXProducto",
    {
      idCompraXProducto: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idcompraxproducto",
      },
      cantidad: {
        type: DataTypes.INTEGER,
        field: "cantidad",
      },
      valorUnitario: {
        // JS camelCase
        type: DataTypes.DECIMAL(10, 2),
        field: "valorunitario", // BD snake_case o minúsculas
      },
      compraId: {
        // JS: compraId, FK: Compra_idCompra
        type: DataTypes.INTEGER,
        field: "compra_idcompra",
        references: {
          model: "compra",
          key: "idcompra",
        },
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
    },
    {
      tableName: "compraxproducto",
      timestamps: false,
    }
  );

  CompraXProducto.associate = (models) => {
    if (models.Compra) {
      CompraXProducto.belongsTo(models.Compra, {
        foreignKey: { name: "compraId", field: "compra_idcompra" },
        as: "compra",
      });
    }
    if (models.Producto) {
      CompraXProducto.belongsTo(models.Producto, {
        foreignKey: { name: "productoId", field: "producto_idproducto" },
        as: "producto",
      });
    }
  };

  return CompraXProducto;
};
