'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('usuario', {
      id_usuario: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      correo: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      contrasena: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      id_rol: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'rol',
          key: 'id_rol'
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
    await queryInterface.dropTable('usuario');
  }
};
