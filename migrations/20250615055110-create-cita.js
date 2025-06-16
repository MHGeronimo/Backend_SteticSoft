'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cita', {
      id_cita: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_cliente: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'cliente',
          key: 'id_cliente',
        },
        // onUpdate: 'CASCADE' removed
        onDelete: 'CASCADE',
      },
      id_empleado: { // Renamed from id_empleado_asignado
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'empleado',
          key: 'id_empleado',
        },
        // onUpdate: 'CASCADE' removed
        onDelete: 'SET NULL',
      },
      fecha_hora: { // Renamed from fecha_hora_cita
        type: Sequelize.DATE,
        allowNull: false
      },
      // duracion_estimada_total field removed
      id_estado: { // Renamed from id_estado_cita
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'estado',
          key: 'id_estado',
        },
        // onUpdate: 'CASCADE' removed
        onDelete: 'RESTRICT',
      },
      // notas_cliente field removed
      // notas_empleado field removed
      estado: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      }
    });
    // addIndex calls removed (assuming FKs create sufficient indexes or these are not high-traffic queries)
    // If specific queries are slow, indexes can be added back selectively.
    // e.g. await queryInterface.addIndex('cita', ['fecha_hora']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('cita');
  }
};
