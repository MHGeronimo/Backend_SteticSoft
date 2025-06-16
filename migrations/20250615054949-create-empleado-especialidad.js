'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('empleado_especialidad', {
      id_empleado: {
        type: Sequelize.INTEGER,
        primaryKey: true, // Part of composite primary key
        allowNull: false,
        references: {
          model: 'empleado',
          key: 'id_empleado',
        },
        // onUpdate: 'CASCADE' removed
        onDelete: 'CASCADE', // If employee is deleted, this link is removed
      },
      id_especialidad: {
        type: Sequelize.INTEGER,
        primaryKey: true, // Part of composite primary key
        allowNull: false,
        references: {
          model: 'especialidad',
          key: 'id_especialidad',
        },
        // onUpdate: 'CASCADE' removed
        onDelete: 'CASCADE', // If especialidad is deleted, this link is removed
      }
      // fecha_asignacion field removed
      // estado field removed
      // Timestamps (createdAt, updatedAt) are generally not needed for join tables unless auditing changes to the link itself.
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('empleado_especialidad');
  }
};
