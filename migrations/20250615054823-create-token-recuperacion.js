'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('token_recuperacion', {
      id_token_recuperacion: { // Renamed from id_token
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      token: {
        type: Sequelize.TEXT, // Changed from STRING(255)
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
        // onUpdate: 'CASCADE' removed
        onDelete: 'CASCADE',
      },
      fecha_expiracion: {
        type: Sequelize.DATE, // Kept as DATE as per instruction, SQL script might say TIMESTAMP
        allowNull: false
      }
      // utilizado field removed
      // createdAt field removed
      // updatedAt is generally not needed for tokens as they are typically not updated
    });
    // addIndex calls removed
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('token_recuperacion');
    // Indexes are dropped automatically when table is dropped
  }
};
