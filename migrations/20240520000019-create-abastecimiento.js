'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('abastecimiento', {
      id_abastecimiento: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      cantidad: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      id_producto: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'producto',
          key: 'id_producto'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      fecha_ingreso: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_DATE')
      },
      esta_agotado: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      razon_agotamiento: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      fecha_agotamiento: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      estado: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      id_usuario: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'usuario',
          key: 'id_usuario'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('abastecimiento');
  }
};
