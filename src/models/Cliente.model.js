// src/models/Cliente.model.js 
"use strict"; 

module.exports = (sequelize, DataTypes) => {
  const Cliente = sequelize.define(
    "Cliente",
    {
      idCliente: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "id_cliente", 
      },
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: "nombre",
      },
      apellido: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: "apellido",
      },
      correo: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
        field: "correo",
      },
      telefono: {
        type: DataTypes.STRING(20), 
        allowNull: false,
        field: "telefono",
      },
      tipoDocumento: {
        type: DataTypes.STRING(50), 
        allowNull: false,
        field: "tipo_documento", 
      },
      numeroDocumento: {
        type: DataTypes.STRING(45),
        allowNull: false,
        unique: true,
        field: "numero_documento", 
      },
      fechaNacimiento: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "fecha_nacimiento", 
      },
      direccion: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "direccion",
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: "estado",
      },
      idUsuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        field: "id_usuario", 
        references: {
          model: "usuario",
          key: "id_usuario", 
        },
        onDelete: "RESTRICT", // AÑADIDO: Política de integridad crítica.
      },
    },
    {
      tableName: "cliente",
      timestamps: false,
    }
  );

  Cliente.associate = (models) => {
    // Un Cliente pertenece a una cuenta de Usuario.
    Cliente.belongsTo(models.Usuario, {
      foreignKey: "idUsuario", // ✅ CORRECCIÓN: Clave foránea explícita
      targetKey: "idUsuario", // ✅ BUENA PRÁCTICA: Especificar la columna de destino en el modelo Usuario.
      as: "usuarioCuenta",
    });

    // Un Cliente puede tener muchas Ventas.
    Cliente.hasMany(models.Venta, {
      foreignKey: "idCliente", // Se refiere al atributo 'idCliente' en el modelo Venta.
      as: "ventas",
    });

    // Un Cliente puede tener muchas Citas.
    Cliente.hasMany(models.Cita, {
      foreignKey: "idCliente", // Se refiere al atributo 'idCliente' en el modelo Cita.
      as: "citas",
    });
  };

  return Cliente;
};
 