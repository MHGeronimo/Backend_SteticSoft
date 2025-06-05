// src/shared/src_api/models/Cliente.model.js
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
      nombre: {
        type: DataTypes.STRING(100),
        field: "nombre",
        allowNull: false,
      },
      apellido: {
        type: DataTypes.STRING(100),
        field: "apellido",
        allowNull: false,
      },
      correo: {
        // Correo del perfil del cliente, puede o no ser el mismo que el de la cuenta Usuario
        type: DataTypes.STRING(100),
        field: "correo",
        unique: true, // Este correo de perfil también es único
        allowNull: false,
        validate: { isEmail: true },
      },
      telefono: {
        type: DataTypes.STRING(45),
        field: "telefono",
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
      estado: {
        // Estado del perfil del cliente
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: "estado",
      },
      idUsuario: {
        // Clave Foránea para vincular con la tabla Usuario
        type: DataTypes.INTEGER,
        allowNull: false, // Un perfil de Cliente DEBE estar asociado a un Usuario
        unique: true, // Un Usuario solo puede tener un perfil de Cliente
        field: "idusuario",
        references: {
          model: "usuario", // Nombre de la tabla 'usuario'
          key: "idusuario", // Nombre de la columna 'idusuario' en la tabla 'usuario'
        },
      },
    },
    {
      tableName: "cliente",
      timestamps: false,
    }
  );

  Cliente.associate = (models) => {
    // Un Cliente pertenece a una cuenta de Usuario
    if (models.Usuario) {
      Cliente.belongsTo(models.Usuario, {
        foreignKey: { name: "idUsuario", field: "idusuario", allowNull: false },
        as: "usuarioCuenta", // Alias para acceder al Usuario desde un Cliente
      });
    }
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
