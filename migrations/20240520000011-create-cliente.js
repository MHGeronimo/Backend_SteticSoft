'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cliente', {
      id_cliente: {
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
      correo: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      telefono: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      tipo_documento: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      numero_documento: {
        type: Sequelize.STRING(45),
        allowNull: false,
        unique: true
      },
      fecha_nacimiento: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      direccion: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      estado: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      id_usuario: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'usuario',
          key: 'id_usuario'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('cliente');
  }
};
