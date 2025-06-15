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
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // If the purchase is deleted, its line items are also deleted
      },
      id_producto: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'producto',
          key: 'id_producto',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // Prevent deleting a product if it's part of a purchase history
      },
      cantidad: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      precio_unitario_compra: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      subtotal_linea: { // cantidad * precio_unitario_compra
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      }
      // Timestamps (createdAt, updatedAt) can be useful for auditing line item changes
      // createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      // updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });
    // Index for faster lookup of products per purchase
    await queryInterface.addIndex('compra_x_producto', ['id_compra']);
    // Index for faster lookup of purchases for a product
    await queryInterface.addIndex('compra_x_producto', ['id_producto']);
    // Optional: Unique constraint on (id_compra, id_producto) if a product
    // should only appear once per purchase (updates modify quantity).
    // await queryInterface.addConstraint('compra_x_producto', {
    //   fields: ['id_compra', 'id_producto'],
    //   type: 'unique',
    //   name: 'unique_compra_producto'
    // });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('compra_x_producto');
  }
};
