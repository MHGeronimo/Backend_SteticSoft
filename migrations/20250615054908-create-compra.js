'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('compra', {
      id_compra: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_proveedor: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'proveedor',
          key: 'id_proveedor',
        },
        // onUpdate: 'CASCADE' removed
        onDelete: 'RESTRICT',
      },
      // id_empleado field removed
      fecha: { // Renamed from fecha_compra
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      total: { // Renamed from total_compra
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00 // Added default value
      },
      // descripcion_compra field removed
      // numero_factura_proveedor field removed
      // estado_compra_info field removed
      iva: { // Added
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      id_dashboard: { // Added
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'dashboard', // Name of the target table
          key: 'id_dashboard',   // Name of the target column
        },
        onDelete: 'SET NULL' // onUpdate defaults to RESTRICT or NO ACTION
      },
      estado: { // This field is kept.
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('compra');
  }
};
