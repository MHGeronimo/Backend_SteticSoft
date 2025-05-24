// src/models/ServicioXCita.model.js
"use strict";

module.exports = (sequelize, DataTypes) => {
  const ServicioXCita = sequelize.define(
    "ServicioXCita",
    {
      idServicioXCita: {
        // DDL tiene un PK SERIAL para esta tabla de unión
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idservicioxcita",
      },
      servicioId: {
        // FK: Servicio_idServicio
        type: DataTypes.INTEGER,
        field: "servicio_idservicio",
        references: {
          model: "servicio",
          key: "idservicio",
        },
        // UNIQUE (Servicio_idServicio, Cita_idCita) se maneja con un índice
      },
      citaId: {
        // FK: Cita_idCita
        type: DataTypes.INTEGER,
        field: "cita_idcita",
        references: {
          model: "cita",
          key: "idcita",
        },
      },
    },
    {
      tableName: "servicioxcita",
      timestamps: false,
      indexes: [
        // Para la restricción UNIQUE (Servicio_idServicio, Cita_idCita)
        {
          unique: true,
          fields: ["servicio_idservicio", "cita_idcita"], // Nombres de columna en BD
        },
      ],
    }
  );

  // ServicioXCita.associate = (models) => {
  //   ServicioXCita.belongsTo(models.Servicio, { foreignKey: { name: 'servicioId', field: 'servicio_idservicio' } });
  //   ServicioXCita.belongsTo(models.Cita, { foreignKey: { name: 'citaId', field: 'cita_idcita' } });
  // };

  return ServicioXCita;
};
