"use strict";

module.exports = (sequelize, DataTypes) => {
  const HistorialCambiosRol = sequelize.define(
    "HistorialCambiosRol",
    {
      idHistorial: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: "id_historial",
      },
      idRol: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "id_rol",
        references: {
          model: "rol",
          key: "id_rol",
        },
        onDelete: "CASCADE",
      },
      idUsuarioModifico: {
        type: DataTypes.INTEGER,
        allowNull: true, // CORREGIDO: La BD permite nulos (ON DELETE SET NULL)
        field: "id_usuario_modifico",
        references: {
          model: "usuario",
          key: "id_usuario",
        },
        onDelete: "SET NULL",
      },
      campoModificado: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: "campo_modificado",
      },
      valorAnterior: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "valor_anterior",
      },
      valorNuevo: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "valor_nuevo",
      },
      fechaCambio: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: "fecha_cambio",
      },
    },
    {
      tableName: "historial_cambios_rol",
      timestamps: false,
    }
  );

  HistorialCambiosRol.associate = (models) => {
    HistorialCambiosRol.belongsTo(models.Rol, {
      foreignKey: "idRol",
      as: "rol",
    });
    HistorialCambiosRol.belongsTo(models.Usuario, {
      foreignKey: "idUsuarioModifico",
      as: "usuario",
    });
    HistorialCambiosRol.belongsTo(models.Usuario, {
      foreignKey: "id_usuario_modifico",
      as: "usuarioModificador", // Este es el alias correcto que usaremos
    });
  };

  return HistorialCambiosRol;
};
