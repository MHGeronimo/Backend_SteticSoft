'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('novedad_empleado', {
      id_novedad: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'novedades',
          key: 'id_novedad'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      id_usuario: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuario',
          key: 'id_usuario'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      }
    });

    await queryInterface.addConstraint('novedad_empleado', {
      fields: ['id_novedad', 'id_usuario'],
      type: 'primary key',
      name: 'pk_novedad_empleado'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('novedad_empleado');
  }
};
