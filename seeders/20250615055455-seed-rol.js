'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('rol', [
      {
        nombre: 'Administrador',
        descripcion: 'Acceso total al sistema y configuración.',
        estado: true
        // id_rol will be auto-generated
      },
      {
        nombre: 'Empleado',
        descripcion: 'Acceso a módulos operativos y de gestión designados.',
        estado: true
      },
      {
        nombre: 'Cliente',
        descripcion: 'Acceso limitado para consulta de citas y datos personales.',
        estado: true
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    // This will delete all entries. If specific deletion is needed, add conditions.
    // Example: await queryInterface.bulkDelete('rol', { nombre: ['Administrador', 'Empleado', 'Cliente'] }, {});
    await queryInterface.bulkDelete('rol', null, {});
  }
};
