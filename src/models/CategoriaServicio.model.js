// src/models/CategoriaServicio.model.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const CategoriaServicio = sequelize.define(
    'CategoriaServicio',
    {
      idCategoriaServicio: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id_categoria_servicio' 
      },
      nombre: {
        type: DataTypes.STRING(100), 
        allowNull: false,
        unique: true,
        field: 'nombre'
      },
      descripcion: {
        type: DataTypes.TEXT, 
        field: 'descripcion'
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: 'estado'
      }
    },
    {
      tableName: 'categoria_servicio',
      timestamps: false
    }
  );

  CategoriaServicio.associate = (models) => {
    // Una CategoriaServicio puede tener muchos Servicios.
    CategoriaServicio.hasMany(models.Servicio, {
      foreignKey: 'idCategoriaServicio', // Se refiere al atributo en el modelo Servicio.
      as: 'servicios'
    });
  };

  return CategoriaServicio;
};