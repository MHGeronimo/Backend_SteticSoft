'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('venta_x_servicio', {
      id_venta_x_servicio: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_venta: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'venta',
          key: 'id_venta',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // If sale is deleted, its service line items are also deleted
      },
      id_servicio: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'servicio',
          key: 'id_servicio',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // Prevent deleting service if it's in sales history
      },
      id_empleado_presto_servicio: { // Employee who performed the service for this sale
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'empleado',
          key: 'id_empleado',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      cantidad: { // Usually 1 for a service, but structure allows for more
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      precio_unitario_servicio_venta: { // Price of service at the time of this sale
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      subtotal_linea: { // cantidad * precio_unitario_servicio_venta
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      iva_linea: { // Tax for this service line item, if applicable
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0.00
      }
      // Timestamps
      // createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      // updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    // Unique constraint to ensure a service is not added twice to the same sale
    await queryInterface.addConstraint('venta_x_servicio', {
      fields: ['id_venta', 'id_servicio'],
      type: 'unique',
      name: 'unique_venta_servicio'
    });

    await queryInterface.addIndex('venta_x_servicio', ['id_venta']);
    await queryInterface.addIndex('venta_x_servicio', ['id_servicio']);
    await queryInterface.addIndex('venta_x_servicio', ['id_empleado_presto_servicio']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('venta_x_servicio');
  }
};
