// src/models/Rol.model.js
"use strict";

module.exports = (sequelize, DataTypes) => {
  const Rol = sequelize.define(
    "Rol",
    {
      idRol: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idrol",
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
      tableName: "rol",
      timestamps: false,
    }
  );

  Rol.associate = (models) => {
    if (models.Usuario) {
      Rol.hasMany(models.Usuario, {
        foreignKey: {
          name: "idRol",
          field: "idrol",
          allowNull: true,
        },
        as: "usuarios",
      });
    }
    if (models.Permisos && models.PermisosXRol) {
      Rol.belongsToMany(models.Permisos, {
        through: models.PermisosXRol,
        foreignKey: { name: "idRol", field: "idrol" },
        otherKey: { name: "idPermiso", field: "idpermiso" },
        as: "permisos",
      });
    }
  };

  return Rol;
};
