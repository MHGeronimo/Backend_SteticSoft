// src/shared/src_api/models/Usuario.model.js
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
        allowNull: false, // Un usuario siempre debe tener un rol
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
    // Un Usuario pertenece a un Rol
    if (models.Rol) {
      Usuario.belongsTo(models.Rol, {
        foreignKey: { name: "idRol", field: "idrol", allowNull: false },
        as: "rol", // Alias para acceder a la info del rol
      });
    }

    // Un Usuario puede tener un perfil de Cliente (relación uno a uno)
    if (models.Cliente) {
      Usuario.hasOne(models.Cliente, {
        foreignKey: { name: "idUsuario", field: "idusuario", allowNull: false, unique: true }, // FK en la tabla Cliente
        as: "clienteInfo", // Alias para acceder a la info del cliente
      });
    }

    // Un Usuario puede tener un perfil de Empleado (relación uno a uno)
    if (models.Empleado) { 
      Usuario.hasOne(models.Empleado, {
        foreignKey: { name: "idUsuario", field: "idusuario", allowNull: false, unique: true }, // FK en la tabla Empleado
        as: "empleadoInfo", // Alias para acceder a la info del empleado
      });
    }

    // Un Usuario puede tener muchos Tokens de Recuperación
    if (models.TokenRecuperacion) {
      Usuario.hasMany(models.TokenRecuperacion, {
        foreignKey: { name: "idUsuario", field: "idusuario", allowNull: false },
        as: "tokensRecuperacion",
      });
    }
  };

  return Usuario;
};