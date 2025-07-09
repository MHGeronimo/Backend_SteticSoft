'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('producto', 'vida_util_dias', {
      type: Sequelize.INTEGER,
      allowNull: true, // Coincide con el modelo y el SQL (no es NOT NULL)
    });

    await queryInterface.addColumn('producto', 'tipo_uso', {
      type: Sequelize.STRING(255), // Coincide con el SQL
      allowNull: false,
      defaultValue: 'Venta Directa', // Coincide con el SQL
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('producto', 'vida_util_dias');
    await queryInterface.removeColumn('producto', 'tipo_uso');
  }
};
