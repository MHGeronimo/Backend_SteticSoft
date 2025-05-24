module.exports = (sequelize, DataTypes) => {
  const Estado = sequelize.define(
    "Estado",
    {
      idEstado: {
        type: DataTypes.INTEGER,
        autoIncrement: true, 
        primaryKey: true,
        field: "idestado",
      },
      nombreEstado: {
        type: DataTypes.STRING(45),
        unique: true,
        field: "nombreestado",
      },
    },
    {
      tableName: "Estado",
      timestamps: false,
    }
  );

  Estado.associate = (models) => {
    Estado.hasMany(models.Venta, {
      foreignKey: { name: "estadoId", field: "Estado_idEstado" }, 
    });
    Estado.hasMany(models.Cita, {
      foreignKey: { name: "estadoId", field: "Estado_idEstado" }, 
      as: "citas",
    });
  };

  return Estado;
};
