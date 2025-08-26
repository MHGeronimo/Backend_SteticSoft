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
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: 'estado'
      }
    },
    {
      tableName: 'novedades',
      timestamps: false,
      validate: {
        fechaFinMayorOIgualQueFechaInicio() {
          if (this.fechaFin < this.fechaInicio) {
            throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio.');
          }
        },
        horaFinMayorQueHoraInicio() {
          if (this.horaFin <= this.horaInicio) {
            throw new Error('La hora de fin debe ser posterior a la hora de inicio.');
          }
        }
      }
    }
  );

  Novedad.associate = (models) => {
    // Una Novedad puede estar asignada a muchos Usuarios (Empleados)
    Novedad.belongsToMany(models.Usuario, {
      // ✅ CORRECCIÓN CLAVE: Se pasa el modelo directamente, no el nombre como string.
      through: models.NovedadEmpleado,
      foreignKey: 'id_novedad',
      otherKey: 'id_usuario',
      as: 'empleados'
    });
  };

  return Novedad;
};