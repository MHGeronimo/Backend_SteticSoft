module.exports = (sequelize, DataTypes) => {
  const ServicioXCita = sequelize.define(
    "ServicioXCita",
    {
      idServicioXCita: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idservicioxcita",
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
    },
    {
      tableName: "ServicioXCita",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["Servicio_idServicio", "Cita_idCita"], 
        },
      ],
    }
  );

  ServicioXCita.associate = (models) => {
    ServicioXCita.belongsTo(models.Servicio, {
      foreignKey: { name: "servicioId", field: "Servicio_idServicio" }, 
      as: "servicio",
    });
    ServicioXCita.belongsTo(models.Cita, {
      foreignKey: { name: "citaId", field: "Cita_idCita" }, 
      as: "cita",
    });
  };

  return ServicioXCita;
};
