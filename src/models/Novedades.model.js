// src/models/Novedades.model.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Novedades = sequelize.define(
    'Novedades',
    {
      // Propiedad en JS: idNovedad -> Columna en BD: id_novedad
      idNovedad: { 
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id_novedad' 
      },
      // Propiedad en JS: diaSemana -> Columna en BD: dia_semana
      diaSemana: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'dia_semana', 
      },
      // Propiedad en JS: horaInicio -> Columna en BD: hora_inicio
      horaInicio: {
        type: DataTypes.TIME,
        allowNull: false,
        field: 'hora_inicio' 
      },
      // Propiedad en JS: horaFin -> Columna en BD: hora_fin
      horaFin: {
        type: DataTypes.TIME,
        allowNull: false,
        field: 'hora_fin' 
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: 'estado'
      },
      // Propiedad en JS: idEmpleado -> Columna en BD: id_empleado
      idEmpleado: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'id_empleado', 
      }
    },
    {
      // Nombre exacto de la tabla en la base de datos
      tableName: 'novedades',
      timestamps: false,
    }
  );

  Novedades.associate = (models) => {
    Novedades.belongsTo(models.Empleado, {
      foreignKey: 'idEmpleado', // Usa la propiedad del modelo, NO la columna de la BD
      as: 'empleado'
    });
  };

  return Novedades;
};