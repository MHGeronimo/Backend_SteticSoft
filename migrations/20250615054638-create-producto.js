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
        type: Sequelize.STRING(100), // Adjusted from STRING(255)
        allowNull: false
      },
      descripcion: { // This field is kept as it's common for products, though not explicitly in the adjustment list.
        type: Sequelize.TEXT,
        allowNull: true
      },
      precio: { // Renamed from precio_venta and adjusted
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      // precio_compra field removed
      existencia: { // Renamed from stock and adjusted
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      id_categoria_producto: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'categoria_producto',
          key: 'id_categoria_producto',
        },
        // onUpdate: 'CASCADE' removed
        onDelete: 'RESTRICT',
      },
      // id_proveedor field removed
      // codigo_barras field removed
      stock_minimo: { // Added
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      stock_maximo: { // Added
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0 // Script had DEFAULT 0, allowNull: false is a reasonable assumption
      },
      imagen: { // Added
        type: Sequelize.STRING(255),
        allowNull: true
      },
      imagen_public_id: { // Added for Cloudinary support
        type: Sequelize.STRING(255),
        allowNull: true
      },
      estado: { // This field is kept as it's common and often expected.
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      vida_util_dias: { // Added for product lifecycle management
        type: Sequelize.INTEGER,
        allowNull: true
      },
      tipo_uso: { // Added for product classification
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'Externo'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('producto');
  }
};
