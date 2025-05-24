// src/models/CategoriaServicio.model.js
"use strict";

module.exports = (sequelize, DataTypes) => {
  const CategoriaServicio = sequelize.define(
    "CategoriaServicio",
    {
      idCategoriaServicio: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idcategoriaservicio",
      },
      nombre: { type: DataTypes.STRING(45), unique: true, field: "nombre" },
      descripcion: { type: DataTypes.STRING(45), field: "descripcion" },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false, // Ajustado
        field: "estado",
      },
    },
    {
      tableName: "categoria_servicio",
      timestamps: false,
    }
  );

  CategoriaServicio.associate = (models) => {
    if (models.Servicio) {
      CategoriaServicio.hasMany(models.Servicio, {
        foreignKey: {
          name: "categoriaServicioId",
          field: "categoria_servicio_idcategoriaservicio",
          allowNull: false,
        },
        as: "servicios",
      });
    }
  };

  return CategoriaServicio;
};
