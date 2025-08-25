'use strict';
 
module.exports = (sequelize, DataTypes) => {
  const CategoriaProducto = sequelize.define(
    "CategoriaProducto",
    {
      idCategoriaProducto: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "id_categoria_producto",
      },
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        field: "nombre",
      },
      descripcion: {
        type: DataTypes.TEXT,
        field: "descripcion",
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: "estado",
      },
    },
    {
      tableName: "categoria_producto",
      timestamps: false,
    }
  );

  CategoriaProducto.associate = (models) => {
    CategoriaProducto.hasMany(models.Producto, {
      foreignKey: "idCategoriaProducto",
      as: "productos",
    });
  };

  return CategoriaProducto;
};