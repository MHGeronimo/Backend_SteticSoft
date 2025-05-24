module.exports = (sequelize, DataTypes) => {
  const Cliente = sequelize.define(
    "Cliente",
    {
      idCliente: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idcliente",
      },
      nombre: {
        type: DataTypes.STRING(45),
      },
      apellido: {
        type: DataTypes.STRING(45),
      },
      correo: {
        type: DataTypes.STRING(45),
      },
      telefono: {
        type: DataTypes.STRING(45),
      },
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
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      idUsuario: {
        type: DataTypes.INTEGER,
        unique: true,
        field: "idusuario",
        references: {
          model: "Usuario",
          key: "idUsuario",
        },
      },
    },
    {
      tableName: "Cliente",
      timestamps: false,
    }
  );

  Cliente.associate = (models) => {
    Cliente.belongsTo(models.Usuario, {
      foreignKey: { name: "idUsuario", field: "idusuario" },
      as: "usuario",
    });
    Cliente.hasMany(models.Venta, {
      foreignKey: { name: "clienteId", field: "Cliente_idCliente" },
      as: "ventas",
    });
    Cliente.hasMany(models.Cita, {
      foreignKey: { name: "clienteId", field: "Cliente_idCliente" },
      as: "citas",
    });
  };

  return Cliente;
};
