module.exports = (sequelize, DataTypes) => {
  const Servicio = sequelize.define(
    "Servicio",
    {
      idServicio: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "idservicio",
      },
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      descripcion: {
        type: DataTypes.TEXT,
      },
      precio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      duracionEstimada: {
        type: DataTypes.INTEGER,
        field: "duracion_estimada",
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      categoriaServicioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "Categoria_servicio_idCategoriaServicio", 
        references: {
          model: "Categoria_servicio",
          key: "idCategoriaServicio",
        },
      },
      especialidadId: {
        type: DataTypes.INTEGER,
        field: "Especialidad_idEspecialidad", 
        references: {
          model: "Especialidad",
          key: "idEspecialidad",
        },
      },
    },
    {
      tableName: "Servicio",
      timestamps: false,
    }
  );

  Servicio.associate = (models) => {
    Servicio.belongsTo(models.CategoriaServicio, {
      foreignKey: {
        name: "categoriaServicioId",
        field: "Categoria_servicio_idCategoriaServicio",
      },
      as: "categoriaServicio",
    });
    Servicio.belongsTo(models.Especialidad, {
      foreignKey: {
        name: "especialidadId",
        field: "Especialidad_idEspecialidad",
      }, 
      as: "especialidad",
    });
    Servicio.hasMany(models.ServicioXCita, {
      foreignKey: { name: "servicioId", field: "Servicio_idServicio" }, 
      as: "citasConServicio",
    });
    Servicio.hasMany(models.VentaXServicio, {
      foreignKey: { name: "servicioId", field: "Servicio_idServicio" }, 
      as: "ventasDeServicio",
    });
  };

  return Servicio;
};
