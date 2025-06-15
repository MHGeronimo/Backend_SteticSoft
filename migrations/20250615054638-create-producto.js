'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('producto', {
      id_producto: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nombre: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      precio_venta: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      precio_compra: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true // Purchase price might not always be available or relevant
      },
      stock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      id_categoria_producto: {
        type: Sequelize.INTEGER,
        allowNull: false, // Assuming a product must belong to a category
        references: {
          model: 'categoria_producto',
          key: 'id_categoria_producto',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // Don't delete category if products are using it
      },
      id_proveedor: {
        type: Sequelize.INTEGER,
        allowNull: true, // Product might not have a supplier or it's sourced from multiple
        references: {
          model: 'proveedor',
          key: 'id_proveedor',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL', // If supplier is deleted, set FK to null
      },
      codigo_barras: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true
      },
      estado: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('producto');
  }
};
