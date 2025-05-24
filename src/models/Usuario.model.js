module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define(
    "Usuario",
    {
      idUsuario: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idusuario",
      },
      correo: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
      },
      contrasena: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      idRol: {
        type: DataTypes.INTEGER,
        field: "idrol", 
        references: {
          model: "Rol",
          key: "idRol", 
        },
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "Usuario",
      timestamps: false,
    }
  );

  Usuario.associate = (models) => {
    Usuario.belongsTo(models.Rol, {
      foreignKey: {
        name: "idRol", 
        field: "idrol", 
      },
      as: "rol",
    });
    Usuario.hasOne(models.Cliente, {
      foreignKey: {
        name: "idUsuario",
        field: "idusuario",
      },
      as: "cliente",
    });
    Usuario.hasMany(models.TokenRecuperacion, {
      foreignKey: {
        name: "idUsuario",
        field: "idusuario",
      },
      as: "tokensRecuperacion",
    });
  };

  return Usuario;
};
