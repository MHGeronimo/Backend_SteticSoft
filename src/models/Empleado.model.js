// src/shared/src_api/models/Empleado.model.js
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
      nombre: {
        type: DataTypes.STRING(100),
        field: "nombre",
        allowNull: false,
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
      celular: { type: DataTypes.STRING(45), field: "celular" }, // Podría ser obligatorio
      estado: {
        // Estado del perfil del empleado
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: "estado",
      },
      idUsuario: {
        // Clave Foránea para vincular con la tabla Usuario
        type: DataTypes.INTEGER,
        allowNull: false, // Un perfil de Empleado DEBE estar asociado a un Usuario
        unique: true, // Un Usuario solo puede tener un perfil de Empleado
        field: "idusuario",
        references: {
          model: "usuario",
          key: "idusuario",
        },
      },
    },
    {
      tableName: "empleado",
      timestamps: false,
    }
  );

  Empleado.associate = (models) => {
    // Un Empleado pertenece a una cuenta de Usuario
    if (models.Usuario) {
      Empleado.belongsTo(models.Usuario, {
        foreignKey: { name: "idUsuario", field: "idusuario", allowNull: false },
        as: "cuentaUsuario", // Alias para acceder al Usuario desde Empleado
      });
    }

    // Tus asociaciones existentes para Empleado:
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
        foreignKey: {
          name: "Empleado_idEmpleado",
          field: "empleado_idempleado",
        }, // Revisa si este es el nombre de la FK en Cita
        as: "citasAtendidas",
      });
    }
    if (models.Abastecimiento) {
      Empleado.hasMany(models.Abastecimiento, {
        foreignKey: { name: "empleado_asignado", field: "empleado_asignado" }, // Revisa si este es el nombre de la FK en Abastecimiento
        as: "abastecimientosAsignados",
      });
    }
    if (models.Novedades) {
      Empleado.hasMany(models.Novedades, {
        foreignKey: {
          name: "Empleado_idEmpleado", // Revisa si este es el nombre de la FK en Novedades
          field: "empleado_idempleado",
          allowNull: false,
        },
        as: "novedadesHorario",
      });
    }
  };

  return Empleado;
};
