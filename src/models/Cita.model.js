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
      },
      fechaHora: {
        type: DataTypes.DATE, 
        field: "fechahora",
      },
      clienteId: {
        type: DataTypes.INTEGER,
        field: "Cliente_idCliente",
        references: {
          model: "Cliente",
          key: "idCliente",
        },
      },
      empleadoId: {
        type: DataTypes.INTEGER,
        field: "Empleado_idEmpleado", 
        references: {
          model: "Empleado",
          key: "idEmpleado",
        },
      },
      estadoId: {
        type: DataTypes.INTEGER,
        field: "Estado_idEstado",
        references: {
          model: "Estado",
          key: "idEstado",
        },
      },
    },
    {
      tableName: "Cita",
      timestamps: false,
    }
  );

  Cita.associate = (models) => {
    Cita.belongsTo(models.Cliente, {
      foreignKey: { name: "clienteId", field: "Cliente_idCliente" }, 
      as: "cliente",
    });
    Cita.belongsTo(models.Empleado, {
      foreignKey: { name: "empleadoId", field: "Empleado_idEmpleado" }, 
      as: "empleado",
    });
    Cita.belongsTo(models.Estado, {
      foreignKey: { name: "estadoId", field: "Estado_idEstado" }, 
      as: "estadoCita", 
    });
    Cita.hasMany(models.ServicioXCita, {
      foreignKey: { name: "citaId", field: "Cita_idCita" }, 
      as: "serviciosEnCita",
    });
    Cita.hasMany(models.VentaXServicio, {
      foreignKey: { name: "citaId", field: "Cita_idCita" }, 
      as: "ventasDeServiciosPorCita",
    });
  };

  return Cita;
};
