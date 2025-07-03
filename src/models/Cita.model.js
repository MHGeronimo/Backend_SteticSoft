// src/models/Cita.model.js 
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Cita = sequelize.define(
    'Cita',
    {
      idCita: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id_cita' 
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: 'estado'
      },
      fechaHora: {
        type: DataTypes.DATE, // Se mapea a TIMESTAMP WITH TIME ZONE en PostgreSQL
        allowNull: false,
        field: 'fecha_hora' 
      },
      idCliente: { 
        type: DataTypes.INTEGER,
        allowNull: false, // Una cita debe tener un cliente. Ajustado a NOT NULL.
        field: 'id_cliente', 
        references: {
          model: 'cliente',
          key: 'id_cliente' 
        },
        onDelete: 'CASCADE'
      },
      idEmpleado: { 
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'id_empleado', 
        references: {
          model: 'empleado',
          key: 'id_empleado' 
        },
        onDelete: 'SET NULL'
      },
      idEstado: { 
        type: DataTypes.INTEGER,
        allowNull: false, // Una cita debe tener un estado.
        field: 'id_estado', 
        references: {
          model: 'estado',
          key: 'id_estado' 
        },
        onDelete: 'RESTRICT' 
      }
    },
    {
      tableName: 'cita',
      timestamps: false
    }
  );

  Cita.associate = (models) => {
    // Una Cita pertenece a un Cliente.
    Cita.belongsTo(models.Cliente, {
      foreignKey: 'idCliente',
      as: 'cliente'
    });

    // Una Cita es atendida por un Empleado.
    Cita.belongsTo(models.Empleado, {
      foreignKey: 'idEmpleado',
      as: 'empleado'
    });

    // Una Cita tiene un Estado.
    Cita.belongsTo(models.Estado, {
      foreignKey: 'idEstado',
      as: 'estadoDetalle'
    });

    // Una Cita puede incluir muchos Servicios.
    Cita.belongsToMany(models.Servicio, {
      through: 'servicio_x_cita', 
      foreignKey: 'id_cita',      
      otherKey: 'id_servicio',    
      as: 'serviciosProgramados'
    });
    
    // La Cita puede tener detalles de Venta asociados.
    Cita.hasMany(models.VentaXServicio, {
        foreignKey: 'idCita', // Se refiere al atributo en VentaXServicio
        as: 'detallesVenta'
    });
  };

  return Cita;
};