// src/models/Usuario.model.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define(
    'Usuario',
    {
      idUsuario: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id_usuario' 
      },
      correo: {
        type: DataTypes.STRING(100), 
        allowNull: false,
        unique: true,
        field: 'correo',
        validate: {
          isEmail: true
        }
      },
      contrasena: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'contrasena'
      },
      idRol: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'id_rol', 
        references: {
          model: 'rol',
          key: 'id_rol'
        },
        onDelete: 'RESTRICT' 
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: 'estado'
      }
    },
    {
      tableName: 'usuario',
      timestamps: false
    }
  );

  Usuario.associate = (models) => {
    // Un Usuario pertenece a un Rol.
    Usuario.belongsTo(models.Rol, {
      foreignKey: 'idRol', // Se refiere al atributo 'idRol' en este mismo modelo.
      as: 'rol'
    });

    // Un Usuario tiene un perfil de Cliente (relación 1 a 1).
    Usuario.hasOne(models.Cliente, {
      foreignKey: 'idUsuario', // Se refiere al atributo 'idUsuario' en el modelo Cliente.
      as: 'clienteInfo'
    });

    // Un Usuario tiene un perfil de Empleado (relación 1 a 1).
    Usuario.hasOne(models.Empleado, {
      foreignKey: 'idUsuario', // Se refiere al atributo 'idUsuario' en el modelo Empleado.
      as: 'empleadoInfo'
    });

    // Un Usuario puede tener muchos Tokens de Recuperación.
    Usuario.hasMany(models.TokenRecuperacion, {
      foreignKey: 'idUsuario', // Se refiere al atributo 'idUsuario' en el modelo TokenRecuperacion.
      as: 'tokensRecuperacion'
    });

        // ✅ NUEVA ASOCIACIÓN: Un Usuario (Empleado) puede tener muchas Novedades.
    Usuario.belongsToMany(models.Novedad, {
      through: 'NovedadEmpleado',
      foreignKey: 'id_usuario',
      otherKey: 'id_novedad',
      as: 'novedades'
    });

    // Un Usuario (Empleado) puede registrar muchos Abastecimientos.
    Usuario.hasMany(models.Abastecimiento, {
      foreignKey: 'idUsuario',
      as: 'abastecimientos'
    });

    // Un usuario puede modificar roles, quedando registrado en el historial.
    Usuario.hasMany(models.HistorialCambiosRol, {
      foreignKey: "idUsuarioModifico",
      as: "modificacionesDeRol",
    });

    // Un usuario puede asignar permisos, quedando registrado en la tabla de unión.
    Usuario.hasMany(models.PermisosXRol, {
      foreignKey: "asignadoPor",
      as: "asignacionesDePermisos",
    });
  };

  return Usuario;
};