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
      },
      descripcion: {
        type: DataTypes.TEXT,
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "Permisos",
      timestamps: false,
    }
  );

  Permisos.associate = (models) => {
    Permisos.belongsToMany(models.Rol, {
      through: models.PermisosXRol,
      foreignKey: {
        name: "idPermiso",
        field: "idpermiso",
      },
      otherKey: {
        name: "idRol",
        field: "idrol",
      },
      as: "roles",
    });
  };

  return Permisos;
};
