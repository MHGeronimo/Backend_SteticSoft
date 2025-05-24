// src/models/PermisosXRol.model.js
"use strict";

module.exports = (sequelize, DataTypes) => {
  const PermisosXRol = sequelize.define(
    "PermisosXRol",
    {
      idRol: {
        type: DataTypes.INTEGER,
        primaryKey: true, // Parte de la PK compuesta
        field: "idrol",
        references: {
          model: "rol", // Nombre de la tabla referenciada en BD
          key: "idrol",
        },
        onDelete: "CASCADE",
      },
      idPermiso: {
        type: DataTypes.INTEGER,
        primaryKey: true, // Parte de la PK compuesta
        field: "idpermiso",
        references: {
          model: "permisos", // Nombre de la tabla referenciada en BD
          key: "idpermiso",
        },
        onDelete: "CASCADE",
      },
    },
    {
      tableName: "permisosxrol", // Nombre exacto de la tabla en BD
      timestamps: false,
    }
  );

  // PermisosXRol.associate = (models) => {
  //   // Las asociaciones belongsTo son opcionales aquí si no las necesitas directamente
  //   // ya que la relación many-to-many se define en Rol y Permisos.
  //   // Pero si quieres poder hacer PermisosXRol.getRol() o PermisosXRol.getPermiso():
  //   PermisosXRol.belongsTo(models.Rol, { foreignKey: { name: 'idRol', field: 'idrol' }, as: 'rol' });
  //   PermisosXRol.belongsTo(models.Permisos, { foreignKey: { name: 'idPermiso', field: 'idpermiso' }, as: 'permiso' });
  // };

  return PermisosXRol;
};
