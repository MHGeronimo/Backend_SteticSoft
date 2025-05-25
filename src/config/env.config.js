// src/config/env.config.js
require("dotenv").config(); // Asegura que .env se cargue

const env = process.env.NODE_ENV || "development";
const isProduction = env === "production";
const isDevelopment = env === "development";
const isTest = env === "test";

module.exports = {
  NODE_ENV: env,
  IS_PRODUCTION: isProduction,
  IS_DEVELOPMENT: isDevelopment,
  IS_TEST: isTest,

  PORT: process.env.PORT || 3000,
  APP_NAME: process.env.APP_NAME || "SteticSoft",
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3001',

  // Configuración de Base de Datos (ejemplo para desarrollo, ajustar para producción)
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: parseInt(process.env.DB_PORT, 10) || 5432,
  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASS,
  DB_NAME: process.env.DB_NAME,
  DB_DIALECT: process.env.DB_DIALECT || "postgres",
  // Para producción, podrías tener variables separadas o usar DATABASE_URL
  // DATABASE_URL_PROD: process.env.DATABASE_URL_PROD,

  // Secretos
  JWT_SECRET: process.env.JWT_SECRET || "jwt_super_secret_key_dev",
  SESSION_SECRET: process.env.SESSION_SECRET || "session_super_secret_key_dev",

  // Email
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT, 10) || 587,
  EMAIL_SECURE: process.env.EMAIL_SECURE === "true", // Convertir a booleano
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_FROM: `"SteticSoft" <${process.env.EMAIL_USER}>`,

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3001",

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || "dev",
};
