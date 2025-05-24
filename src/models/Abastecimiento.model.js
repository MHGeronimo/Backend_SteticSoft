module.exports = (sequelize, DataTypes) => {
  const Abastecimiento = sequelize.define(
    "Abastecimiento",
    {
      idAbastecimiento: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idabastecimiento",
      },
      cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      productoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "Producto_idProducto", 
        references: {
          model: "Producto",
          key: "idProducto",
        },
      },
      fechaIngreso: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: "fecha_ingreso",
      },
      empleadoAsignado: {
        type: DataTypes.INTEGER,
        field: "empleado_asignado",
        references: {
          model: "Empleado",
          key: "idEmpleado",
        },
      },
      estaAgotado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: "esta_agotado",
      },
      razonAgotamiento: {
        type: DataTypes.TEXT,
        field: "razon_agotamiento",
      },
      fechaAgotamiento: {
        type: DataTypes.DATEONLY,
        field: "fecha_agotamiento",
      },
    },
    {
      tableName: "Abastecimiento",
      timestamps: false,
    }
  );

  Abastecimiento.associate = (models) => {
    Abastecimiento.belongsTo(models.Producto, {
      foreignKey: { name: "productoId", field: "Producto_idProducto" }, 
      as: "producto",
    });
    Abastecimiento.belongsTo(models.Empleado, {
      foreignKey: { name: "empleadoAsignado", field: "empleado_asignado" },
      as: "empleado",
    });
  };

  return Abastecimiento;
};
