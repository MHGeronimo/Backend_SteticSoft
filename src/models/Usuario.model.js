// src/models/Usuario.model.js
"use strict";

module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define(
    "Usuario",
    {
      idUsuario: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idusuario",
      },
      correo: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
        field: "correo",
        validate: {
          isEmail: true,
        },
      },
      contrasena: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "contrasena",
      },
      idRol: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "idrol",
        references: { model: "rol", key: "idrol" },
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: "estado",
      },
    },
    {
      tableName: "usuario",
      timestamps: false,
    }
  );

  Usuario.associate = (models) => {
    if (models.Rol) {
      Usuario.belongsTo(models.Rol, {
        foreignKey: { name: "idRol", field: "idrol" },
        as: "rol",
      });
    }
    if (models.Cliente) {
      Usuario.hasOne(models.Cliente, {
        foreignKey: { name: "idUsuario", field: "idusuario", unique: true },
        as: "clienteInfo",
      });
    }
    if (models.Empleado) {
      Usuario.hasOne(models.Empleado, {
        foreignKey: { name: "idUsuario", field: "idusuario", unique: true }, // Asume que Empleado.idusuario es la FK
        as: "empleadoInfo", // Alias para la relación
      });
    }
    if (models.TokenRecuperacion) {
      Usuario.hasMany(models.TokenRecuperacion, {
        foreignKey: { name: "idUsuario", field: "idusuario", allowNull: false },
        as: "tokensRecuperacion",
      });
    }
  };

  return Usuario;
};
