// src/models/Empleado.model.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Empleado = sequelize.define(
    'Empleado',
    {
      idEmpleado: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id_empleado'
      },
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'nombre'
      },
      apellido: { 
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'apellido',
      },
      correo: { 
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
        field: 'correo',
      },
      telefono: { 
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'telefono',
      },
      tipoDocumento: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'tipo_documento'
      },
      numeroDocumento: {
        type: DataTypes.STRING(45),
        allowNull: false,
        unique: true,
        field: 'numero_documento'
      },
      fechaNacimiento: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'fecha_nacimiento'
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: 'estado'
      },
      idUsuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        field: 'id_usuario',
        references: {
          model: 'usuario',
          key: 'id_usuario'
        },
        onDelete: 'RESTRICT'
      }
    },
    {
      tableName: 'empleado',
      timestamps: false
    }
  );

  Empleado.associate = (models) => {
    // Un Empleado pertenece a una cuenta de Usuario.
    Empleado.belongsTo(models.Usuario, {
      foreignKey: "idUsuario", // ✅ CORRECCIÓN: Clave foránea explícita
      targetKey: "idUsuario", // ✅ BUENA PRÁCTICA: Especificar la columna de destino en el modelo Usuario.
      as: "usuario",
    });

    // // Un Empleado puede tener muchas Especialidades.
    // Empleado.belongsToMany(models.Especialidad, {
    //   through: 'empleado_especialidad',
    //   foreignKey: 'id_empleado',
    //   otherKey: 'id_especialidad',
    //   as: 'especialidades'
    // });

    // Un Empleado puede tener muchas Citas asignadas.
    Empleado.hasMany(models.Cita, {
      foreignKey: 'idEmpleado', // Se refiere al atributo 'idEmpleado' en el modelo Cita.
      as: 'citasAtendidas'
    });

    // Un Empleado puede tener muchas Novedades (ausencias, vacaciones, etc.)
    // La relación es Muchos a Muchos a través de la tabla NovedadEmpleado,
    // y se vincula mediante el id_usuario del empleado.
    Empleado.belongsToMany(models.Novedad, {
      through: models.NovedadEmpleado,
      foreignKey: 'id_usuario', // Columna en NovedadEmpleado que se refiere al Usuario
      sourceKey: 'idUsuario',   // Atributo en el modelo Empleado que contiene el id_usuario
      otherKey: 'id_novedad',   // Columna en NovedadEmpleado que se refiere a la Novedad
      as: 'novedadesHorario'   // Alias para la relación
    });
  };

  return Empleado;
};