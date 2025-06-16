'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('novedades', {
      id_novedad: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      dia_semana: { // 0=Domingo, 6=Sábado
        type: Sequelize.INTEGER,
        allowNull: false
        // CHECK constraint (dia_semana BETWEEN 0 AND 6) se omite aquí, añadir manualmente si es crítico.
      },
      hora_inicio: {
        type: Sequelize.TIME,
        allowNull: false
      },
      hora_fin: {
        type: Sequelize.TIME,
        allowNull: false
      },
      estado: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      id_empleado: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'empleado',
          key: 'id_empleado',
        },
        onDelete: 'CASCADE' // onUpdate se omite para default
      }
    });
    // Añadir restricción UNIQUE para (id_empleado, dia_semana)
    await queryInterface.addConstraint('novedades', {
      fields: ['id_empleado', 'dia_semana'],
      type: 'unique',
      name: 'novedades_id_empleado_dia_semana_unique'
    });
  },
  async down(queryInterface, Sequelize) {
    // Need to remove constraint before dropping table
    await queryInterface.removeConstraint('novedades', 'novedades_id_empleado_dia_semana_unique');
    await queryInterface.dropTable('novedades');
  }
};
