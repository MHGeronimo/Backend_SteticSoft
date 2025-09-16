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
      // ✅ CAMBIO: 'fechaHora' se divide en 'fecha' y 'hora_inicio'
      fecha: {
        type: DataTypes.DATEONLY, // Corresponde a DATE en SQL
        allowNull: false,
        field: 'fecha'
      },
      hora_inicio: {
        type: DataTypes.TIME, // Corresponde a TIME en SQL
        allowNull: false,
        field: 'hora_inicio'
      },
      // ✅ NUEVO: Campo para el precio total
      precio_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: 'precio_total'
      },
      idCliente: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'id_cliente',
        references: { model: 'cliente', key: 'id_cliente' }
      },
      idUsuario: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'id_usuario',
        references: { model: 'usuario', key: 'id_usuario' }
      },
      idEstado: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5, // Valor por defecto para 'Activa'
        field: 'id_estado',
        references: { model: 'estado', key: 'id_estado' }
      },
      idNovedad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'id_novedad',
        references: { model: 'novedades', key: 'id_novedad' }
      }
    },
    {
      tableName: 'cita',
      timestamps: false
    }
  );

  Cita.associate = (models) => {
    Cita.belongsTo(models.Cliente, { foreignKey: 'idCliente', as: 'cliente' });
    Cita.belongsTo(models.Usuario, { foreignKey: 'idUsuario', as: 'empleado' });

    Cita.belongsTo(models.Estado, { foreignKey: 'idEstado', as: 'estadoDetalle' });

    Cita.belongsToMany(models.Servicio, {
      through: 'servicio_x_cita',
      foreignKey: 'id_cita',
      otherKey: 'id_servicio',
      as: 'serviciosProgramados'
    });
  };

  return Cita;
};