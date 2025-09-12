'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('venta_x_servicio', {
      id_venta_x_servicio: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      valor_servicio: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.00
      },
      id_servicio: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'servicio',
          key: 'id_servicio'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      id_cita: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'cita',
          key: 'id_cita'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      id_venta: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'venta',
          key: 'id_venta'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('venta_x_servicio');
  }
};
