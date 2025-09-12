'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('producto_x_venta', {
      id_producto_x_venta: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      cantidad: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      valor_unitario: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.00
      },
      id_producto: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'producto',
          key: 'id_producto'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      id_venta: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'venta',
          key: 'id_venta'
        },
        onDelete: 'CASCADE',
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
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('producto_x_venta');
  }
};
