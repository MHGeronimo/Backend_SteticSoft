// src/models/EmpleadoEspecialidad.model.js
"use strict";

module.exports = (sequelize, DataTypes) => {
  const EmpleadoEspecialidad = sequelize.define(
    "EmpleadoEspecialidad",
    {
      idEmpleado: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        field: "idempleado",
        references: {
          model: "empleado",
          key: "idempleado",
        },
        onDelete: "CASCADE",
      },
      idEspecialidad: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        field: "idespecialidad",
        references: {
          model: "especialidad",
          key: "idespecialidad",
        },
        onDelete: "CASCADE",
      },
    },
    {
      tableName: "empleadoespecialidad",
      timestamps: false,
    }
  );

  // EmpleadoEspecialidad.associate = (models) => {
  //   EmpleadoEspecialidad.belongsTo(models.Empleado, { foreignKey: { name: 'idEmpleado', field: 'idempleado' } });
  //   EmpleadoEspecialidad.belongsTo(models.Especialidad, { foreignKey: { name: 'idEspecialidad', field: 'idespecialidad' } });
  // };

  return EmpleadoEspecialidad;
};
