// src/models/VentaXServicio.model.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const VentaXServicio = sequelize.define(
    'VentaXServicio',
    {
      idVentaXServicio: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id_venta_x_servicio' 
      },
      valorServicio: {
        type: DataTypes.DECIMAL(12, 2), 
        defaultValue: 0.0,
        field: 'valor_servicio' 
      },
      idServicio: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'id_servicio', 
        references: {
          model: 'servicio',
          key: 'id_servicio' 
        },
        onDelete: 'RESTRICT' 
      },
      idCita: { 
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'id_cita', 
        references: {
          model: 'cita',
          key: 'id_cita' 
        },
        onDelete: 'SET NULL' 
      },
      idVenta: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'id_venta', 
        references: {
          model: 'venta',
          key: 'id_venta' 
        },
        onDelete: 'CASCADE' 
      }
    },
    {
      tableName: 'venta_x_servicio', 
      timestamps: false
    }
  );

  VentaXServicio.associate = (models) => {
    // Un detalle VentaXServicio pertenece a un Servicio.
    VentaXServicio.belongsTo(models.Servicio, {
      foreignKey: 'idServicio',
      as: 'servicio'
    });
    // Un detalle VentaXServicio puede pertenecer a una Cita.
    VentaXServicio.belongsTo(models.Cita, {
      foreignKey: 'idCita',
      as: 'cita'
    });
    // Un detalle VentaXServicio pertenece a una Venta.
    VentaXServicio.belongsTo(models.Venta, {
      foreignKey: 'idVenta',
      as: 'venta'
    });
  };

  return VentaXServicio;
};