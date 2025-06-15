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
      nombre: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      configuracion: {
        type: Sequelize.TEXT, // Could be Sequelize.JSON if dialect supports it well
        allowNull: true
      },
      estado: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('dashboard');
  }
};
