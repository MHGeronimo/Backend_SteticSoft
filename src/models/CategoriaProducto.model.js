// src/models/CategoriaProducto.model.js
"use strict";

module.exports = (sequelize, DataTypes) => {
  const CategoriaProducto = sequelize.define(
    "CategoriaProducto",
    {
      idCategoria: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idcategoria",
      },
      nombre: { type: DataTypes.STRING(45), unique: true, field: "nombre" },
      descripcion: { type: DataTypes.STRING(45), field: "descripcion" },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false, // Ajustado
        field: "estado",
      },
      vidaUtilDias: { type: DataTypes.INTEGER, field: "vida_util_dias" },
      tipoUso: {
        type: DataTypes.STRING(10), // O DataTypes.ENUM('Interno', 'Externo')
        allowNull: false,
        field: "tipo_uso",
        validate: { isIn: [["Interno", "Externo"]] },
      },
    },
    {
      tableName: "categoria_producto",
      timestamps: false,
    }
  );

  CategoriaProducto.associate = (models) => {
    if (models.Producto) {
      CategoriaProducto.hasMany(models.Producto, {
        foreignKey: {
          name: "categoriaProductoId",
          field: "categoria_producto_idcategoria",
        },
        as: "productos",
      });
    }
  };

  return CategoriaProducto;
};
