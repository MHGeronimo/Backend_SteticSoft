module.exports = (sequelize, DataTypes) => {
  const TokenRecuperacion = sequelize.define(
    "TokenRecuperacion",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      idUsuario: {
        type: DataTypes.INTEGER,
        field: "idusuario",
        references: {
          model: "Usuario",
          key: "idUsuario",
        },
      },
      token: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      fechaExpiracion: {
        type: DataTypes.DATE, 
        allowNull: false,
        field: "fechaexpiracion",
      },
    },
    {
      tableName: "TokenRecuperacion",
      timestamps: false,
    }
  );

  TokenRecuperacion.associate = (models) => {
    TokenRecuperacion.belongsTo(models.Usuario, {
      foreignKey: { name: "idUsuario", field: "idusuario" },
      as: "usuario",
    });
  };

  return TokenRecuperacion;
};
