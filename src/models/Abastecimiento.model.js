// src/models/Abastecimiento.model.js
"use strict";

module.exports = (sequelize, DataTypes) => {
  const Abastecimiento = sequelize.define(
    "Abastecimiento",
    {
      idAbastecimiento: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idabastecimiento",
      },
      cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "cantidad",
      },
      productoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "producto_idproducto",
        references: { model: "producto", key: "idproducto" },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      fechaIngreso: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: "fecha_ingreso",
      },
      empleadoAsignado: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "empleado_asignado",
        references: { model: "empleado", key: "idempleado" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      estaAgotado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        field: "esta_agotado",
      },
      razonAgotamiento: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "razon_agotamiento",
      },
      fechaAgotamiento: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: "fecha_agotamiento",
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: "estado",
      },
    },
    {
      tableName: "abastecimiento",
      timestamps: false,
    }
  );

  Abastecimiento.associate = (models) => {
    if (models.Producto) {
      Abastecimiento.belongsTo(models.Producto, {
        foreignKey: {
          name: "productoId",
          field: "producto_idproducto",
          allowNull: false,
        },
        as: "productoAbastecido",
      });
    }
    if (models.Empleado) {
      Abastecimiento.belongsTo(models.Empleado, {
        foreignKey: { name: "empleadoAsignado", field: "empleado_asignado" },
        as: "empleadoResponsable",
      });
    }
  };

  return Abastecimiento;
};
