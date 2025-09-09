// src/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

// Importar configuraciones
const {
  CORS_ORIGIN,
  NODE_ENV,
  LOG_LEVEL,
} = require("./config/env.config.js");

// Importar middlewares
const sessionMiddleware = require("./config/session.config.js");
const apiRoutes = require("./routes/index.js");
const { NotFoundError } = require("./errors/NotFoundError.js");
const errorHandler = require("./middlewares/errorHandler.middleware.js");

// Crear la instancia de la aplicación Express
const app = express();

// --- Middlewares Esenciales ---

// 1. Helmet
app.use(helmet());

// 2. CORS
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    optionsSuccessStatus: 204,
  })
);

// 3. Morgan
if (NODE_ENV === "development") {
  app.use(morgan(LOG_LEVEL || "dev"));
}

// 4. Parseadores de Cuerpo
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 5. Configuración de Sesiones
app.use(sessionMiddleware);

// --- Rutas Estáticas y de Bienvenida ---

// 🚨 SOLUCIÓN OPCIÓN 5: Servir archivos estáticos desde 'src/public/uploads'
app.use("/uploads", express.static(path.join(__dirname, "src", "public", "uploads")));

// También mantener la ruta de API para compatibilidad
app.use("/api/uploads", express.static(path.join(__dirname, "src", "public", "uploads")));

// Servir otros archivos estáticos desde 'src/public'
app.use(express.static(path.join(__dirname, "public")));

// Ruta raíz para servir la página de bienvenida
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "welcome.html"));
});

// --- Rutas Principales de la API ---
app.use("/api", apiRoutes);

// --- Manejo de Errores ---

// Manejador para Rutas No Encontradas (404)
const manejador404 = (req, res, next) => {
  if (!req.route && req.path !== "/" && !req.path.startsWith("/api/")) {
    return next(
      new NotFoundError(
        `El recurso solicitado no fue encontrado: ${req.method} ${req.originalUrl}`
      )
    );
  }
  next();
};
app.use(manejador404);

// Middleware Global de Manejo de Errores
app.use(errorHandler);

// Exportar la instancia de la aplicación Express
module.exports = app;