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
        allowNull: true, // Mantenido como true según DDL
        field: "idrol",
        references: { model: "rol", key: "idrol" },
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false, // Ajustado por DDL: DEFAULT TRUE NOT NULL
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
    if (models.TokenRecuperacion) {
      Usuario.hasMany(models.TokenRecuperacion, {
        foreignKey: { name: "idUsuario", field: "idusuario", allowNull: false }, // En TokenRecuperacion idUsuario es NOT NULL
        as: "tokensRecuperacion",
      });
    }
  };

  return Usuario;
};
