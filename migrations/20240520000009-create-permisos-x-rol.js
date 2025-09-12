'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('permisos_x_rol', {
      id_rol: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'rol',
          key: 'id_rol'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      id_permiso: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'permisos',
          key: 'id_permiso'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      asignado_por: {
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
    await queryInterface.dropTable('permisos_x_rol');
  }
};
