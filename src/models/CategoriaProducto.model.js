module.exports = (sequelize, DataTypes) => {
  const CategoriaProducto = sequelize.define(
    "CategoriaProducto",
    {
      idCategoria: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idcategoria",
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
      vidaUtilDias: {
        type: DataTypes.INTEGER,
        field: "vida_util_dias",
      },
      tipoUso: {
        type: DataTypes.ENUM("Interno", "Externo"),
        allowNull: false,
        field: "tipo_uso",
      },
    },
    {
      tableName: "Categoria_producto", 
      timestamps: false,
    }
  );

  CategoriaProducto.associate = (models) => {
    CategoriaProducto.hasMany(models.Producto, {
      foreignKey: {
        name: "categoriaProductoId",
        field: "Categoria_producto_idCategoria",
      }, 
      as: "productos",
    });
  };

  return CategoriaProducto;
};
