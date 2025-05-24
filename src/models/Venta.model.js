module.exports = (sequelize, DataTypes) => {
  const Venta = sequelize.define(
    "Venta",
    {
      idVenta: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idventa",
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
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
      clienteId: {
        type: DataTypes.INTEGER,
        field: "Cliente_idCliente", 
        references: {
          model: "Cliente",
          key: "idCliente",
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
      estadoId: {
        type: DataTypes.INTEGER,
        field: "Estado_idEstado", 
        references: {
          model: "Estado",
          key: "idEstado",
        },
      },
    },
    {
      tableName: "Venta",
      timestamps: false,
    }
  );

  Venta.associate = (models) => {
    Venta.belongsTo(models.Cliente, {
      foreignKey: { name: "clienteId", field: "Cliente_idCliente" }, 
      as: "cliente",
    });
    Venta.belongsTo(models.Dashboard, {
      foreignKey: { name: "dashboardId", field: "Dashboard_idDashboard" }, 
      as: "dashboard",
    });
    Venta.belongsTo(models.Estado, {
      foreignKey: { name: "estadoId", field: "Estado_idEstado" }, 
      as: "estadoVenta", 
    });
    Venta.hasMany(models.ProductoXVenta, {
      foreignKey: { name: "ventaId", field: "Venta_idVenta" }, 
      as: "productosVendidos",
    });
    Venta.hasMany(models.VentaXServicio, {
      foreignKey: { name: "ventaId", field: "Venta_idVenta" },
      as: "serviciosVendidos",
    });
  };

  return Venta;
};
