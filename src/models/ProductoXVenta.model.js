module.exports = (sequelize, DataTypes) => {
  const ProductoXVenta = sequelize.define(
    "ProductoXVenta",
    {
      idProductoXVenta: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idproductoxventa",
      },
      cantidad: {
        type: DataTypes.INTEGER,
      },
      valorUnitario: {
        type: DataTypes.DECIMAL(10, 2),
        field: "valorunitario",
      },
      productoId: {
        type: DataTypes.INTEGER,
        field: "Producto_idProducto",
        references: {
          model: "Producto",
          key: "idProducto",
        },
      },
      ventaId: {
        type: DataTypes.INTEGER,
        field: "Venta_idVenta", 
        references: {
          model: "Venta",
          key: "idVenta",
        },
      },
      dashboardId: {
        type: DataTypes.INTEGER,
        field: "Dashboard_idDashboard", 
        references: {
          model: "Dashboard",
          key: "idDashboard",
        },
      },
    },
    {
      tableName: "ProductoXVenta",
      timestamps: false,
    }
  );

  ProductoXVenta.associate = (models) => {
    ProductoXVenta.belongsTo(models.Producto, {
      foreignKey: { name: "productoId", field: "Producto_idProducto" }, 
      as: "producto",
    });
    ProductoXVenta.belongsTo(models.Venta, {
      foreignKey: { name: "ventaId", field: "Venta_idVenta" }, 
      as: "venta",
    });
    ProductoXVenta.belongsTo(models.Dashboard, {
      foreignKey: { name: "dashboardId", field: "Dashboard_idDashboard" }, 
      as: "dashboard",
    });
  };

  return ProductoXVenta;
};
