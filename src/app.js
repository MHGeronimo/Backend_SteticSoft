// src/shared/src_api/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet"); // Para seguridad básica de cabeceras HTTP
const morgan = require("morgan"); // Logger de peticiones HTTP
const path = require("path"); // Módulo 'path' de Node.js para manejar rutas de archivos

// Importar configuraciones y variables de entorno centralizadas
const {
  CORS_ORIGIN,
  NODE_ENV,
  LOG_LEVEL,
} = require("./config/env.config.js");

// Importar middlewares configurados
const sessionMiddleware = require("./config/session.config.js");
const apiRoutes = require("./routes/index.js"); // Router principal de la API

// Importar manejadores de errores y clases de error personalizadas
const { NotFoundError } = require("./errors/NotFoundError.js");
const errorHandler = require("./middlewares/errorHandler.middleware.js");

// Crear la instancia de la aplicación Express
const app = express();

// --- Middlewares Esenciales ---

// 1. Helmet: Ayuda a proteger la aplicación estableciendo varias cabeceras HTTP de seguridad.
app.use(helmet());

// 2. CORS (Cross-Origin Resource Sharing): Permite o restringe las solicitudes de diferentes orígenes.
// ==================== INICIO DE LA CORRECCIÓN ====================
// Se configura CORS para permitir peticiones explícitamente desde el origen
// definido en las variables de entorno (CORS_ORIGIN). Esto soluciona el error
// que bloqueaba las peticiones a /api/proveedores y /api/compras.
app.use(
  cors({
    origin: CORS_ORIGIN, // Esta variable debe resolver a "http://localhost:5173" en desarrollo
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    optionsSuccessStatus: 204,
  })
);
// ===================== FIN DE LA CORRECCIÓN ======================

// 3. Morgan: Logger de peticiones HTTP. Útil para desarrollo.
if (NODE_ENV === "development") {
  app.use(morgan(LOG_LEVEL || "dev"));
}

// 4. Parseadores de Cuerpo de Solicitud: Para manejar datos JSON y URL-encoded.
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 5. Configuración de Sesiones: Manejo de sesiones de usuario.
app.use(sessionMiddleware);

// --- Rutas Estáticas y de Bienvenida ---

app.use(express.static(path.join(__dirname, "public")));

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

module.exports = app;