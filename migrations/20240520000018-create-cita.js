'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cita', {
      id_cita: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      fecha: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      hora_inicio: {
        type: Sequelize.TIME,
        allowNull: false
      },
      precio_total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      estado: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: 'Activa'
      },
      id_cliente: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'cliente',
          key: 'id_cliente'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      id_usuario: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'usuario',
          key: 'id_usuario'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      id_estado: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'estado',
          key: 'id_estado'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      id_novedad: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'novedades',
          key: 'id_novedad'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('cita');
  }
};
