// src/models/Especialidad.model.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Especialidad = sequelize.define(
    'Especialidad',
    {
      idEspecialidad: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id_especialidad' 
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
      tableName: 'especialidad',
      timestamps: false
    }
  );

  Especialidad.associate = (models) => {
    // Una Especialidad puede ser tenida por muchos Empleados.
    Especialidad.belongsToMany(models.Empleado, {
      through: 'empleado_especialidad', 
      foreignKey: 'id_especialidad',  
      otherKey: 'id_empleado',     
      as: 'empleados'
    });
  };

  return Especialidad;
};