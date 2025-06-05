// src/models/Rol.model.js
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Rol extends Model {
    static associate(models) {
      Rol.belongsToMany(models.Permisos, {
        through: 'PermisosXRol', // La tabla intermedia
        foreignKey: 'idRol',
        otherKey: 'idPermiso',
        as: 'permisos' // Alias para acceder a los permisos de un rol
      });

      Rol.hasMany(models.Usuario, {
        foreignKey: 'idRol'
      });
    }
  }
  Rol.init({
    idRol: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true
    },
    descripcion: DataTypes.TEXT,
    estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Rol',
    tableName: 'rol', // Asegúrate que el nombre de la tabla sea correcto
    timestamps: false,
  });
  return Rol;
};