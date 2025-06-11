// src/models/TokenRecuperacion.model.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const TokenRecuperacion = sequelize.define(
    'TokenRecuperacion',
    {
      idTokenRecuperacion: { 
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id_token_recuperacion' 
      },
      idUsuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'id_usuario', 
        references: {
          model: 'usuario',
          key: 'id_usuario' 
        },
        onDelete: 'CASCADE'
      },
      token: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
        field: 'token'
      },
      fechaExpiracion: {
        type: DataTypes.DATE, // Se mapea a TIMESTAMP WITH TIME ZONE en PostgreSQL
        allowNull: false,
        field: 'fecha_expiracion' 
      }
    },
    {
      tableName: 'token_recuperacion', 
      timestamps: false
    }
  );

  TokenRecuperacion.associate = (models) => {
    // Un TokenRecuperacion pertenece a un Usuario.
    TokenRecuperacion.belongsTo(models.Usuario, {
      foreignKey: 'idUsuario',
      as: 'usuario'
    });
  };

  return TokenRecuperacion;
};