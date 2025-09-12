'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('permisos_x_rol', {
      id_rol: {
        type: Sequelize.INTEGER,
        allowNull: false,
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

    // Add composite primary key
    await queryInterface.addConstraint('permisos_x_rol', {
      fields: ['id_rol', 'id_permiso'],
      type: 'primary key',
      name: 'permisos_x_rol_pkey'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('permisos_x_rol');
  }
};
