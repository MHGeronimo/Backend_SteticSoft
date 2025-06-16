'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('producto_x_venta', {
      id_producto_x_venta: {
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
        // onUpdate: 'CASCADE' removed
        onDelete: 'RESTRICT',
      },
      id_venta: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'venta',
          key: 'id_venta',
        },
        // onUpdate: 'CASCADE' removed
        onDelete: 'CASCADE',
      },
      cantidad: { // Renamed from cantidad_vendida
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1 // Added default
      },
      valor_unitario: { // Renamed from precio_unitario_venta
        type: Sequelize.DECIMAL(12, 2), // Adjusted precision
        allowNull: false,
        defaultValue: 0.00 // Added default
      },
      // subtotal_linea field removed
      // iva_linea field removed
      id_dashboard: { // Added
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'dashboard',
          key: 'id_dashboard',
        },
        onDelete: 'SET NULL' // onUpdate defaults to RESTRICT/NO ACTION
      }
    });

    // Unique constraint 'unique_producto_venta' removed as per instructions
    // addIndex calls removed
  },
  async down(queryInterface, Sequelize) {
    // If 'unique_producto_venta' constraint were to be kept, it should be removed here first.
    // await queryInterface.removeConstraint('producto_x_venta', 'unique_producto_venta');
    await queryInterface.dropTable('producto_x_venta');
  }
};
