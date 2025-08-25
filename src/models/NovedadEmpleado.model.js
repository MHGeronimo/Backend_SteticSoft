// src/models/NovedadEmpleado.model.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const NovedadEmpleado = sequelize.define(
    'NovedadEmpleado',
    {
      idNovedad: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        field: 'id_novedad',
        references: {
          model: 'novedades',
          key: 'id_novedad'
        },
        onDelete: 'CASCADE'
      },
      idUsuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        field: 'id_usuario',
        references: {
          model: 'usuario',
          key: 'id_usuario'
        },
        onDelete: 'CASCADE'
      }
    },
    {
      tableName: 'novedad_empleado',
      timestamps: false
    }
  );

  return NovedadEmpleado;
};