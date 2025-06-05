// src/models/Permisos.model.js
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Permisos extends Model {
    static associate(models) {
      Permisos.belongsToMany(models.Rol, {
        through: 'PermisosXRol',
        foreignKey: 'idPermiso',
        otherKey: 'idRol',
        as: 'roles' // Alias para acceder a los roles de un permiso
      });
    }
  }
  Permisos.init({
    idPermiso: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
    modelName: 'Permisos',
    tableName: 'permisos',
    timestamps: false,
  });
  return Permisos;
};