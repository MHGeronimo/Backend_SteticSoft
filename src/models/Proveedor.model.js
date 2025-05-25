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
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: "nombre",
      },
      tipo: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "tipo",
      },
      tipoDocumento: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "tipodocumento",
      },
      numeroDocumento: {
        type: DataTypes.STRING(45),
        allowNull: true,
        field: "numerodocumento",
      },
      nitEmpresa: {
        type: DataTypes.STRING(45),
        unique: true,
        allowNull: true,
        field: "nit_empresa",
      },
      telefono: {
        type: DataTypes.STRING(45),
        allowNull: false,
        field: "telefono",
      },
      correo: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        field: "correo",
        validate: {
          isEmail: {
            // Esto está bien para un campo que es SIEMPRE email
            msg: "Debe proporcionar un correo electrónico válido para el proveedor.",
          },
        },
      },
      direccion: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "direccion",
      },
      nombrePersonaEncargada: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "nombre_persona_encargada",
      },
      telefonoPersonaEncargada: {
        type: DataTypes.STRING(45),
        allowNull: true,
        field: "telefono_persona_encargada",
      },
      emailPersonaEncargada: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "email_persona_encargada",
        validate: {
          isEmail: {
            msg: "Debe proporcionar un correo electrónico válido para la persona encargada o dejarlo vacío.",
          },
        },
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: "estado",
      },
    },
    {
      tableName: "proveedor",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["nombre", "tipo"], // Nombres de los atributos del modelo Sequelize
        },
      ],
    }
  );

  Proveedor.associate = (models) => {
    if (models.Compra) {
      Proveedor.hasMany(models.Compra, {
        foreignKey: {
          name: "proveedorId",
          field: "proveedor_idproveedor",
          allowNull: true,
        },
        as: "comprasRealizadas",
      });
    }
  };

  return Proveedor;
};
