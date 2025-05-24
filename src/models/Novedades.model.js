// src/models/Novedades.model.js
"use strict";

module.exports = (sequelize, DataTypes) => {
  const Novedades = sequelize.define(
    "Novedades",
    {
      idNovedades: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idnovedades",
      },
      diaSemana: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "diasemana",
      },
      horaInicio: {
        type: DataTypes.TIME,
        allowNull: false,
        field: "horainicio",
      },
      horaFin: { type: DataTypes.TIME, allowNull: false, field: "horafin" },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: "estado",
      }, // Ajustado
      empleadoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "empleado_idempleado",
        references: { model: "empleado", key: "idempleado" },
        onDelete: "CASCADE", // Reflejando DDL
        onUpdate: "CASCADE",
      },
    },
    {
      tableName: "novedades",
      timestamps: false,
      indexes: [{ unique: true, fields: ["empleado_idempleado", "diasemana"] }],
    }
  );

  Novedades.associate = (models) => {
    if (models.Empleado) {
      Novedades.belongsTo(models.Empleado, {
        foreignKey: {
          name: "empleadoId",
          field: "empleado_idempleado",
          allowNull: false,
        },
        as: "empleadoConNovedad",
      });
    }
  };

  return Novedades;
};
