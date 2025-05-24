// src/models/VentaXServicio.model.js
"use strict";

module.exports = (sequelize, DataTypes) => {
  const VentaXServicio = sequelize.define(
    "VentaXServicio",
    {
      idVentaXServicio: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idventaxservicio",
      },
      valorServicio: {
        // JS camelCase
        type: DataTypes.DECIMAL(10, 2),
        field: "valorservicio", // BD snake_case o minúsculas
      },
      servicioId: {
        // JS: servicioId, FK: Servicio_idServicio
        type: DataTypes.INTEGER,
        field: "servicio_idservicio",
        references: {
          model: "servicio",
          key: "idservicio",
        },
      },
      citaId: {
        // JS: citaId, FK: Cita_idCita
        type: DataTypes.INTEGER,
        allowNull: true, // Asumiendo que puede ser nulo si una venta de servicio no siempre está ligada a una cita previa
        field: "cita_idcita",
        references: {
          model: "cita",
          key: "idcita",
        },
      },
      ventaId: {
        // JS: ventaId, FK: Venta_idVenta
        type: DataTypes.INTEGER,
        field: "venta_idventa",
        references: {
          model: "venta",
          key: "idventa",
        },
      },
    },
    {
      tableName: "ventaxservicio",
      timestamps: false,
    }
  );

  VentaXServicio.associate = (models) => {
    if (models.Servicio) {
      VentaXServicio.belongsTo(models.Servicio, {
        foreignKey: { name: "servicioId", field: "servicio_idservicio" },
        as: "servicio",
      });
    }
    if (models.Cita) {
      VentaXServicio.belongsTo(models.Cita, {
        foreignKey: { name: "citaId", field: "cita_idcita" },
        as: "cita",
      });
    }
    if (models.Venta) {
      VentaXServicio.belongsTo(models.Venta, {
        foreignKey: { name: "ventaId", field: "venta_idventa" },
        as: "venta",
      });
    }
  };

  return VentaXServicio;
};
