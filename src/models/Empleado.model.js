// src/models/Empleado.model.js
"use strict";

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
      nombre: { type: DataTypes.STRING(45), field: "nombre" },
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
      celular: { type: DataTypes.STRING(45), field: "celular" },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false, // Ajustado
        field: "estado",
      },
    },
    {
      tableName: "empleado",
      timestamps: false,
    }
  );

  Empleado.associate = (models) => {
    if (models.Especialidad && models.EmpleadoEspecialidad) {
      Empleado.belongsToMany(models.Especialidad, {
        through: models.EmpleadoEspecialidad,
        foreignKey: { name: "idEmpleado", field: "idempleado" },
        otherKey: { name: "idEspecialidad", field: "idespecialidad" },
        as: "especialidades",
      });
    }
    if (models.Cita) {
      Empleado.hasMany(models.Cita, {
        foreignKey: { name: "empleadoId", field: "empleado_idempleado" },
        as: "citasAtendidas",
      });
    }
    if (models.Abastecimiento) {
      Empleado.hasMany(models.Abastecimiento, {
        foreignKey: { name: "empleadoAsignado", field: "empleado_asignado" },
        as: "abastecimientosAsignados",
      });
    }
    if (models.Novedades) {
      Empleado.hasMany(models.Novedades, {
        foreignKey: {
          name: "empleadoId",
          field: "empleado_idempleado",
          allowNull: false,
        },
        as: "novedadesHorario",
      });
    }
  };

  return Empleado;
};
