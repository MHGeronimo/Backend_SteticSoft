// src/models/Novedad.model.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Novedad = sequelize.define(
    'Novedad',
    {
      idNovedad: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id_novedad'
      },
      fechaInicio: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'fecha_inicio'
      },
      fechaFin: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'fecha_fin'
      },
      horaInicio: {
        type: DataTypes.TIME,
        allowNull: false,
        field: 'hora_inicio'
      },
      horaFin: {
        type: DataTypes.TIME,
        allowNull: false,
        field: 'hora_fin'
      },
      dias: {
        type: DataTypes.JSONB,
        allowNull: false,
        field: 'dias'
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: 'estado'
      }
    },
    {
      tableName: 'novedades',
      timestamps: false
    }
  );

  Novedad.associate = (models) => {
    Novedad.belongsToMany(models.Usuario, {
      through: 'novedad_empleado',
      foreignKey: 'id_novedad',
      otherKey: 'id_usuario',
      as: 'empleados'
    });

    Novedad.hasMany(models.Cita, {
      foreignKey: 'id_novedad',
      as: 'citas'
    });
  };

  return Novedad;
};