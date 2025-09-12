'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('proveedor', {
      id_proveedor: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nombre: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      tipo: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      tipo_documento: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      numero_documento: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      nit_empresa: {
        type: Sequelize.STRING(45),
        allowNull: true,
        unique: true
      },
      telefono: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      correo: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      direccion: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      nombre_persona_encargada: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      telefono_persona_encargada: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      email_persona_encargada: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      estado: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    }, {
      indexes: [
        {
          unique: true,
          fields: ['nombre', 'tipo'],
          name: 'proveedor_nombre_tipo_unique_constraint'
        }
      ]
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('proveedor');
  }
};
