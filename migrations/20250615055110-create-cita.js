'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cita', {
      id_cita: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_cliente: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'cliente',
          key: 'id_cliente',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // If client is deleted, their appointments are also deleted
      },
      id_empleado_asignado: { // Employee assigned to the appointment
        type: Sequelize.INTEGER,
        allowNull: true, // Might be assigned later or not applicable for some services
        references: {
          model: 'empleado',
          key: 'id_empleado',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL', // If employee is deleted, appointment remains but unassigned
      },
      fecha_hora_cita: {
        type: Sequelize.DATE, // Stores both date and time
        allowNull: false
      },
      duracion_estimada_total: { // In minutes
        type: Sequelize.INTEGER,
        allowNull: true
      },
      id_estado_cita: { // FK to 'estado' table for appointment status
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'estado', // Assumes an 'estado' table with different status types
          key: 'id_estado',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // Don't delete a status if it's being used by appointments
      },
      notas_cliente: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      notas_empleado: { // Internal notes
        type: Sequelize.TEXT,
        allowNull: true
      },
      estado: { // General status of the appointment record (e.g. for soft delete)
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      }
      // Timestamps (createdAt, updatedAt) for auditing when the appointment was booked/modified.
      // createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      // updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });
    await queryInterface.addIndex('cita', ['id_cliente']);
    await queryInterface.addIndex('cita', ['id_empleado_asignado']);
    await queryInterface.addIndex('cita', ['fecha_hora_cita']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('cita');
  }
};
