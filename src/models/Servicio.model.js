// src/models/Servicio.model.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Servicio = sequelize.define(
    'Servicio',
    {
      idServicio: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id_servicio'
      },
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        field: 'nombre'
      },
      descripcion: {
        type: DataTypes.TEXT,
        field: 'descripcion'
      },
      precio: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
        field: 'precio'
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: 'estado'
      },
      idCategoriaServicio: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'id_categoria_servicio',
        references: {
          model: 'categoria_servicio',
          key: 'id_categoria_servicio'
        },
        onDelete: 'RESTRICT'
      }
    },
    {
      tableName: 'servicio',
      timestamps: false
    }
  );

  Servicio.associate = (models) => {
    // Un Servicio pertenece a una CategoriaServicio.
    Servicio.belongsTo(models.CategoriaServicio, {
      foreignKey: 'idCategoriaServicio',
      as: 'categoria'
    });

    // Un Servicio puede estar incluido en muchas Citas.
    Servicio.belongsToMany(models.Cita, {
      through: 'servicio_x_cita',
      foreignKey: 'id_servicio',   
      otherKey: 'id_cita',       
      as: 'citas'
    });

    // Un Servicio puede ser parte de muchas Ventas.
    Servicio.belongsToMany(models.Venta, {
      through: 'venta_x_servicio',
      foreignKey: 'id_servicio',  
      otherKey: 'id_venta',       
      as: 'ventas'
    });
  };

  return Servicio;
};