// src/models/NovedadEmpleado.model.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const NovedadEmpleado = sequelize.define(
    'NovedadEmpleado',
    {
      id_novedad: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: 'Novedad',
          key: 'idNovedad'
        }
      },
      id_usuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: 'Usuario',
          key: 'idUsuario'
        }
      }
    },
    {
      tableName: 'novedad_empleado',
      timestamps: false
    }
  );

  return NovedadEmpleado;
};