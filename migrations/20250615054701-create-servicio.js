'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('servicio', {
      id_servicio: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nombre: {
        type: Sequelize.STRING(100), // Adjusted from STRING(255)
        allowNull: false,
        unique: true // Added unique constraint
      },
      descripcion: { // This field is kept as it's common for services.
        type: Sequelize.TEXT,
        allowNull: true
      },
      precio: {
        type: Sequelize.DECIMAL(12, 2), // Adjusted precision
        allowNull: false,
        defaultValue: 0.00 // Added default value
      },
      duracion_estimada_min: { // Renamed from duracion_estimada
        type: Sequelize.INTEGER,
        allowNull: true
      },
      id_categoria_servicio: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'categoria_servicio',
          key: 'id_categoria_servicio',
        },
        // onUpdate: 'CASCADE' removed
        onDelete: 'RESTRICT',
      },
      id_especialidad: { // Added
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'especialidad', // Name of the target table
          key: 'id_especialidad',   // Name of the target column
        },
        onDelete: 'RESTRICT' // onUpdate defaults to RESTRICT or NO ACTION
      },
      estado: { // This field is kept as it's common for services.
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('servicio');
  }
};
