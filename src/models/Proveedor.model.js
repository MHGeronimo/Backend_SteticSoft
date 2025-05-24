// src/models/Proveedor.model.js
"use strict";

module.exports = (sequelize, DataTypes) => {
  const Proveedor = sequelize.define(
    "Proveedor",
    {
      idProveedor: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idproveedor",
      },
      nombre: { type: DataTypes.STRING(45), field: "nombre" },
      tipo: { type: DataTypes.TEXT, allowNull: false, field: "tipo" },
      tipoDocumento: { type: DataTypes.TEXT, field: "tipodocumento" },
      numeroDocumento: { type: DataTypes.STRING(45), field: "numerodocumento" },
      nitEmpresa: {
        type: DataTypes.STRING(45),
        unique: true,
        field: "nit_empresa",
      },
      telefono: { type: DataTypes.STRING(45), field: "telefono" },
      correo: {
        type: DataTypes.STRING(45),
        field: "correo",
        validate: { isEmail: true },
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false, // Ajustado
        field: "estado",
      },
    },
    {
      tableName: "proveedor",
      timestamps: false,
      indexes: [
        { unique: true, fields: ["nombre", "tipo"] }, // Nombres de los atributos JS
      ],
    }
  );

  Proveedor.associate = (models) => {
    if (models.Compra) {
      Proveedor.hasMany(models.Compra, {
        foreignKey: { name: "proveedorId", field: "proveedor_idproveedor" },
        as: "comprasRealizadas",
      });
    }
  };

  return Proveedor;
};
