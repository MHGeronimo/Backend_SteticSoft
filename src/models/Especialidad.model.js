module.exports = (sequelize, DataTypes) => {
  const Especialidad = sequelize.define(
    "Especialidad",
    {
      idEspecialidad: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idespecialidad",
      },
      nombre: {
        type: DataTypes.STRING(45),
        allowNull: false,
        unique: true,
      },
      descripcion: {
        type: DataTypes.TEXT,
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "Especialidad",
      timestamps: false,
    }
  );

  Especialidad.associate = (models) => {
    Especialidad.belongsToMany(models.Empleado, {
      through: models.EmpleadoEspecialidad,
      foreignKey: { name: "idEspecialidad", field: "idespecialidad" },
      otherKey: { name: "idEmpleado", field: "idempleado" },
      as: "empleados",
    });
    Especialidad.hasMany(models.Servicio, {
      foreignKey: {
        name: "especialidadId",
        field: "Especialidad_idEspecialidad",
      }, 
      as: "servicios",
    });
  };

  return Especialidad;
};
