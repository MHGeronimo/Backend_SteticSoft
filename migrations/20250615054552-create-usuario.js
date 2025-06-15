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
      nombre_usuario: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      contrasena: { // Storing hashed password
        type: Sequelize.STRING(255),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      id_rol: {
        type: Sequelize.INTEGER,
        allowNull: false, // Assuming a user must have a role
        references: {
          model: 'rol', // Name of the target table
          key: 'id_rol',  // Name of the target column
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      ultimo_login: {
        type: Sequelize.DATE,
        allowNull: true
      },
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
