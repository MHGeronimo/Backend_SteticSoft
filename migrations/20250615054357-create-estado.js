'use strict';
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
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      ambito: { // To categorize states, e.g., 'USER_STATUS', 'ORDER_STATUS'
        type: Sequelize.STRING(50),
        allowNull: true
      }
      // No 'estado' column for the 'estado' table itself usually.
      // Timestamps false assumed based on other tables.
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('estado');
  }
};
