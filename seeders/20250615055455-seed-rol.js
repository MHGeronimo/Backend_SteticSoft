'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('rol', [
      {
        nombre: 'Administrador',
        descripcion: 'Acceso total al sistema y configuración.',
        estado: true,
        tipo_perfil: 'NINGUNO'
      },
      {
        nombre: 'Empleado',
        descripcion: 'Acceso a módulos operativos y de gestión designados.',
        estado: true,
        tipo_perfil: 'EMPLEADO'
      },
      {
        nombre: 'Cliente',
        descripcion: 'Acceso limitado para consulta de citas y datos personales.',
        estado: true,
        tipo_perfil: 'CLIENTE'
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    // This will delete all entries.
    await queryInterface.bulkDelete('rol', null, {});
  }
};
