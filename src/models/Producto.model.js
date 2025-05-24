// src/models/Producto.model.js
"use strict";

module.exports = (sequelize, DataTypes) => {
  const Producto = sequelize.define(
    "Producto",
    {
      idProducto: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idproducto",
      },
      nombre: { type: DataTypes.STRING(45), field: "nombre" },
      descripcion: { type: DataTypes.TEXT, field: "descripcion" },
      existencia: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: "existencia",
      },
      precio: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
        field: "precio",
      },
      stockMinimo: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: "stockminimo",
      },
      stockMaximo: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: "stockmaximo",
      },
      imagen: { type: DataTypes.TEXT, field: "imagen" },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: "estado",
      }, // Ajustado
      categoriaProductoId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "categoria_producto_idcategoria",
        references: { model: "categoria_producto", key: "idcategoria" },
        onDelete: "SET NULL", // Reflejando DDL
        onUpdate: "CASCADE",
      },
    },
    {
      tableName: "producto",
      timestamps: false,
    }
  );

  Producto.associate = (models) => {
    if (models.CategoriaProducto) {
      Producto.belongsTo(models.CategoriaProducto, {
        foreignKey: {
          name: "categoriaProductoId",
          field: "categoria_producto_idcategoria",
        },
        as: "categoriaProducto",
      });
    }
    if (models.Compra && models.CompraXProducto) {
      Producto.belongsToMany(models.Compra, {
        through: models.CompraXProducto,
        foreignKey: { name: "productoId", field: "producto_idproducto" },
        otherKey: { name: "compraId", field: "compra_idcompra" },
        as: "comprasRelacionadas",
      });
    }
    if (models.Venta && models.ProductoXVenta) {
      Producto.belongsToMany(models.Venta, {
        through: models.ProductoXVenta,
        foreignKey: { name: "productoId", field: "producto_idproducto" },
        otherKey: { name: "ventaId", field: "venta_idventa" },
        as: "ventasRelacionadas",
      });
    }
    if (models.Abastecimiento) {
      Producto.hasMany(models.Abastecimiento, {
        foreignKey: {
          name: "productoId",
          field: "producto_idproducto",
          allowNull: false,
        },
        as: "historialAbastecimiento",
      });
    }
  };

  return Producto;
};
