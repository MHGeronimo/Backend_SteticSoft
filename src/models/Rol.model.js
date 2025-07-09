// src/models/Rol.model.js
"use strict";

module.exports = (sequelize, DataTypes) => {
  const Rol = sequelize.define(
    "Rol",
    {
      idRol: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "id_rol",
      },
      nombre: {
        type: DataTypes.STRING(50),
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
      tipoPerfil: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "tipo_perfil",
        validate: {
          isIn: [["CLIENTE", "EMPLEADO", "NINGUNO"]],
        },
      },
    },
    {
      tableName: "rol",
      timestamps: false,
    }
  );

  Rol.associate = (models) => {
    // Un rol puede tener muchos usuarios.
    Rol.hasMany(models.Usuario, {
      foreignKey: "idRol", // Se refiere al atributo en el modelo Usuario.
      as: "usuarios",
    });

    // Un rol puede tener muchos permisos a través de la tabla de unión.
    Rol.belongsToMany(models.Permisos, {
      through: "permisos_x_rol", 
      foreignKey: "id_rol", // Clave foránea en la tabla de unión.
      otherKey: "id_permiso", // La otra clave foránea en la tabla de unión.
      as: "permisos",
    });
  };

  return Rol;
};
