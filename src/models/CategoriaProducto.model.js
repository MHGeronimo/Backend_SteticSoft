// src/models/CategoriaProducto.model.js 
'use strict';

module.exports = (sequelize, DataTypes) => {
  const CategoriaProducto = sequelize.define(
    'CategoriaProducto',
    {
      idCategoriaProducto: { 
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id_categoria_producto' 
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
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: 'estado'
      },
      vidaUtilDias: {
        type: DataTypes.INTEGER,
        field: 'vida_util_dias'
      },
      tipoUso: {
        type: DataTypes.STRING(10),
        allowNull: false,
        field: 'tipo_uso',
        validate: {
          isIn: [['Interno', 'Externo']]
        }
      }
    },
    {
      tableName: 'categoria_producto',
      timestamps: false
    }
  );

  CategoriaProducto.associate = (models) => {
    // Una CategoriaProducto puede tener muchos Productos.
    CategoriaProducto.hasMany(models.Producto, {
      foreignKey: 'idCategoriaProducto', // Se refiere al atributo en el modelo Producto.
      as: 'productos'
    });
  };

  return CategoriaProducto;
};