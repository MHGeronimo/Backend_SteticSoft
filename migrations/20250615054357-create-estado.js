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
        type: Sequelize.STRING(45), // Adjusted length
        allowNull: false,
        unique: true // Assuming this should be kept as per general good practice for names, though SQL script does not explicitly state unique for `nombre_estado`
      }
      // descripcion field removed
      // ambito field removed
      // No 'estado' column for the 'estado' table itself usually.
      // Timestamps false assumed based on other tables.
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('estado');
  }
};
