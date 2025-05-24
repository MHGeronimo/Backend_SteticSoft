module.exports = (sequelize, DataTypes) => {
  const Producto = sequelize.define(
    "Producto",
    {
      idProducto: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idproducto",
      },
      nombre: {
        type: DataTypes.STRING(45),
      },
      descripcion: {
        type: DataTypes.TEXT,
      },
      existencia: {
        type: DataTypes.INTEGER,
      },
      precio: {
        type: DataTypes.DECIMAL(10, 2),
      },
      stockMinimo: {
        type: DataTypes.INTEGER,
        field: "stockminimo",
      },
      stockMaximo: {
        type: DataTypes.INTEGER,
        field: "stockmaximo",
      },
      imagen: {
        type: DataTypes.TEXT,
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      categoriaProductoId: {
        type: DataTypes.INTEGER,
        field: "Categoria_producto_idCategoria", 
        references: {
          model: "Categoria_producto",
          key: "idCategoria",
        },
      },
    },
    {
      tableName: "Producto",
      timestamps: false,
    }
  );

  Producto.associate = (models) => {
    Producto.belongsTo(models.CategoriaProducto, {
      foreignKey: {
        name: "categoriaProductoId",
        field: "Categoria_producto_idCategoria",
      }, 
      as: "categoriaProducto",
    });
    Producto.hasMany(models.CompraXProducto, {
      foreignKey: { name: "productoId", field: "Producto_idProducto" },
      as: "comprasXProducto",
    });
    Producto.hasMany(models.ProductoXVenta, {
      foreignKey: { name: "productoId", field: "Producto_idProducto" },
      as: "productosXVenta",
    });
    Producto.hasMany(models.Abastecimiento, {
      foreignKey: { name: "productoId", field: "Producto_idProducto" }, 
      as: "abastecimientos",
    });
  };

  return Producto;
};
