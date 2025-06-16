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
      nombre: { // Renamed from nombre_empresa
        type: Sequelize.STRING(100),
        allowNull: false
      },
      tipo: { // Added
        type: Sequelize.STRING(50),
        allowNull: false
      },
      tipo_documento: { // Added
        type: Sequelize.STRING(50),
        allowNull: true
      },
      numero_documento: { // Added
        type: Sequelize.STRING(45),
        allowNull: true // SQL script does not specify UNIQUE for this directly
      },
      nit_empresa: { // Renamed from nit_o_rut
        type: Sequelize.STRING(45),
        unique: true,
        allowNull: true
      },
      telefono: {
        type: Sequelize.STRING(20),
        allowNull: false // unique:true removed
      },
      correo: { // Renamed from email
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
        // validate: { isEmail: true } removed
      },
      direccion: {
        type: Sequelize.TEXT,
        allowNull: false // Was allowNull: true
      },
      nombre_persona_encargada: { // Renamed from nombre_contacto
        type: Sequelize.STRING(100),
        allowNull: true
      },
      telefono_persona_encargada: { // Added
        type: Sequelize.STRING(20),
        allowNull: true
      },
      email_persona_encargada: { // Added
        type: Sequelize.STRING(100),
        allowNull: true
      },
      estado: { // This field was in the original migration but not in the new requirements.
                // However, the SQL script for 'proveedor' DOES have an 'estado' field.
                // Keeping it as per the original script for 'proveedor' seems appropriate.
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      }
    });

    await queryInterface.addConstraint('proveedor', {
      fields: ['nombre', 'tipo'],
      type: 'unique',
      name: 'proveedor_nombre_tipo_unique_constraint'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('proveedor', 'proveedor_nombre_tipo_unique_constraint');
    await queryInterface.dropTable('proveedor');
  }
};
