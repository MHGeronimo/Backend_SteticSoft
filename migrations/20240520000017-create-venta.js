'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('venta', {
      id_venta: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      fecha: {
        type: Sequelize.DATEONLY,
        defaultValue: Sequelize.literal('CURRENT_DATE')
      },
      total: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.00
      },
      iva: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.00
      },
      id_cliente: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'cliente',
          key: 'id_cliente'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      id_servicio: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'servicio',
          key: 'id_servicio'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      id_producto: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'producto',
          key: 'id_producto'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      id_dashboard: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'dashboard',
          key: 'id_dashboard'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      id_estado: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'estado',
          key: 'id_estado'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('venta');
  }
};
