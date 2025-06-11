// src/models/ServicioXCita.model.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const ServicioXCita = sequelize.define(
    'ServicioXCita',
    {
      idServicioXCita: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id_servicio_x_cita' 
      },
      idServicio: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'id_servicio', 
        references: {
          model: 'servicio',
          key: 'id_servicio' 
        },
        onDelete: 'CASCADE' 
      },
      idCita: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'id_cita', 
        references: {
          model: 'cita',
          key: 'id_cita' 
        },
        onDelete: 'CASCADE' 
      }
    },
    {
      tableName: 'servicio_x_cita', 
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ['id_servicio', 'id_cita'] 
        }
      ]
    }
  );

  ServicioXCita.associate = (models) => {
    // Indica que cada registro de 'ServicioXCita' pertenece a un único 'Servicio'.
    ServicioXCita.belongsTo(models.Servicio, { foreignKey: "idServicio" });

    // Indica que cada registro de 'ServicioXCita' pertenece a una única 'Cita'.
    ServicioXCita.belongsTo(models.Cita, { foreignKey: "idCita" });
  };

  return ServicioXCita;
};