// src/models/Estado.model.js
"use strict";

module.exports = (sequelize, DataTypes) => {
  const Estado = sequelize.define(
    "Estado",
    {
      idEstado: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idestado",
      },
      nombreEstado: {
        type: DataTypes.STRING(45),
        unique: true,
        allowNull: false, // Ajustado por DDL
        field: "nombreestado",
      },
    },
    {
      tableName: "estado",
      timestamps: false,
    }
  );

  Estado.associate = (models) => {
    if (models.Venta) {
      Estado.hasMany(models.Venta, {
        foreignKey: { name: "estadoVentaId", field: "estado_idestado" }, // Usamos estadoVentaId en el modelo Venta
        as: "ventasEnEsteEstado",
      });
    }
    if (models.Cita) {
      Estado.hasMany(models.Cita, {
        foreignKey: { name: "estadoCitaId", field: "estado_idestado" }, // Usamos estadoCitaId en el modelo Cita
        as: "citasEnEsteEstado",
      });
    }
  };

  return Estado;
};
