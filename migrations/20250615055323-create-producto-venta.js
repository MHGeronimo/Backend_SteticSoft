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
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // Prevent deleting product if it's in sales history
      },
      id_venta: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'venta',
          key: 'id_venta',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // If sale is deleted, its line items are also deleted
      },
      cantidad_vendida: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      precio_unitario_venta: { // Price of product at the time of this sale
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      subtotal_linea: { // cantidad_vendida * precio_unitario_venta (before line item taxes)
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      iva_linea: { // Tax specifically for this line item, if applicable
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0.00
      }
      // Timestamps
      // createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      // updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    // Unique constraint to ensure a product is not added twice to the same sale
    // (updates should modify quantity of existing line item)
    await queryInterface.addConstraint('producto_x_venta', {
      fields: ['id_producto', 'id_venta'],
      type: 'unique',
      name: 'unique_producto_venta'
    });

    await queryInterface.addIndex('producto_x_venta', ['id_venta']);
    await queryInterface.addIndex('producto_x_venta', ['id_producto']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('producto_x_venta');
  }
};
