// DEPRECADO: El modelo EmpleadoEspecialidad y la tabla 'empleado_especialidad' fueron eliminados según el schema steticsoft_schema.sql.
/*
'use strict';

module.exports = (sequelize, DataTypes) => {
  const EmpleadoEspecialidad = sequelize.define(
    'EmpleadoEspecialidad',
    {
      idEmpleado: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        field: 'id_empleado', 
        references: {
          model: 'empleado',
          key: 'id_empleado' 
        },
        onDelete: 'CASCADE'
      },
      idEspecialidad: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        field: 'id_especialidad', 
        references: {
          model: 'especialidad',
          key: 'id_especialidad' 
        },
        onDelete: 'CASCADE'
      }
    },
    {
      tableName: 'empleado_especialidad', 
      timestamps: false
    }
  );

  EmpleadoEspecialidad.associate = (models) => {
    EmpleadoEspecialidad.belongsTo(models.Empleado, { foreignKey: 'idEmpleado' });
    EmpleadoEspecialidad.belongsTo(models.Especialidad, { foreignKey: 'idEspecialidad' });
  };

  return EmpleadoEspecialidad;
};
*/