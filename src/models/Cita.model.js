// src/models/Cita.model.js
"use strict";

module.exports = (sequelize, DataTypes) => {
  const Cita = sequelize.define(
    "Cita",
    {
      idCita: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idcita",
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: "estado",
      }, // Ajustado
      fechaHora: { type: DataTypes.DATE, allowNull: false, field: "fechahora" }, // Ajustado
      clienteId: {
        type: DataTypes.INTEGER,
        allowNull: true, // DDL no dice NOT NULL, pero una cita sin cliente es rara. Ajustar si es mandatorio.
        field: "cliente_idcliente",
        references: { model: "cliente", key: "idcliente" },
        onDelete: "CASCADE", // DDL
        onUpdate: "CASCADE",
      },
      empleadoId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "empleado_idempleado",
        references: { model: "empleado", key: "idempleado" },
        onDelete: "SET NULL", // DDL
        onUpdate: "CASCADE",
      },
      estadoCitaId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "estado_idestado",
        references: { model: "estado", key: "idestado" },
        onDelete: "SET NULL", // DDL
        onUpdate: "CASCADE",
      },
    },
    {
      tableName: "cita",
      timestamps: false,
    }
  );

  Cita.associate = (models) => {
    if (models.Cliente) {
      Cita.belongsTo(models.Cliente, {
        foreignKey: { name: "clienteId", field: "cliente_idcliente" },
        as: "cliente",
      });
    }
    if (models.Empleado) {
      Cita.belongsTo(models.Empleado, {
        foreignKey: { name: "empleadoId", field: "empleado_idempleado" },
        as: "empleado",
      });
    }
    if (models.Estado) {
      Cita.belongsTo(models.Estado, {
        foreignKey: { name: "estadoCitaId", field: "estado_idestado" },
        as: "estadoDetalle",
      });
    }
    if (models.Servicio && models.ServicioXCita) {
      Cita.belongsToMany(models.Servicio, {
        through: models.ServicioXCita,
        foreignKey: { name: "citaId", field: "cita_idcita" },
        otherKey: { name: "servicioId", field: "servicio_idservicio" },
        as: "serviciosProgramados",
      });
    }
    if (models.VentaXServicio) {
      Cita.hasMany(models.VentaXServicio, {
        foreignKey: { name: "citaId", field: "cita_idcita" },
        as: "detallesVentaServicioDeCita", // Alias más específico
      });
    }
  };

  return Cita;
};
