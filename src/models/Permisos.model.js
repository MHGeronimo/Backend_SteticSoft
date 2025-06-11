// src/models/Permisos.model.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Permisos = sequelize.define(
    'Permisos',
    {
      idPermiso: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id_permiso' 
      },
      nombre: {
        type: DataTypes.STRING(100), 
        allowNull: false,
        unique: true,
        field: 'nombre'
      },
      descripcion: {
        type: DataTypes.TEXT,
        field: 'descripcion'
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: 'estado'
      }
    },
    {
      tableName: 'permisos',
      timestamps: false
    }
  );

  Permisos.associate = (models) => {
    // Un permiso puede pertenecer a muchos roles a través de la tabla de unión.
    Permisos.belongsToMany(models.Rol, {
      through: 'permisos_x_rol', 
      foreignKey: 'id_permiso',  // Clave foránea en la tabla de unión.
      otherKey: 'id_rol',        // La otra clave foránea en la tabla de unión.
      as: 'roles'
    });
  };

  return Permisos;
};