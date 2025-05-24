// src/models/Servicio.model.js
"use strict";

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
        field: "nombre",
      },
      descripcion: { type: DataTypes.TEXT, field: "descripcion" },
      precio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
        field: "precio",
      }, // Ajustado
      duracionEstimada: { type: DataTypes.INTEGER, field: "duracion_estimada" },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: "estado",
      }, // Ajustado
      categoriaServicioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "categoria_servicio_idcategoriaservicio",
        references: { model: "categoria_servicio", key: "idcategoriaservicio" },
        onDelete: "RESTRICT", // Reflejando DDL
        onUpdate: "CASCADE",
      },
      especialidadId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "especialidad_idespecialidad",
        references: { model: "especialidad", key: "idespecialidad" },
        onDelete: "SET NULL", // Reflejando DDL
        onUpdate: "CASCADE",
      },
    },
    {
      tableName: "servicio",
      timestamps: false,
    }
  );

  Servicio.associate = (models) => {
    if (models.CategoriaServicio) {
      Servicio.belongsTo(models.CategoriaServicio, {
        foreignKey: {
          name: "categoriaServicioId",
          field: "categoria_servicio_idcategoriaservicio",
          allowNull: false,
        },
        as: "categoriaServicio",
      });
    }
    if (models.Especialidad) {
      Servicio.belongsTo(models.Especialidad, {
        foreignKey: {
          name: "especialidadId",
          field: "especialidad_idespecialidad",
        },
        as: "especialidadRequerida",
      });
    }
    if (models.Cita && models.ServicioXCita) {
      Servicio.belongsToMany(models.Cita, {
        through: models.ServicioXCita,
        foreignKey: { name: "servicioId", field: "servicio_idservicio" },
        otherKey: { name: "citaId", field: "cita_idcita" },
        as: "citasDondeSeIncluye", // Alias ajustado
      });
    }
    if (models.Venta && models.VentaXServicio) {
      Servicio.belongsToMany(models.Venta, {
        through: models.VentaXServicio,
        foreignKey: { name: "servicioId", field: "servicio_idservicio" },
        otherKey: { name: "ventaId", field: "venta_idventa" },
        as: "ventasDondeSeIncluye",
      });
    }
  };

  return Servicio;
};
