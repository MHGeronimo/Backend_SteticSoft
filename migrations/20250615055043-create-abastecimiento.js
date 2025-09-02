'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('abastecimiento', {
      id_abastecimiento: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_producto: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'producto',
          key: 'id_producto',
        },
        // onUpdate: 'CASCADE' removed
        onDelete: 'RESTRICT',
      },
      // id_compra field removed
      empleado_asignado: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      cantidad: { // Renamed from cantidad_ingresada
        type: Sequelize.INTEGER,
        allowNull: false
      },
      fecha_ingreso: { // Kept as it is common for this table
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      // precio_compra_unitario field removed
      // lote field removed
      // fecha_vencimiento_lote field removed
      // notas field removed
      esta_agotado: { // Added
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      razon_agotamiento: { // Added
        type: Sequelize.TEXT,
        allowNull: true
      },
      fecha_agotamiento: { // Added
        type: Sequelize.DATEONLY, // Script said DATE, using DATEONLY
        allowNull: true
      },
      estado: { // Added (for the record itself)
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      }
    });
    // addIndex for id_producto can be kept if high query volume on it
    await queryInterface.addIndex('abastecimiento', ['id_producto']);
    // id_compra index removed as field is removed
  },
  async down(queryInterface, Sequelize) {
    // await queryInterface.removeIndex('abastecimiento', ['id_producto']); // if you added it
    await queryInterface.dropTable('abastecimiento');
  }
};
