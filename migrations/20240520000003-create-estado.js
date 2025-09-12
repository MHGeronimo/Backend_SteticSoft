'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('estado', {
      id_estado: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nombre_estado: {
        type: Sequelize.STRING(45),
        allowNull: false,
        unique: true
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('estado');
  }
};
