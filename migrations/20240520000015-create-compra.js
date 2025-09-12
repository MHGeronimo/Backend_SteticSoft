'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('compra', {
      id_compra: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      fecha: {
        type: Sequelize.DATEONLY,
        defaultValue: Sequelize.literal('CURRENT_DATE')
      },
      total: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.00
      },
      iva: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.00
      },
      id_proveedor: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'proveedor',
          key: 'id_proveedor'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      id_dashboard: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'dashboard',
          key: 'id_dashboard'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      estado: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('compra');
  }
};
