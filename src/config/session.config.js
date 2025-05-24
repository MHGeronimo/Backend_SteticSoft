// src/config/session.config.js
const session = require("express-session");
const pgSessionStore = require("connect-pg-simple")(session);
const pool = require("./database.config"); // El pool de pg
const { SESSION_SECRET, IS_PRODUCTION, NODE_ENV } = require("./env.config");

if (!SESSION_SECRET) {
  console.error(
    "❌ ERROR: SESSION_SECRET no está definida en las variables de entorno. La sesión no funcionará de forma segura."
  );
  // En un entorno real, podrías querer detener la aplicación:
  // process.exit(1);
}

const sessionMiddleware = session({
  store: new pgSessionStore({
    pool: pool, // Pool de conexión PostgreSQL
    tableName: "user_sessions", // Nombre de la tabla de sesiones (o el que prefieras)
    createTableIfMissing: true, // Crea la tabla si no existe (útil en desarrollo)
  }),
  secret: SESSION_SECRET,
  resave: false, // No guardar la sesión si no hay cambios
  saveUninitialized: false, // No guardar sesiones nuevas vacías
  cookie: {
    secure: IS_PRODUCTION, // true en producción (requiere HTTPS)
    httpOnly: true, // Ayuda a prevenir ataques XSS
    maxAge: 1000 * 60 * 60 * 24, // Duración del cookie (ej: 1 día)
    sameSite: IS_PRODUCTION ? "lax" : "lax", // 'lax' es un buen default. Considera 'strict'.
    // Para desarrollo sin HTTPS, 'none' con secure:false podría ser necesario si hay iframes o cross-site,
    // pero 'lax' es más seguro por defecto.
  },
  // Si estás detrás de un proxy (como Nginx o Heroku), podrías necesitar esto:
  // proxy: IS_PRODUCTION ? true : false,
  // name: 'steticsoft.sid', // Nombre personalizado para el cookie de sesión (opcional)
});

module.exports = sessionMiddleware;
