// src/models/Novedad.model.js  <-- Se recomienda renombrar el archivo
'use strict';

module.exports = (sequelize, DataTypes) => {
  // El nombre del modelo debe ser singular: Novedad
  const Novedad = sequelize.define(
    'Novedad',
    {
      // Propiedad en JS: idNovedad -> Columna en BD: id_novedad
      idNovedad: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id_novedad'
      },
      // Propiedad en JS: fechaInicio -> Columna en BD: fecha_inicio
      fechaInicio: {
        type: DataTypes.DATEONLY, // Usar DATEONLY para fechas sin hora
        allowNull: false,
        field: 'fecha_inicio'
      },
      // Propiedad en JS: fechaFin -> Columna en BD: fecha_fin
      fechaFin: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'fecha_fin'
      },
      // Propiedad en JS: horaInicio -> Columna en BD: hora_inicio
      horaInicio: {
        type: DataTypes.TIME,
        allowNull: false,
        field: 'hora_inicio'
      },
      // Propiedad en JS: horaFin -> Columna en BD: hora_fin
      horaFin: {
        type: DataTypes.TIME,
        allowNull: false,
        field: 'hora_fin'
      },
      dias: {
        type: DataTypes.JSONB,
        allowNull: false,
        field: 'dias'
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: 'estado'
      }
    },
    {
      // Nombre exacto de la tabla en la base de datos
      tableName: 'novedades',
      timestamps: false
    }
  );

  // --- Definición de la Relación Muchos a Muchos ---
  Novedad.associate = (models) => {
    // Una Novedad puede estar asignada a muchos Usuarios (Empleados)
    // a través de la tabla de unión 'novedad_empleado'.
    Novedad.belongsToMany(models.Usuario, {
      through: 'NovedadEmpleado', // Nombre del modelo de la tabla de unión
      foreignKey: 'id_novedad',   // Clave foránea en la tabla de unión que apunta a Novedad
      otherKey: 'id_usuario',     // Clave foránea en la tabla de unión que apunta a Usuario
      as: 'empleados'             // Alias para acceder a los empleados desde una novedad
    });
  };

  return Novedad;
};