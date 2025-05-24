// tests/setup.js

// Cargar variables de entorno específicas para el entorno de prueba si es necesario
// Por ejemplo, si tienes un archivo .env.test
// require('dotenv').config({ path: '.env.test' });

// O establecer NODE_ENV a 'test' si no se hace a través de scripts de package.json
process.env.NODE_ENV = "test";

// Aquí podrías configurar una base de datos de prueba, mocks globales, etc.
// Ejemplo:
// const db = require('../src/models'); // Ajusta la ruta
// beforeAll(async () => {
//   // Conectar a la base de datos de prueba
//   // await db.sequelize.authenticate();
//   // Limpiar tablas o aplicar migraciones de prueba
//   // await db.sequelize.sync({ force: true }); // ¡Cuidado con force: true!
// });

// afterAll(async () => {
//   // Cerrar conexión a la base de datos de prueba
//   // await db.sequelize.close();
// });

console.log("🛠️ Entorno de prueba configurado (tests/setup.js).");
