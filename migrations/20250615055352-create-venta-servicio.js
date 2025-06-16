'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('venta_x_servicio', {
      id_venta_x_servicio: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_venta: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'venta',
          key: 'id_venta',
        },
        // onUpdate: 'CASCADE' removed
        onDelete: 'CASCADE',
      },
      id_servicio: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'servicio',
          key: 'id_servicio',
        },
        // onUpdate: 'CASCADE' removed
        onDelete: 'RESTRICT',
      },
      valor_servicio: { // Renamed from precio_unitario_servicio_venta
        type: Sequelize.DECIMAL(12, 2), // Adjusted precision
        allowNull: false,
        defaultValue: 0.00 // Added default
      },
      // id_empleado_presto_servicio field removed
      // cantidad field removed
      // subtotal_linea field removed
      // iva_linea field removed
      id_cita: { // Added
        type: Sequelize.INTEGER,
        allowNull: true, // A service sale might not always originate from a Cita
        references: {
          model: 'cita',
          key: 'id_cita',
        },
        onDelete: 'SET NULL' // onUpdate defaults to RESTRICT/NO ACTION
      }
    });

    // Unique constraint 'unique_venta_servicio' removed as per instructions
    // addIndex calls removed
  },
  async down(queryInterface, Sequelize) {
    // If 'unique_venta_servicio' constraint were to be kept, it should be removed here first.
    // await queryInterface.removeConstraint('venta_x_servicio', 'unique_venta_servicio');
    await queryInterface.dropTable('venta_x_servicio');
  }
};
