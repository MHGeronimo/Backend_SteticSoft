// src/models/Novedades.model.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Novedades = sequelize.define(
    'Novedades',
    {
      idNovedad: { 
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id_novedad' 
      },
      diaSemana: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'dia_semana', 
        validate: {
          min: 0,
          max: 6
        }
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
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: 'estado'
      },
      idEmpleado: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'id_empleado', 
        references: {
          model: 'empleado',
          key: 'id_empleado' 
        },
        onDelete: 'CASCADE'
      }
    },
    {
      tableName: 'novedades',
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ['id_empleado', 'dia_semana']
        }
      ]
    }
  );

  Novedades.associate = (models) => {
    // Una Novedad pertenece a un Empleado.
    Novedades.belongsTo(models.Empleado, {
      foreignKey: 'idEmpleado',
      as: 'empleado'
    });
  };

  return Novedades;
};