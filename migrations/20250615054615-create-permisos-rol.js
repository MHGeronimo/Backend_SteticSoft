'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('permisos_x_rol', {
      id_permiso: {
        type: Sequelize.INTEGER,
        primaryKey: true, // Part of composite primary key
        allowNull: false,
        references: {
          model: 'permisos', // Name of the target table
          key: 'id_permiso',   // Name of the target column
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // If a permission is deleted, remove the link
      },
      id_rol: {
        type: Sequelize.INTEGER,
        primaryKey: true, // Part of composite primary key
        allowNull: false,
        references: {
          model: 'rol',    // Name of the target table
          key: 'id_rol',     // Name of the target column
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // If a role is deleted, remove the link
      },
      estado: { // Optional: to enable/disable a specific permission for a role
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      }
      // No separate ID for the join table itself is strictly needed if using composite PK.
      // Timestamps are generally not used for join tables.
    });

    // If you need to ensure the combination of id_permiso and id_rol is unique
    // (which is implicitly handled by them being composite primary keys),
    // no separate unique constraint is needed.
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('permisos_x_rol');
  }
};
