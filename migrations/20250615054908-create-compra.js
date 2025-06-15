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
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // Don't delete proveedor if compras are linked
      },
      id_empleado: { // Employee who registered or managed the purchase
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'empleado',
          key: 'id_empleado',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL', // If employee is deleted, keep purchase record
      },
      fecha_compra: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      total_compra: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      descripcion_compra: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      numero_factura_proveedor: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      // Instead of a string, it would be better to use an FK to 'estado' table
      // For now, let's use a string as per initial thought, can be refactored.
      estado_compra_info: { // e.g., "Pedido", "Recibido", "Pagado"
        type: Sequelize.STRING(50),
        allowNull: true
      },
      // General status of the record itself (active/inactive)
      estado: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      }
      // Timestamps (createdAt, updatedAt) can be added if needed for auditing
      // createdAt: {
      //   allowNull: false,
      //   type: Sequelize.DATE,
      //   defaultValue: Sequelize.NOW
      // },
      // updatedAt: {
      //   allowNull: false,
      //   type: Sequelize.DATE,
      //   defaultValue: Sequelize.NOW
      // }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('compra');
  }
};
