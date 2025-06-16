'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('compra_x_producto', {
      id_compra_x_producto: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_compra: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'compra',
          key: 'id_compra',
        },
        // onUpdate: 'CASCADE' removed
        onDelete: 'CASCADE',
      },
      id_producto: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'producto',
          key: 'id_producto',
        },
        // onUpdate: 'CASCADE' removed
        onDelete: 'RESTRICT',
      },
      cantidad: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1 // Added default value
      },
      valor_unitario: { // Renamed from precio_unitario_compra
        type: Sequelize.DECIMAL(12, 2), // Adjusted precision
        allowNull: false,
        defaultValue: 0.00 // Added default value
      }
      // subtotal_linea field removed
    });
    // addIndex calls removed
    // Unique constraint 'unique_compra_producto' also removed as per instruction to remove if not in SQL script
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('compra_x_producto');
  }
};
