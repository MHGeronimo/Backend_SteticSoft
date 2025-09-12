'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Agregar el permiso faltante MODULO_VENTAS_CLIENTE
    await queryInterface.bulkInsert('permisos', [
      {
        nombre: 'MODULO_VENTAS_CLIENTE',
        descripcion: 'Permite a un cliente acceder a funcionalidades de ventas.',
        estado: true
      }
    ], {
      ignoreDuplicates: true // Evita errores si el permiso ya existe
    });
  },

  async down(queryInterface, Sequelize) {
    // Eliminar el permiso agregado
    await queryInterface.bulkDelete('permisos', {
      nombre: 'MODULO_VENTAS_CLIENTE'
    });
  }
};
