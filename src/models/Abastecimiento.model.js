// src/models/Abastecimiento.model.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Abastecimiento = sequelize.define(
    'Abastecimiento',
    {
      idAbastecimiento: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id_abastecimiento' 
      },
      cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'cantidad'
      },
      idProducto: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'id_producto', 
        references: {
          model: 'producto',
          key: 'id_producto' 
        },
        onDelete: 'RESTRICT'
      },
      fechaIngreso: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'fecha_ingreso'
      },
      idEmpleadoAsignado: { 
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'id_empleado_asignado', 
        references: {
          model: 'empleado',
          key: 'id_empleado' 
        },
        onDelete: 'SET NULL'
      },
      estaAgotado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        field: 'esta_agotado'
      },
      razonAgotamiento: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'razon_agotamiento'
      },
      fechaAgotamiento: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'fecha_agotamiento'
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: 'estado'
      }
    },
    {
      tableName: 'abastecimiento',
      timestamps: false
    }
  );

  Abastecimiento.associate = (models) => {
    // Un Abastecimiento pertenece a un Producto.
    Abastecimiento.belongsTo(models.Producto, {
      foreignKey: 'idProducto',
      as: 'producto'
    });

    // Un Abastecimiento es responsabilidad de un Empleado.
    Abastecimiento.belongsTo(models.Empleado, {
      foreignKey: 'idEmpleadoAsignado',
      as: 'empleado'
    });
  };

  return Abastecimiento;
};