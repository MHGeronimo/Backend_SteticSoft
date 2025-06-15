'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('venta', {
      id_venta: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_cliente: {
        type: Sequelize.INTEGER,
        allowNull: true, // Sale could be to an anonymous customer
        references: {
          model: 'cliente',
          key: 'id_cliente',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      id_empleado_atendio: { // Employee who processed the sale
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'empleado',
          key: 'id_empleado',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      id_cita: { // If the sale originated from an appointment
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'cita',
          key: 'id_cita',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL', // Sale record persists even if original cita is deleted
      },
      fecha_hora_venta: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      subtotal: {
        type: Sequelize.DECIMAL(12,2),
        allowNull: true // Or calculate on the fly, but good to store
      },
      iva: { // Or other taxes
        type: Sequelize.DECIMAL(12,2),
        allowNull: true,
        defaultValue: 0.00
      },
      total_venta: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      metodo_pago: { // E.g., "Efectivo", "Tarjeta Credito", "Transferencia"
        type: Sequelize.STRING(50),
        allowNull: true
      },
      id_estado_venta: { // FK to 'estado' table for sale status (e.g. "Pagada", "Anulada")
        type: Sequelize.INTEGER,
        allowNull: false, // This matches the model change: allowNull: false for idEstado
        references: {
          model: 'estado',
          key: 'id_estado',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      id_dashboard: { // Optional link to a daily dashboard summary
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'dashboard',
          key: 'id_dashboard',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      estado: { // General status of the sale record (e.g. for soft delete)
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      }
      // createdAt, updatedAt for auditing
      // createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      // updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });
    await queryInterface.addIndex('venta', ['id_cliente']);
    await queryInterface.addIndex('venta', ['id_empleado_atendio']);
    await queryInterface.addIndex('venta', ['id_cita']);
    await queryInterface.addIndex('venta', ['fecha_hora_venta']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('venta');
  }
};
