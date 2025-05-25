// src/config/env.config.js
require('dotenv').config();

const env = process.env.NODE_ENV || 'development';
const isProduction = env === 'production';
const isDevelopment = env === 'development';

module.exports = {
  NODE_ENV: env,
  IS_PRODUCTION: isProduction,
  IS_DEVELOPMENT: isDevelopment,

  PORT: process.env.PORT || 3000,
  APP_NAME: process.env.APP_NAME || 'SteticSoft API',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3001', // URL base del frontend para correos

  // Base de datos (para Sequelize y pg.Pool)
  // Para producción, si DATABASE_URL está seteado, Sequelize y pg-pool pueden usarlo directamente.
  // Si no, se usan las variables individuales.
  DATABASE_URL: process.env.DATABASE_URL, // Render setea esta variable con la Internal URL
  DB_HOST: process.env.DB_HOST,
  DB_PORT: parseInt(process.env.DB_PORT, 10),
  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASS,
  DB_NAME: process.env.DB_NAME,
  DB_DIALECT: process.env.DB_DIALECT || 'postgres',
  // Variables específicas para SSL en producción (Render)
  DB_SSL_REQUIRED: process.env.DB_SSL_REQUIRED === 'true', // Convertir a booleano
  DB_REJECT_UNAUTHORIZED: process.env.DB_REJECT_UNAUTHORIZED === 'true', // Convertir a booleano, para Render suele ser false

  // Secretos (¡estos deben ser diferentes y fuertes en producción!)
  JWT_SECRET: process.env.JWT_SECRET,
  SESSION_SECRET: process.env.SESSION_SECRET,

  // Email
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT, 10),
  EMAIL_SECURE: process.env.EMAIL_SECURE === 'true',
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM || `"SteticSoft" <no-reply@steticsoft.com>`,

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || (isProduction ? 'short' : 'dev'),
};