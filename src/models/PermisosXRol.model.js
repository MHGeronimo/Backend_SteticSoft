module.exports = (sequelize, DataTypes) => {
  const PermisosXRol = sequelize.define(
    "PermisosXRol",
    {
      idRol: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: "Rol", 
          key: "idRol", 
        },
        field: "idrol",
        onDelete: "CASCADE",
      },
      idPermiso: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: "Permisos",
          key: "idPermiso",
        },
        field: "idpermiso",
        onDelete: "CASCADE",
      },
    },
    {
      tableName: "PermisosXRol",
      timestamps: false,
    }
  );
  return PermisosXRol;
};
