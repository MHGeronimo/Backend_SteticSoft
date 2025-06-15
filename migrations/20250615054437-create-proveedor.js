'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('proveedor', {
      id_proveedor: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nombre_empresa: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      nombre_contacto: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      telefono: {
        type: Sequelize.STRING(20),
        allowNull: true,
        unique: true
      },
      email: {
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
      nit_o_rut: { // Assuming NIT for Colombia or RUT for Chile, etc.
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true
      },
      estado: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('proveedor');
  }
};
