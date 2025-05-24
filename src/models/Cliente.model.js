// src/models/Cliente.model.js
"use strict";

module.exports = (sequelize, DataTypes) => {
  const Cliente = sequelize.define(
    "Cliente",
    {
      idCliente: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idcliente",
      },
      nombre: { type: DataTypes.STRING(45), field: "nombre" },
      apellido: { type: DataTypes.STRING(45), field: "apellido" },
      correo: {
        type: DataTypes.STRING(45),
        field: "correo",
        validate: { isEmail: true },
      },
      telefono: { type: DataTypes.STRING(45), field: "telefono" },
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
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false, // Ajustado
        field: "estado",
      },
      idUsuario: {
        type: DataTypes.INTEGER,
        unique: true,
        allowNull: true,
        field: "idusuario",
        references: { model: "usuario", key: "idusuario" },
        onDelete: "SET NULL", // Reflejando DDL
        onUpdate: "CASCADE", // Buena práctica añadir onUpdate también
      },
    },
    {
      tableName: "cliente",
      timestamps: false,
    }
  );

  Cliente.associate = (models) => {
    if (models.Usuario) {
      Cliente.belongsTo(models.Usuario, {
        foreignKey: { name: "idUsuario", field: "idusuario" },
        as: "usuarioCuenta",
      });
    }
    // ... otras asociaciones ...
    if (models.Venta) {
      Cliente.hasMany(models.Venta, {
        foreignKey: { name: "clienteId", field: "cliente_idcliente" },
        as: "ventas",
      });
    }
    if (models.Cita) {
      Cliente.hasMany(models.Cita, {
        foreignKey: { name: "clienteId", field: "cliente_idcliente" },
        as: "citas",
      });
    }
  };

  return Cliente;
};
