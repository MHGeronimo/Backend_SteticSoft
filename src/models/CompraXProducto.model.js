module.exports = (sequelize, DataTypes) => {
  const CompraXProducto = sequelize.define(
    "CompraXProducto",
    {
      idCompraXProducto: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idcompraxproducto",
      },
      cantidad: {
        type: DataTypes.INTEGER,
      },
      valorUnitario: {
        type: DataTypes.DECIMAL(10, 2),
        field: "valorunitario",
      },
      compraId: {
        type: DataTypes.INTEGER,
        field: "Compra_idCompra", 
        references: {
          model: "Compra",
          key: "idCompra",
        },
      },
      productoId: {
        type: DataTypes.INTEGER,
        field: "Producto_idProducto",
        references: {
          model: "Producto",
          key: "idProducto",
        },
      },
    },
    {
      tableName: "CompraXProducto",
      timestamps: false,
    }
  );

  CompraXProducto.associate = (models) => {
    CompraXProducto.belongsTo(models.Compra, {
      foreignKey: { name: "compraId", field: "Compra_idCompra" }, 
      as: "compra",
    });
    CompraXProducto.belongsTo(models.Producto, {
      foreignKey: { name: "productoId", field: "Producto_idProducto" }, 
      as: "producto",
    });
  };

  return CompraXProducto;
};
