// src/config/database.config.js
const { Pool } = require("pg");
const {
  DB_USER,
  DB_HOST,
  DB_NAME,
  DB_PASS,
  DB_PORT,
  IS_PRODUCTION,
  // Variables de SSL para producción si son diferentes para el pool
} = require("./env.config");

const pgPoolConfig = {
  user: DB_USER,
  host: DB_HOST,
  database: DB_NAME,
  password: DB_PASS,
  port: DB_PORT,
  max: 10, // Número de clientes en el pool
  idleTimeoutMillis: 30000, // Cuánto tiempo un cliente puede estar inactivo antes de cerrarse
  connectionTimeoutMillis: 2000, // Cuánto tiempo esperar por una conexión antes de fallar
};

if (IS_PRODUCTION) {
  // Configuración SSL para pg.Pool en producción (ajustar según el proveedor)
  pgPoolConfig.ssl = {
    rejectUnauthorized: false, // ¡REVISAR CUIDADOSAMENTE PARA PRODUCCIÓN!
  };
  console.log("🟡 pg.Pool configurado para producción con SSL.");
} else {
  console.log("🟢 pg.Pool configurado para desarrollo.");
}

const pool = new Pool(pgPoolConfig);

pool.on("connect", () => {
  console.log("ℹ️ Nuevo cliente conectado al pool de PostgreSQL (pg.Pool)");
});

pool.on("error", (err, client) => {
  console.error(
    "❌ Error inesperado en cliente inactivo del pool (pg.Pool)",
    err
  );
  // process.exit(-1); // Considera si un error del pool debe detener la aplicación
});

// Prueba de conexión opcional
// pool.query('SELECT NOW()', (err, res) => {
//   if (err) {
//     console.error('❌ Error al conectar con pg.Pool:', err);
//   } else {
//     console.log('✅ pg.Pool conectado exitosamente a PostgreSQL.');
//   }
// });

module.exports = pool;
