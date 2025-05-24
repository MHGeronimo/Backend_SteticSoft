module.exports = (sequelize, DataTypes) => {
  const Proveedor = sequelize.define(
    "Proveedor",
    {
      idProveedor: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idproveedor",
      },
      nombre: {
        type: DataTypes.STRING(45),
      },
      tipo: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      tipoDocumento: {
        type: DataTypes.TEXT,
        field: "tipodocumento",
      },
      numeroDocumento: {
        type: DataTypes.STRING(45),
        field: "numerodocumento",
      },
      nitEmpresa: {
        type: DataTypes.STRING(45),
        unique: true,
        field: "nit_empresa",
      },
      telefono: {
        type: DataTypes.STRING(45),
      },
      correo: {
        type: DataTypes.STRING(45),
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "Proveedor",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["nombre", "tipo"], 
        },
      ],
    }
  );

  Proveedor.associate = (models) => {
    Proveedor.hasMany(models.Compra, {
      foreignKey: { name: "proveedorId", field: "Proveedor_idProveedor" }, 
      as: "compras",
    });
  };

  return Proveedor;
};
