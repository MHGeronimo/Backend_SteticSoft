// src/models/Venta.model.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Venta = sequelize.define(
    'Venta',
    {
      idVenta: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id_venta' 
      },
      estado: { 
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: 'estado'
      },
      fecha: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW,
        field: 'fecha'
      },
      total: {
        type: DataTypes.DECIMAL(12, 2), 
        defaultValue: 0.0,
        field: 'total'
      },
      iva: {
        type: DataTypes.DECIMAL(12, 2), 
        defaultValue: 0.0,
        field: 'iva'
      },
      idCliente: { 
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'id_cliente', 
        references: {
          model: 'cliente',
          key: 'id_cliente' 
        },
        onDelete: 'RESTRICT' 
      },
      idDashboard: { 
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'id_dashboard', 
        references: {
          model: 'dashboard',
          key: 'id_dashboard' 
        },
        onDelete: 'SET NULL'
      },
      idEstado: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'id_estado', 
        references: {
          model: 'estado',
          key: 'id_estado' 
        },
        onDelete: 'RESTRICT' 
      }
    },
    {
      tableName: 'venta',
      timestamps: false
    }
  );

  Venta.associate = (models) => {
    // Una Venta pertenece a un Cliente.
    Venta.belongsTo(models.Cliente, {
      foreignKey: 'idCliente',
      as: 'cliente'
    });

    // Una Venta puede pertenecer a un Dashboard.
    Venta.belongsTo(models.Dashboard, {
      foreignKey: 'idDashboard',
      as: 'dashboard'
    });

    // Una Venta tiene un Estado.
    Venta.belongsTo(models.Estado, {
      foreignKey: 'idEstado',
      as: 'estadoDetalle'
    });

    // Una Venta puede tener muchos Productos.
    Venta.belongsToMany(models.Producto, {
      through: models.ProductoXVenta,
      foreignKey: 'id_venta',      
      otherKey: 'id_producto',     
      as: 'productos'
    });
    
    // Una Venta puede tener muchos Servicios.
    Venta.belongsToMany(models.Servicio, {
      through: models.VentaXServicio,
      foreignKey: 'id_venta',      
      otherKey: 'id_servicio',     
      as: 'servicios'
    });
  };

  return Venta;
};