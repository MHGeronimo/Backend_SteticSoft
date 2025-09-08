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
    // Un Empleado (perfil) pertenece a una cuenta de Usuario.
    // Esta es la única asociación que este modelo necesita.
    Empleado.belongsTo(models.Usuario, {
      foreignKey: "idUsuario",
      as: "usuario",
    });

    // ✅ CORRECCIÓN: Se eliminaron las asociaciones con Cita y Novedad.
    // La lógica de negocio se manejará a través del modelo Usuario,
    // que es la entidad central para roles y relaciones.
  };

  return Empleado;
};

