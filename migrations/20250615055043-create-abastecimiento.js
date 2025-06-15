'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('abastecimiento', {
      id_abastecimiento: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_producto: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'producto',
          key: 'id_producto',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // Don't delete product if stock entries exist
      },
      id_compra: { // Optional: link to a specific purchase order
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'compra',
          key: 'id_compra',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      id_empleado_registra: { // Employee who registered this stock entry
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'empleado',
          key: 'id_empleado',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      cantidad_ingresada: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      fecha_ingreso: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      precio_compra_unitario: { // Cost of product for this specific batch
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      lote: { // Batch number, if applicable
        type: Sequelize.STRING(100),
        allowNull: true
      },
      fecha_vencimiento_lote: { // Expiry date for this batch, if applicable
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      notas: {
        type: Sequelize.TEXT,
        allowNull: true
      }
      // No general 'estado' column, as this is a transactional record.
      // Timestamps (createdAt, updatedAt) could be added for auditing.
    });
    await queryInterface.addIndex('abastecimiento', ['id_producto']);
    await queryInterface.addIndex('abastecimiento', ['id_compra']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('abastecimiento');
  }
};
