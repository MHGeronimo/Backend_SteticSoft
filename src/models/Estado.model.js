// src/models/Estado.model.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Estado = sequelize.define(
    'Estado',
    {
      idEstado: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id_estado' 
      },
      nombreEstado: {
        type: DataTypes.STRING(45),
        unique: true,
        allowNull: false,
        field: 'nombre_estado' 
      }
    },
    {
      tableName: 'estado',
      timestamps: false
    }
  );

  Estado.associate = (models) => {
    // Un Estado puede estar en muchas Ventas.
    Estado.hasMany(models.Venta, {
      foreignKey: 'idEstado', // Se refiere al atributo 'idEstado' en el modelo Venta.
      as: 'ventas'
    });

    // Un Estado puede estar en muchas Citas.
    Estado.hasMany(models.Cita, {
      foreignKey: 'idEstado', // Se refiere al atributo 'idEstado' en el modelo Cita.
      as: 'citas'
    });
  };

  return Estado;
};