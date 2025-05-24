// src/models/TokenRecuperacion.model.js
"use strict";

module.exports = (sequelize, DataTypes) => {
  const TokenRecuperacion = sequelize.define(
    "TokenRecuperacion",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "id",
      },
      idUsuario: {
        type: DataTypes.INTEGER,
        allowNull: false, // Ajustado
        field: "idusuario",
        references: { model: "usuario", key: "idusuario" },
        onDelete: "CASCADE", // Reflejando DDL
        onUpdate: "CASCADE",
      },
      token: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
        field: "token",
      }, // Ajustado unique
      fechaExpiracion: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "fechaexpiracion",
      },
    },
    {
      tableName: "tokenrecuperacion",
      timestamps: false,
    }
  );

  TokenRecuperacion.associate = (models) => {
    if (models.Usuario) {
      TokenRecuperacion.belongsTo(models.Usuario, {
        foreignKey: { name: "idUsuario", field: "idusuario", allowNull: false },
        as: "usuario",
      });
    }
  };

  return TokenRecuperacion;
};
