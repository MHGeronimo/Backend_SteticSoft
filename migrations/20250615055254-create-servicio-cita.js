'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('servicio_x_cita', {
      id_servicio_x_cita: { // This surrogate PK is kept as per current structure
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_servicio: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'servicio',
          key: 'id_servicio',
        },
        // onUpdate: 'CASCADE' removed
        onDelete: 'CASCADE', // Changed from RESTRICT
      },
      id_cita: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'cita',
          key: 'id_cita',
        },
        // onUpdate: 'CASCADE' removed
        onDelete: 'CASCADE',
      }
      // id_empleado_realiza field removed
      // precio_servicio_en_cita field removed
      // duracion_servicio_real field removed
    });

    // Unique constraint to ensure a service is not added twice to the same appointment
    await queryInterface.addConstraint('servicio_x_cita', {
      fields: ['id_servicio', 'id_cita'],
      type: 'unique',
      name: 'unique_servicio_cita' // This name must be used in down method if removing
    });

    // addIndex calls for id_cita and id_empleado_realiza removed
  },
  async down(queryInterface, Sequelize) {
    // It's good practice to remove constraints before dropping the table in 'down'
    await queryInterface.removeConstraint('servicio_x_cita', 'unique_servicio_cita');
    await queryInterface.dropTable('servicio_x_cita');
  }
};
