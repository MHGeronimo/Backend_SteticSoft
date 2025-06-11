// src/models/PermisosXRol.model.js
"use strict";

module.exports = (sequelize, DataTypes) => {
  const PermisosXRol = sequelize.define(
    "PermisosXRol",
    {
      idRol: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        field: "id_rol", // CORREGIDO: Mapeo a la columna snake_case.
        references: {
          model: "rol",
          key: "id_rol", // CORREGIDO: Clave referenciada en la tabla rol.
        },
        onDelete: "CASCADE",
      },
      idPermiso: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        field: "id_permiso", // CORREGIDO: Mapeo a la columna snake_case.
        references: {
          model: "permisos",
          key: "id_permiso", // CORREGIDO: Clave referenciada en la tabla permisos.
        },
        onDelete: "CASCADE",
      },
    },
    {
      tableName: "permisos_x_rol", // CORREGIDO: Nombre exacto de la tabla en snake_case.
      timestamps: false,
    }
  );

  // Aunque las asociaciones principales están en Rol y Permisos,
  // es una buena práctica definir las inversas aquí por si se necesita
  // consultar esta tabla directamente e incluir sus "padres".
  PermisosXRol.associate = (models) => {
    PermisosXRol.belongsTo(models.Rol, { foreignKey: "idRol", as: "rol" });
    PermisosXRol.belongsTo(models.Permisos, {
      foreignKey: "idPermiso",
      as: "permiso",
    });
  };

  return PermisosXRol;
};
