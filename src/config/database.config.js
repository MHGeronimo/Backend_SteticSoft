// src/config/database.config.js
const { Pool } = require("pg");
const {
  DATABASE_URL, // Preferido para producción
  DB_USER,
  DB_HOST,
  DB_NAME,
  DB_PASS,
  DB_PORT,
  IS_PRODUCTION,
  DB_SSL_REQUIRED,
  DB_REJECT_UNAUTHORIZED,
} = require("./env.config");

let pgPoolConfig;

if (IS_PRODUCTION && DATABASE_URL) {
  console.log("🟢 pg.Pool configurado para producción usando DATABASE_URL.");
  pgPoolConfig = {
    connectionString: DATABASE_URL,
    ssl: {
      // Para Render, rejectUnauthorized: false es comúnmente necesario
      rejectUnauthorized:
        DB_REJECT_UNAUTHORIZED !== undefined ? DB_REJECT_UNAUTHORIZED : false,
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
} else {
  // Para desarrollo o si DATABASE_URL no está en producción
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
  if (IS_PRODUCTION && DB_SSL_REQUIRED) {
    // Si es producción pero sin DATABASE_URL, y SSL es requerido
    pgPoolConfig.ssl = {
      rejectUnauthorized:
        DB_REJECT_UNAUTHORIZED !== undefined ? DB_REJECT_UNAUTHORIZED : false,
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
