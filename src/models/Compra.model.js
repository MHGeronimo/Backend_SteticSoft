module.exports = (sequelize, DataTypes) => {
  const Compra = sequelize.define(
    "Compra",
    {
      idCompra: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idcompra",
      },
      fecha: {
        type: DataTypes.DATEONLY,
      },
      total: {
        type: DataTypes.DECIMAL(10, 2),
      },
      iva: {
        type: DataTypes.DECIMAL(10, 2),
        field: "IVA", 
      },
      proveedorId: {
        type: DataTypes.INTEGER,
        field: "Proveedor_idProveedor", 
        references: {
          model: "Proveedor",
          key: "idProveedor",
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
      tableName: "Compra",
      timestamps: false,
    }
  );

  Compra.associate = (models) => {
    Compra.belongsTo(models.Proveedor, {
      foreignKey: { name: "proveedorId", field: "Proveedor_idProveedor" },
      as: "proveedor",
    });
    Compra.belongsTo(models.Dashboard, {
      foreignKey: { name: "dashboardId", field: "Dashboard_idDashboard" }, 
      as: "dashboard",
    });
    Compra.hasMany(models.CompraXProducto, {
      foreignKey: { name: "compraId", field: "Compra_idCompra" }, 
      as: "detallesCompra",
    });
  };

  return Compra;
};
