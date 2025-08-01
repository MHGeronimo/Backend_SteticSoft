// src/config/env.config.js
require("dotenv").config();

const env = process.env.NODE_ENV || "development";
const isProduction = env === "production";
const isDevelopment = env === "development";

// ✅ Lista de orígenes permitidos desde el .env o valores por defecto
const ALLOWED_ORIGINS = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((url) => url.trim())
  : isProduction
    ? []
    : ["http://localhost:5173"]; // Permitir localhost en desarrollo por defecto

// ✅ Función para lógica dinámica de CORS
const getCorsOriginLogic = (origin, callback) => {
  if (!origin || ALLOWED_ORIGINS.includes(origin)) {
    callback(null, true);
  } else {
    callback(new Error("CORS: Origin no permitido → " + origin));
  }
};

module.exports = {
  NODE_ENV: env,
  IS_PRODUCTION: isProduction,
  IS_DEVELOPMENT: isDevelopment,

  PORT: process.env.PORT || 3000,
  APP_NAME: process.env.APP_NAME || "SteticSoft API",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173", // URL base del frontend para correos

  // Base de datos (para Sequelize y pg.Pool)
  DATABASE_URL: process.env.DATABASE_URL,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: parseInt(process.env.DB_PORT, 10),
  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASS,
  DB_NAME: process.env.DB_NAME,
  DB_DIALECT: process.env.DB_DIALECT || "postgres",
  DB_SSL_REQUIRED: process.env.DB_SSL_REQUIRED === "true",
  DB_REJECT_UNAUTHORIZED: process.env.DB_REJECT_UNAUTHORIZED === "true",

  // Secretos
  JWT_SECRET: process.env.JWT_SECRET,
  SESSION_SECRET: process.env.SESSION_SECRET,

  // Email
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT, 10),
  EMAIL_SECURE: process.env.EMAIL_SECURE === "true",
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_FROM:
    process.env.EMAIL_FROM ||
    `"La fuente del peluquero - Notificaciones" <Lafuentedelpeluquero.com>`,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,

  // ✅ CORS corregido: se exporta la función sin ejecutarla
  CORS_ORIGIN: getCorsOriginLogic,

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || (isProduction ? "short" : "dev"),
};
