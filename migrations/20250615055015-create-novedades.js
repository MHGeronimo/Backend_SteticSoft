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
      titulo: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      tipo_novedad: { // E.g., "Alerta Stock", "Mantenimiento", "Promocion"
        type: Sequelize.STRING(50),
        allowNull: true
      },
      id_usuario_creador: { // User who created this novedad (optional)
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'usuario',
          key: 'id_usuario',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      fecha_publicacion: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      fecha_expiracion: {
        type: Sequelize.DATE,
        allowNull: true
      },
      estado: { // General status of the novedad (active/archived)
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      // Specific to certain types of 'novedades' like alerts
      leido_por_admin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: true // May not apply to all novedad types
      }
      // Timestamps (createdAt, updatedAt) are implicitly handled by Sequelize
      // if not specified in model with timestamps: false.
      // For migrations, it's good to be explicit if needed, or rely on model defaults.
      // Since other tables omit them, I'll omit for consistency here.
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('novedades');
  }
};
