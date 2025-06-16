'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('empleado', {
      id_empleado: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nombre: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      apellido: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      telefono: {
        type: Sequelize.STRING(20),
        allowNull: false // Was true
      },
      correo: { // Renamed from email
        type: Sequelize.STRING(100),
        allowNull: false, // Was true
        unique: true
        // validate: { isEmail: true } removed
      },
      // direccion field removed
      id_usuario: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'usuario',
          key: 'id_usuario',
        },
        // onUpdate: 'CASCADE' removed
        onDelete: 'RESTRICT', // Changed from CASCADE
      },
      // cargo field removed
      // fecha_contratacion field removed
      tipo_documento: { // Added
        type: Sequelize.STRING(50),
        allowNull: false
      },
      numero_documento: { // Added
        type: Sequelize.STRING(45),
        allowNull: false,
        unique: true
      },
      fecha_nacimiento: { // Added
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      estado: { // This field is kept as it's common.
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('empleado');
  }
};
