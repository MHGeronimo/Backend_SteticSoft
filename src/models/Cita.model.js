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
      // DEPRECADO: El campo 'estado' booleano fue reemplazado por la FK 'id_estado'.
      // estado: {
      //   type: DataTypes.BOOLEAN,
      //   defaultValue: true,
      //   allowNull: false,
      //   field: 'estado'
      // },
      // DEPRECADO: El campo 'fechaHora' no existe en el nuevo schema. La información de horario viene de 'novedades'.
      // fechaHora: {
      //   type: DataTypes.DATE, // Se mapea a TIMESTAMP WITH TIME ZONE en PostgreSQL
      //   allowNull: false,
      //   field: 'fecha_hora'
      // },
      idNovedad: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'id_novedad',
        references: {
          model: 'novedades',
          key: 'id_novedad'
        },
        onDelete: 'SET NULL'
      },
      idCliente: { 
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'id_cliente', 
        references: {
          model: 'cliente',
          key: 'id_cliente' 
        },
        onDelete: 'CASCADE'
      },
      idUsuario: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'id_usuario',
        references: {
          model: 'usuario',
          key: 'id_usuario'
        },
        onDelete: 'SET NULL'
      },
      idEstado: { 
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'id_estado', 
        references: {
          model: 'estado',
          key: 'id_estado' 
        },
        onDelete: 'RESTRICT' 
      },
      idServicio: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'id_servicio',
        references: {
          model: 'servicio',
          key: 'id_servicio'
        },
        onDelete: 'SET NULL'
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

    // DEPRECADO: La asociación con Empleado fue reemplazada por una asociación con Usuario.
    // // Una Cita es atendida por un Empleado.
    // Cita.belongsTo(models.Empleado, {
    //   foreignKey: 'idEmpleado',
    //   as: 'empleado'
    // });

    // Una Cita puede estar basada en una Novedad de horario.
    Cita.belongsTo(models.Novedad, {
      foreignKey: 'idNovedad',
      as: 'novedad'
    });

    // Una Cita es atendida por un Usuario (empleado).
    Cita.belongsTo(models.Usuario, {
      foreignKey: 'idUsuario',
      as: 'empleado' // Se mantiene el alias 'empleado' para consistencia
    });

    // Una Cita tiene un Estado.
    Cita.belongsTo(models.Estado, {
      foreignKey: 'idEstado',
      as: 'estadoDetalle'
    });

    // Una Cita tiene un Servicio principal.
    Cita.belongsTo(models.Servicio, {
      foreignKey: 'idServicio',
      as: 'servicioPrincipal'
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