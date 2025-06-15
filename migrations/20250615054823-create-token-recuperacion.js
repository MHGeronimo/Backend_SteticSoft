'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('token_recuperacion', {
      id_token: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      token: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      id_usuario: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuario',
          key: 'id_usuario',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      fecha_expiracion: {
        type: Sequelize.DATE,
        allowNull: false
      },
      utilizado: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      createdAt: { // Added for tracking when the token was created
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
      // updatedAt is generally not needed for tokens as they are typically not updated
    });
    // Adding index on id_usuario for faster lookups of tokens per user
    await queryInterface.addIndex('token_recuperacion', ['id_usuario']);
    // Adding index on the token itself for faster lookups
    await queryInterface.addIndex('token_recuperacion', ['token']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('token_recuperacion');
    // Indexes are dropped automatically when table is dropped
  }
};
