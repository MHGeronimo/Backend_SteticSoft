'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('abastecimiento', 'id_usuario', {
      type: Sequelize.INTEGER,
      allowNull: true, // Se permite null temporalmente para no romper los datos existentes
      references: {
        model: 'usuario',
        key: 'id_usuario'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Se actualiza para establecer un valor por defecto a los registros existentes
    await queryInterface.sequelize.query(`
      UPDATE abastecimiento SET id_usuario = (
        SELECT id_usuario FROM usuario LIMIT 1
      ) WHERE id_usuario IS NULL
    `);

    // Se cambia a NOT NULL una vez que los datos existentes tienen un valor
    await queryInterface.changeColumn('abastecimiento', 'id_usuario', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    await queryInterface.removeColumn('abastecimiento', 'empleado_asignado');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('abastecimiento', 'empleado_asignado', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.removeColumn('abastecimiento', 'id_usuario');
  }
};
