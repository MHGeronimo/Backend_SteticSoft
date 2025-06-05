// src/models/Permisos.model.js
"use strict";

module.exports = (sequelize, DataTypes) => {
  const Permisos = sequelize.define(
    "Permisos",
    {
      idPermiso: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idpermiso",
      },
      nombre: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
        field: "nombre",
      },
      descripcion: {
        type: DataTypes.TEXT,
        field: "descripcion",
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: "estado",
      },
    },
    {
      tableName: "permisos",
      timestamps: false,
    }
  );

  Permisos.associate = (models) => {
    if (models.Rol) {
      Permisos.belongsToMany(models.Rol, {
        through: 'PermisosXRol',
        foreignKey: { name: "idPermiso", field: "idpermiso" },
        otherKey: { name: "idRol", field: "idrol" },
        as: "roles",
      });
    }
  };

  return Permisos;
};