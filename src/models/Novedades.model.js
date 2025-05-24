module.exports = (sequelize, DataTypes) => {
  const Novedades = sequelize.define(
    "Novedades",
    {
      idNovedades: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idnovedades",
      },
      diaSemana: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "diasemana",
      },
      horaInicio: {
        type: DataTypes.TIME,
        allowNull: false,
        field: "horainicio",
      },
      horaFin: {
        type: DataTypes.TIME,
        allowNull: false,
        field: "horafin",
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      empleadoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "Empleado_idEmpleado", 
        references: {
          model: "Empleado",
          key: "idEmpleado",
        },
      },
    },
    {
      tableName: "Novedades",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["Empleado_idEmpleado", "diasemana"], 
        },
      ],
    }
  );

  Novedades.associate = (models) => {
    Novedades.belongsTo(models.Empleado, {
      foreignKey: { name: "empleadoId", field: "Empleado_idEmpleado" }, 
      as: "empleado",
    });
  };

  return Novedades;
};
