'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('servicio_x_cita', {
      id_servicio_x_cita: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_servicio: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'servicio',
          key: 'id_servicio',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // Prevent deleting a service if it's part of appointment history
      },
      id_cita: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'cita',
          key: 'id_cita',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // If appointment is deleted, these service links are also deleted
      },
      id_empleado_realiza: { // Employee who performed this specific service in the appointment
        type: Sequelize.INTEGER,
        allowNull: true, // May not be known or applicable
        references: {
          model: 'empleado',
          key: 'id_empleado',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      precio_servicio_en_cita: { // Price of service at the time of this appointment
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      duracion_servicio_real: { // Actual duration in minutes for this service in this appointment
        type: Sequelize.INTEGER,
        allowNull: true
      },
      // estado_servicio_cita: { // e.g., "Programado", "Completado", "Cancelado" - could be FK to estado table
      //   type: Sequelize.STRING(50),
      //   allowNull: true
      // }
      // Timestamps
      // createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      // updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    // Unique constraint to ensure a service is not added twice to the same appointment
    await queryInterface.addConstraint('servicio_x_cita', {
      fields: ['id_servicio', 'id_cita'],
      type: 'unique',
      name: 'unique_servicio_cita'
    });

    await queryInterface.addIndex('servicio_x_cita', ['id_cita']);
    await queryInterface.addIndex('servicio_x_cita', ['id_empleado_realiza']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('servicio_x_cita');
  }
};
