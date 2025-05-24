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
      tableName: "Rol", 
      timestamps: false, 
    }
  );

  Rol.associate = (models) => {
    Rol.hasMany(models.Usuario, {
      foreignKey: {
        name: "idRol", 
        field: "idrol", 
      },
      as: "usuarios",
    });
    Rol.belongsToMany(models.Permisos, {
      through: models.PermisosXRol,
      foreignKey: {
        name: "idRol",
        field: "idrol",
      },
      otherKey: {
        name: "idPermiso",
        field: "idpermiso",
      },
      as: "permisos",
    });
  };

  return Rol;
};
