module.exports = (sequelize, DataTypes) => {
  const Dashboard = sequelize.define(
    "Dashboard",
    {
      idDashboard: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "iddashboard",
      },
      fechaCreacion: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: "fecha_creacion",
      },
      nombreDashboard: {
        type: DataTypes.STRING(100),
        field: "nombre_dashboard",
      },
    },
    {
      tableName: "Dashboard",
      timestamps: true, 
      createdAt: "fechaCreacion", 
      updatedAt: false, 
    }
  );

  Dashboard.associate = (models) => {
    Dashboard.hasMany(models.Compra, {
      foreignKey: { name: "dashboardId", field: "Dashboard_idDashboard" }, 
      as: "compras",
    });
    Dashboard.hasMany(models.Venta, {
      foreignKey: { name: "dashboardId", field: "Dashboard_idDashboard" }, 
      as: "ventas",
    });
    Dashboard.hasMany(models.ProductoXVenta, {
      foreignKey: { name: "dashboardId", field: "Dashboard_idDashboard" }, 
      as: "productosPorVenta",
    });
  };

  return Dashboard;
};
