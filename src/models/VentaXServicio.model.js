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
        type: DataTypes.DECIMAL(10, 2),
        field: "valorservicio",
      },
      servicioId: {
        type: DataTypes.INTEGER,
        field: "Servicio_idServicio", 
        references: {
          model: "Servicio",
          key: "idServicio",
        },
      },
      citaId: {
        type: DataTypes.INTEGER,
        field: "Cita_idCita", 
        references: {
          model: "Cita",
          key: "idCita",
        },
      },
      ventaId: {
        type: DataTypes.INTEGER,
        field: "Venta_idVenta", 
        references: {
          model: "Venta",
          key: "idVenta",
        },
      },
    },
    {
      tableName: "VentaXServicio",
      timestamps: false,
    }
  );

  VentaXServicio.associate = (models) => {
    VentaXServicio.belongsTo(models.Servicio, {
      foreignKey: { name: "servicioId", field: "Servicio_idServicio" }, 
      as: "servicio",
    });
    VentaXServicio.belongsTo(models.Cita, {
      foreignKey: { name: "citaId", field: "Cita_idCita" },
      as: "cita",
    });
    VentaXServicio.belongsTo(models.Venta, {
      foreignKey: { name: "ventaId", field: "Venta_idVenta" }, 
      as: "venta",
    });
  };

  return VentaXServicio;
};
