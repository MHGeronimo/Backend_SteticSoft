'use strict';
/** @type {import('sequelize-cli').Migration} */
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
        type: Sequelize.STRING(100),
        allowNull: false
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      existencia: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      precio: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.00
      },
      stock_minimo: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      stock_maximo: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      imagen: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      imagen_public_id: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      estado: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      vida_util_dias: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      tipo_uso: {
        type: Sequelize.STRING(10),
        allowNull: false
      },
      id_categoria_producto: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'categoria_producto',
          key: 'id_categoria_producto'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('producto');
  }
};
