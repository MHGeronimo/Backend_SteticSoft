'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('historial_cambios_rol', {
      id_historial: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
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
      id_usuario_modifico: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'usuario',
          key: 'id_usuario'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      campo_modificado: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      valor_anterior: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      valor_nuevo: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      fecha_cambio: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW 
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('historial_cambios_rol');
  }
};