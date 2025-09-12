'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('compra_x_producto', {
      id_compra_x_producto: {
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
      id_compra: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'compra',
          key: 'id_compra'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
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
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('compra_x_producto');
  }
};
