'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('servicio_x_cita', {
      id_servicio_x_cita: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
      id_cita: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'cita',
          key: 'id_cita'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      }
    }, {
      indexes: [
        {
          unique: true,
          fields: ['id_servicio', 'id_cita'],
          name: 'servicio_x_cita_unique_constraint'
        }
      ]
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('servicio_x_cita');
  }
};
