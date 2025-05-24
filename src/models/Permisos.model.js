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
        allowNull: false, // Ajustado por DDL: DEFAULT TRUE NOT NULL
        field: "estado",
      },
    },
    {
      tableName: "permisos",
      timestamps: false,
    }
  );

  Permisos.associate = (models) => {
    if (models.Rol && models.PermisosXRol) {
      Permisos.belongsToMany(models.Rol, {
        through: models.PermisosXRol,
        foreignKey: { name: "idPermiso", field: "idpermiso" },
        otherKey: { name: "idRol", field: "idrol" },
        as: "roles",
      });
    }
  };

  return Permisos;
};
