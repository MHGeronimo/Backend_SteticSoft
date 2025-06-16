'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('venta', {
      id_venta: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_cliente: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'cliente',
          key: 'id_cliente',
        },
        // onUpdate: 'CASCADE' removed
        onDelete: 'RESTRICT', // Changed from SET NULL
      },
      // id_empleado_atendio field removed
      // id_cita field removed
      fecha: { // Renamed from fecha_hora_venta
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      // subtotal field removed
      iva: {
        type: Sequelize.DECIMAL(12,2),
        allowNull: false, // Was true
        defaultValue: 0.00
      },
      total: { // Renamed from total_venta
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00 // Added default value
      },
      // metodo_pago field removed
      id_estado: { // Renamed from id_estado_venta
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'estado',
          key: 'id_estado',
        },
        // onUpdate: 'CASCADE' removed
        onDelete: 'RESTRICT',
      },
      id_dashboard: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'dashboard',
          key: 'id_dashboard',
        },
        // onUpdate: 'CASCADE' removed
        onDelete: 'SET NULL',
      },
      estado: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      }
    });
    // addIndex calls removed
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('venta');
  }
};
