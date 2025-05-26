// src/config/database.config.js
const { Pool } = require("pg");
const {
  DATABASE_URL,
  DB_USER,
  DB_HOST,
  DB_NAME,
  DB_PASS,
  DB_PORT,
  IS_PRODUCTION,
} = require("./env.config");

let pgPoolConfig;

if (IS_PRODUCTION && DATABASE_URL) {
  console.log("🟢 pg.Pool configurado para producción usando DATABASE_URL.");
  pgPoolConfig = {
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // <-- ESTABLECER EXPLÍCITAMENTE PARA RENDER
    },
    max: 10, // Ajusta según los límites de tu plan de Render
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000, // Aumentado un poco para conexiones de producción
  };
} else {
  console.log(
    `🟢 pg.Pool configurado para ${
      IS_PRODUCTION ? "producción (variables individuales)" : "desarrollo"
    }.`
  );
  pgPoolConfig = {
    user: DB_USER,
    host: DB_HOST,
    database: DB_NAME,
    password: DB_PASS,
    port: DB_PORT,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
  if (IS_PRODUCTION) {
    // Si es producción pero sin DATABASE_URL (fallback)
    pgPoolConfig.ssl = {
      rejectUnauthorized: false, // <-- ESTABLECER EXPLÍCITAMENTE PARA RENDER
    };
  }
}

const pool = new Pool(pgPoolConfig);

pool.on("connect", () => {
  console.log("ℹ️ pg.Pool: Nuevo cliente conectado al pool de PostgreSQL.");
});
pool.on("error", (err, client) => {
  console.error(
    "❌ pg.Pool: Error inesperado en cliente inactivo del pool.",
    err
  );
});

module.exports = pool;
