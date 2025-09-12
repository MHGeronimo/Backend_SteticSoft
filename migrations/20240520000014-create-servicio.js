'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('servicio', {
      id_servicio: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nombre: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      precio: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      imagen: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      imagen_public_id: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      id_categoria_servicio: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'categoria_servicio',
          key: 'id_categoria_servicio'
        },
        onDelete: 'RESTRICT',
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
    await queryInterface.dropTable('servicio');
  }
};
