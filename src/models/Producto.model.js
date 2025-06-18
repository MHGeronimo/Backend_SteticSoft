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
        field: "id_producto",
      },
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: "nombre",
      },
      descripcion: {
        type: DataTypes.TEXT,
        field: "descripcion",
      },
      existencia: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: { min: 0 },
        field: "existencia",
      },
      precio: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.0,
        field: "precio",
      },
      stockMinimo: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: "stock_minimo",
      },
      stockMaximo: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: "stock_maximo",
      },
      imagen: {
        type: DataTypes.TEXT,
        field: "imagen",
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: "estado",
      },
      tipo_uso: {
        type: DataTypes.ENUM("Interno", "Venta Directa", "Otro"),
        allowNull: false,
        defaultValue: "Venta Directa",
        field: "tipo_uso",
      },
      vida_util_dias: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { min: 0 },
        field: "vida_util_dias",
      },
      categoriaProductoId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "id_categoria_producto",
        references: {
          model: "categoria_producto",
          key: "id_categoria_producto",
        },
        onDelete: "RESTRICT",
      },
    },
    {
      tableName: "producto",
      timestamps: false,
    }
  );

  Producto.associate = (models) => {
    // Un Producto pertenece a una CategoriaProducto.
    Producto.belongsTo(models.CategoriaProducto, {
      foreignKey: "categoriaProductoId", // Clave foránea correcta y única
      as: "categoria",
    });

    // Un Producto puede estar en muchas Compras.
    Producto.belongsToMany(models.Compra, {
      through: "compra_x_producto",
      foreignKey: "id_producto",
      otherKey: "id_compra",
      as: "compras",
    });

    // Un Producto puede estar en muchas Ventas.
    Producto.belongsToMany(models.Venta, {
      through: "producto_x_venta",
      foreignKey: "id_producto",
      otherKey: "id_venta",
      as: "ventas",
    });

    // Un Producto puede tener muchos registros de Abastecimiento.
    Producto.hasMany(models.Abastecimiento, {
      foreignKey: "idProducto",
      as: "abastecimientos",
    });
  };

  return Producto;
};
