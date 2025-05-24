module.exports = (sequelize, DataTypes) => {
  const Empleado = sequelize.define(
    "Empleado",
    {
      idEmpleado: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idempleado",
      },
      nombre: {
        type: DataTypes.STRING(45),
      },
      tipoDocumento: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "tipodocumento",
      },
      numeroDocumento: {
        type: DataTypes.STRING(45),
        allowNull: false,
        unique: true,
        field: "numerodocumento",
      },
      fechaNacimiento: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "fechanacimiento",
      },
      celular: {
        type: DataTypes.STRING(45),
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "Empleado",
      timestamps: false,
    }
  );

  Empleado.associate = (models) => {
    Empleado.belongsToMany(models.Especialidad, {
      through: models.EmpleadoEspecialidad,
      foreignKey: { name: "idEmpleado", field: "idempleado" },
      otherKey: { name: "idEspecialidad", field: "idespecialidad" },
      as: "especialidades",
    });
    Empleado.hasMany(models.Cita, {
      foreignKey: { name: "empleadoId", field: "Empleado_idEmpleado" }, 
      as: "citas",
    });
    Empleado.hasMany(models.Abastecimiento, {
      foreignKey: { name: "empleadoAsignado", field: "empleado_asignado" },
      as: "abastecimientos",
    });
    Empleado.hasMany(models.Novedades, {
      foreignKey: { name: "empleadoId", field: "Empleado_idEmpleado" }, 
      as: "novedades",
    });
  };

  return Empleado;
};
