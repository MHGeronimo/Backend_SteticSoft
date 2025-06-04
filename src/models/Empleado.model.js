// src/models/Empleado.model.js
"use strict";

module.exports = (sequelize, DataTypes) => {
  const Empleado = sequelize.define(
    "Empleado",
    {
      idEmpleado: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idempleado",
      },
      nombre: { type: DataTypes.STRING(100), field: "nombre" }, // Ajustado en tu archivo original a STRING(100)
      tipoDocumento: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "tipodocumento",
      },
      numeroDocumento: {
        type: DataTypes.STRING(45),
        allowNull: false,
        unique: true,
        field: "numerodocumento",
      },
      fechaNacimiento: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "fechanacimiento",
      },
      celular: { type: DataTypes.STRING(45), field: "celular" },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: "estado",
      },
      // --- INICIO DE CAMBIO: Añadir idUsuario ---
      idUsuario: {
        type: DataTypes.INTEGER,
        allowNull: true, // O false, dependiendo si un empleado SIEMPRE debe tener una cuenta de usuario
        unique: true,    // Un usuario solo puede estar vinculado a un empleado
        field: "idusuario", // Nombre de la columna en la base de datos
        references: {
          model: "usuario", // Nombre de la tabla 'usuario'
          key: "idusuario",   // Nombre de la columna 'idusuario' en la tabla 'usuario'
        },
        // onDelete y onUpdate se definen a nivel de base de datos con ALTER TABLE o migración
      },
      // --- FIN DE CAMBIO ---
    },
    {
      tableName: "empleado",
      timestamps: false,
    }
  );

  Empleado.associate = (models) => {
    // --- INICIO DE CAMBIO: Añadir asociación con Usuario ---
    if (models.Usuario) {
      Empleado.belongsTo(models.Usuario, {
        foreignKey: { 
          name: "idUsuario", // Nombre de la FK en el modelo Empleado
          field: "idusuario"  // Nombre de la columna FK en la tabla empleado
        }, 
        as: "cuentaUsuario", // Alias para acceder al Usuario desde una instancia de Empleado
                              // Ejemplo: empleado.getCuentaUsuario()
      });
    }
    // --- FIN DE CAMBIO ---

    // Tus asociaciones existentes:
    if (models.Especialidad && models.EmpleadoEspecialidad) {
      Empleado.belongsToMany(models.Especialidad, {
        through: models.EmpleadoEspecialidad,
        foreignKey: { name: "idEmpleado", field: "idempleado" }, // Corregido: debe ser el campo de Empleado en la tabla intermedia
        otherKey: { name: "idEspecialidad", field: "idespecialidad" }, // Corregido: debe ser el campo de Especialidad
        as: "especialidades",
      });
    }
    if (models.Cita) {
      Empleado.hasMany(models.Cita, {
        // Asumiendo que en Cita.model.js, la FK a empleado es 'empleado_idempleado'
        // y el 'name' de la FK en Cita.model.js es 'Empleado_idEmpleado'
        foreignKey: { name: "Empleado_idEmpleado", field: "empleado_idempleado" }, // Mantenido como estaba en tu archivo
        as: "citasAtendidas", // Cambiado de 'citasAsignadas' si este alias es más preciso o el que usas
      });
    }
    if (models.Abastecimiento) {
      Empleado.hasMany(models.Abastecimiento, {
        // Asumiendo que en Abastecimiento.model.js, la FK es 'empleado_asignado'
        // y el 'name' de la FK es 'empleadoAsignado'
        foreignKey: { name: "empleadoAsignado", field: "empleado_asignado" }, // Mantenido como estaba
        as: "abastecimientosAsignados",
      });
    }
    if (models.Novedades) {
      Empleado.hasMany(models.Novedades, {
        // Asumiendo que en Novedades.model.js, la FK es 'empleado_idempleado'
        // y el 'name' de la FK es 'empleadoId'
        foreignKey: {
          name: "Empleado_idEmpleado", // Mantenido como estaba
          field: "empleado_idempleado", // Mantenido como estaba
          allowNull: false,
        },
        as: "novedadesHorario", // Cambiado de 'novedades' si este alias es más preciso o el que usas
      });
    }
  };

  return Empleado;
};