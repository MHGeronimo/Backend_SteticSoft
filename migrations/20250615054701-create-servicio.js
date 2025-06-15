'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('servicio', {
      id_servicio: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nombre: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      precio: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      duracion_estimada: { // Duration in minutes, for example
        type: Sequelize.INTEGER,
        allowNull: true
      },
      id_categoria_servicio: {
        type: Sequelize.INTEGER,
        allowNull: false, // Assuming a service must belong to a category
        references: {
          model: 'categoria_servicio',
          key: 'id_categoria_servicio',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // Don't delete category if services are using it
      },
      estado: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('servicio');
  }
};
