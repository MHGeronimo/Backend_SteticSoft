module.exports = (sequelize, DataTypes) => {
  const EmpleadoEspecialidad = sequelize.define(
    "EmpleadoEspecialidad",
    {
      idEmpleado: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: "Empleado",
          key: "idEmpleado",
        },
        field: "idempleado",
        onDelete: "CASCADE",
      },
      idEspecialidad: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: "Especialidad",
          key: "idEspecialidad",
        },
        field: "idespecialidad",
        onDelete: "CASCADE",
      },
    },
    {
      tableName: "EmpleadoEspecialidad",
      timestamps: false,
    }
  );

  return EmpleadoEspecialidad;
};
