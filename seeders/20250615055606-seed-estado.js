'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Note: IDs are hardcoded as per subtask instructions based on SQL.
    // Ensure these IDs do not conflict if auto-increment has already created other IDs,
    // or that the table is reset before seeding if these are meant to be the first/only entries.
    // The migration for 'estado' defined id_estado as autoIncrement.
    // Forcing IDs here can lead to issues if not handled carefully (e.g., by resetting sequence).
    // However, following instruction to replicate SQL's specific IDs.

    const estados = [
      { id_estado: 1, nombre_estado: 'En proceso' },
      { id_estado: 2, nombre_estado: 'Pendiente' },
      { id_estado: 3, nombre_estado: 'Completado' },
      { id_estado: 4, nombre_estado: 'Cancelado' }
    ];
    await queryInterface.bulkInsert('estado', estados, {});
  },

  async down(queryInterface, Sequelize) {
    // Deleting all, or could specify IDs if needed.
    await queryInterface.bulkDelete('estado', null, {});
  }
};
