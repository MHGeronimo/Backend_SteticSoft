'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Add new columns
      await queryInterface.addColumn('cita', 'fecha', {
        type: Sequelize.DATEONLY,
        allowNull: false,
      }, { transaction });

      await queryInterface.addColumn('cita', 'hora_inicio', {
        type: Sequelize.TIME,
        allowNull: false,
      }, { transaction });

      await queryInterface.addColumn('cita', 'precio_total', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      }, { transaction });

      // Remove old columns
      await queryInterface.removeColumn('cita', 'fecha_hora', { transaction });
      await queryInterface.removeColumn('cita', 'id_estado', { transaction });

      // Rename the old 'estado' column to avoid conflict, then remove it
      // This is a safe way to handle this, in case there's a need to rollback
      await queryInterface.renameColumn('cita', 'estado', 'estado_old', { transaction });
      await queryInterface.removeColumn('cita', 'estado_old', { transaction });

      // Add the new 'estado' column
      await queryInterface.addColumn('cita', 'estado', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Activa',
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Revert changes
      await queryInterface.removeColumn('cita', 'fecha', { transaction });
      await queryInterface.removeColumn('cita', 'hora_inicio', { transaction });
      await queryInterface.removeColumn('cita', 'precio_total', { transaction });
      await queryInterface.removeColumn('cita', 'estado', { transaction });

      await queryInterface.addColumn('cita', 'fecha_hora', {
        type: Sequelize.DATE,
        allowNull: false,
      }, { transaction });

      await queryInterface.addColumn('cita', 'id_estado', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'estado',
          key: 'id_estado'
        }
      }, { transaction });

      await queryInterface.addColumn('cita', 'estado', {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
