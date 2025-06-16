'use strict';

// It's good practice to use a hashing library for passwords.
// For seeding, we assume the password hash is pre-generated.
// const bcrypt = require('bcrypt'); // Example if you were to hash here

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get id_rol for 'Administrador'
    const adminRolResult = await queryInterface.sequelize.query(
      "SELECT id_rol FROM rol WHERE nombre = 'Administrador'",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (!adminRolResult || adminRolResult.length === 0) {
      throw new Error("No se encontró el rol 'Administrador'. Asegúrese de que el seeder de roles se haya ejecutado.");
    }
    const adminRolId = adminRolResult[0].id_rol;

    // Pre-hashed password for 'password123' (example, use a strong unique password)
    // The hash from the prompt: $2b$10$oJOJM36rGGzZftagNM1vWOxLaW96cPBRk.DhhvSvv8gneGTzFIJhO
    // This hash corresponds to "123456789"
    const adminPasswordHash = '$2b$10$oJOJM36rGGzZftagNM1vWOxLaW96cPBRk.DhhvSvv8gneGTzFIJhO';

    await queryInterface.bulkInsert('usuario', [{
      // nombre_usuario: 'admin', // ELIMINADO
      correo: 'mrgerito@gmail.com', // Renamed from email
      contrasena: adminPasswordHash,
      id_rol: adminRolId,
      // ultimo_login: null, // ELIMINADO
      estado: true,
      // createdAt and updatedAt will be handled by Sequelize if timestamps are enabled in model
      // If not, and you need them:
      // createdAt: new Date(),
      // updatedAt: new Date()
    }], {});
  },

  async down(queryInterface, Sequelize) {
    // Delete the specific admin user
    // Ensure this matches the new field name 'correo' if it's used as the condition
    await queryInterface.bulkDelete('usuario', { correo: 'mrgerito@gmail.com' }, {});
  }
};
