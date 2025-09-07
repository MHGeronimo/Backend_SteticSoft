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
        type: DataTypes.DATE,
        allowNull: false,
        field: 'fecha_hora' 
      },
      idCliente: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'id_cliente', 
        references: {
          model: 'cliente',
          key: 'id_cliente' 
        }
      },
      idUsuario: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'id_usuario',
        references: {
          model: 'usuario',
          key: 'id_usuario'
        }
      },
      idEstado: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'id_estado', 
        references: {
          model: 'estado',
          key: 'id_estado' 
        }
      },
      idNovedad: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'id_novedad',
        references: {
          model: 'novedades', // Asegúrate que este nombre coincida con tu tabla
          key: 'id_novedad'
        }
      }
    },
    {
      tableName: 'cita',
      timestamps: false
    }
  );

  Cita.associate = (models) => {
    Cita.belongsTo(models.Cliente, {
      foreignKey: 'idCliente',
      as: 'cliente'
    });

    Cita.belongsTo(models.Usuario, {
      foreignKey: 'idUsuario',
      as: 'empleado'
    });

    Cita.belongsTo(models.Estado, {
      foreignKey: 'idEstado',
      as: 'estadoDetalle'
    });

    Cita.belongsTo(models.Novedad, { // ✅ AGREGAR esta asociación
      foreignKey: 'idNovedad',
      as: 'novedad'
    });

    Cita.belongsToMany(models.Servicio, {
      through: 'servicio_x_cita', 
      foreignKey: 'id_cita',      
      otherKey: 'id_servicio',    
      as: 'serviciosProgramados'
    });
    
    Cita.hasMany(models.VentaXServicio, {
      foreignKey: 'idCita',
      as: 'detallesVenta'
    });
  };

  return Cita;
};