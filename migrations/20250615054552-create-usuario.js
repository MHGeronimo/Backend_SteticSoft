'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('usuario', {
      id_usuario: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      // nombre_usuario field removed
      contrasena: { // Storing hashed password
        type: Sequelize.TEXT, // Changed from STRING(255)
        allowNull: false
      },
      correo: { // Renamed from email
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
        // validate: { isEmail: true } removed
      },
      id_rol: {
        type: Sequelize.INTEGER,
        allowNull: false, // Assuming a user must have a role
        references: {
          model: 'rol', // Name of the target table
          key: 'id_rol',  // Name of the target column
        },
        // onUpdate: 'CASCADE' removed to use DB default
        onDelete: 'RESTRICT',
      },
      // ultimo_login field removed
      estado: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      }
      // Timestamps (createdAt, updatedAt) are not added here,
      // assuming models have timestamps: false or specific needs.
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('usuario');
  }
};
