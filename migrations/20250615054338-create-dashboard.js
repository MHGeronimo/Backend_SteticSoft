'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('dashboard', {
      id_dashboard: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nombre_dashboard: { // Renamed from nombre
        type: Sequelize.STRING(100),
        allowNull: false
        // unique: true // Removed
      },
      fecha_creacion: { // Added
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
      // configuracion field removed
      // estado field removed
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('dashboard');
  }
};
