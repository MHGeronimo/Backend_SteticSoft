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
        allowNull: true
      },
      email: { // Professional email, could be different from user account email
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      direccion: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      id_usuario: { // Link to a user account, assuming an employee MUST be a user
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true, // Each user can only be one employee
        references: {
          model: 'usuario',
          key: 'id_usuario',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // If user is deleted, employee record is also deleted
      },
      cargo: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      fecha_contratacion: {
        type: Sequelize.DATEONLY, // Just the date, not time
        allowNull: true
      },
      estado: {
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
