'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Agregar campo imagen_public_id a la tabla producto
    await queryInterface.addColumn('producto', 'imagen_public_id', {
      type: Sequelize.STRING(255),
      allowNull: true,
      field: 'imagen_public_id'
    });

    // Agregar campo imagen_public_id a la tabla servicio
    await queryInterface.addColumn('servicio', 'imagen_public_id', {
      type: Sequelize.STRING(255),
      allowNull: true,
      field: 'imagen_public_id'
    });
  },

  async down(queryInterface, Sequelize) {
    // Eliminar campo imagen_public_id de la tabla producto
    await queryInterface.removeColumn('producto', 'imagen_public_id');
    
    // Eliminar campo imagen_public_id de la tabla servicio
    await queryInterface.removeColumn('servicio', 'imagen_public_id');
  }
};
