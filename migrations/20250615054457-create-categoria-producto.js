'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('categoria_producto', {
      id_categoria_producto: {
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
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      vida_util_dias: { // Added
        type: Sequelize.INTEGER,
        allowNull: true
      },
      tipo_uso: { // Added
        type: Sequelize.STRING(10),
        allowNull: false
        // CHECK constraint for tipo_uso IN ('Interno', 'Externo') is omitted as per instructions
      },
      estado: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('categoria_producto');
  }
};
