// src/models/Proveedor.model.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Proveedor = sequelize.define(
    'Proveedor',
    {
      idProveedor: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id_proveedor' 
      },
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'nombre'
      },
      tipo: {
        type: DataTypes.STRING(50), 
        allowNull: false,
        field: 'tipo'
      },
      tipoDocumento: {
        type: DataTypes.STRING(50), 
        allowNull: true,
        field: 'tipo_documento'
      },
      numeroDocumento: {
        type: DataTypes.STRING(45),
        allowNull: true,
        field: 'numero_documento' 
      },
      nitEmpresa: {
        type: DataTypes.STRING(45),
        unique: true,
        allowNull: true,
        field: 'nit_empresa'
      },
      telefono: {
        type: DataTypes.STRING(20), 
        allowNull: false,
        field: 'telefono'
      },
      correo: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
        field: 'correo'
      },
      direccion: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'direccion'
      },
      nombrePersonaEncargada: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'nombre_persona_encargada'
      },
      telefonoPersonaEncargada: {
        type: DataTypes.STRING(20), 
        allowNull: true,
        field: 'telefono_persona_encargada' 
      },
      emailPersonaEncargada: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: { isEmail: true },
        field: 'email_persona_encargada'
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: 'estado'
      }
    },
    {
      tableName: 'proveedor',
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ['nombre', 'tipo']
        }
      ]
    }
  );

  Proveedor.associate = (models) => {
    // Un Proveedor puede tener muchas Compras.
    Proveedor.hasMany(models.Compra, {
      foreignKey: 'idProveedor', // Se refiere al atributo 'idProveedor' en el modelo Compra.
      as: 'compras'
    });
  };

  return Proveedor;
};