// src/models/Especialidad.model.js
"use strict";

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
        field: "nombre",
      },
      descripcion: { type: DataTypes.TEXT, field: "descripcion" },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false, // Ajustado
        field: "estado",
      },
    },
    {
      tableName: "especialidad",
      timestamps: false,
    }
  );

  Especialidad.associate = (models) => {
    if (models.Empleado && models.EmpleadoEspecialidad) {
      Especialidad.belongsToMany(models.Empleado, {
        through: models.EmpleadoEspecialidad,
        foreignKey: { name: "idEspecialidad", field: "idespecialidad" },
        otherKey: { name: "idEmpleado", field: "idempleado" },
        as: "empleadosConEspecialidad",
      });
    }
    if (models.Servicio) {
      Especialidad.hasMany(models.Servicio, {
        foreignKey: {
          name: "especialidadId",
          field: "especialidad_idespecialidad",
          allowNull: true,
        },
        as: "serviciosDeEspecialidad",
      });
    }
  };

  return Especialidad;
};
