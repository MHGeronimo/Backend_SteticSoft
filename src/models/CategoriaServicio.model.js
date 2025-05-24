module.exports = (sequelize, DataTypes) => {
  const CategoriaServicio = sequelize.define(
    "CategoriaServicio",
    {
      idCategoriaServicio: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idcategoriaservicio",
      },
      nombre: {
        type: DataTypes.STRING(45),
        unique: true,
      },
      descripcion: {
        type: DataTypes.STRING(45),
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "Categoria_servicio", 
      timestamps: false,
    }
  );

  CategoriaServicio.associate = (models) => {
    CategoriaServicio.hasMany(models.Servicio, {
      foreignKey: {
        name: "categoriaServicioId",
        field: "Categoria_servicio_idCategoriaServicio",
      }, 
      as: "servicios",
    });
  };

  return CategoriaServicio;
};
