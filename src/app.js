// src/app.js
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
  // APP_NAME, // APP_NAME se usa más en server.js para el log de inicio
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
app.use(
  cors({
    origin: CORS_ORIGIN, // Esto ahora recibe la salida de getCorsOriginLogic()
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Es bueno ser explícito
    optionsSuccessStatus: 204,
  })
);

// 3. Morgan: Logger de peticiones HTTP. Útil para desarrollo.
if (NODE_ENV === "development") {
  app.use(morgan(LOG_LEVEL || "dev")); // 'dev' es un formato común para Morgan
}

// 4. Parseadores de Cuerpo de Solicitud: Para manejar datos JSON y URL-encoded.
app.use(express.json({ limit: "10mb" })); // Parsea cuerpos JSON (límite de tamaño opcional)
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // Parsea cuerpos URL-encoded

// 5. Configuración de Sesiones: Manejo de sesiones de usuario.
app.use(sessionMiddleware);

// --- Rutas Estáticas y de Bienvenida ---

// Servir archivos estáticos desde la carpeta 'src/public'
// Ej: imágenes, CSS, JS del lado del cliente para la página de bienvenida.
app.use(express.static(path.join(__dirname, "public")));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Ruta raíz para servir la página de bienvenida (welcome.html)
app.get("/", (req, res) => {
  // __dirname es el directorio del archivo actual (src/)
  res.sendFile(path.join(__dirname, "public", "welcome.html"));
});

// --- Rutas Principales de la API ---
// Todas las rutas definidas en src/routes/index.js (y sus sub-rutas)
// estarán prefijadas con /api
app.use("/api", apiRoutes);

// --- Manejo de Errores ---

// Manejador para Rutas No Encontradas (404)
// Se ejecuta si ninguna ruta anterior (estática, raíz, /api/*) coincide.
const manejador404 = (req, res, next) => {
  if (!req.route && req.path !== "/" && !req.path.startsWith("/api/")) {
    // Verifica si alguna ruta de Express coincidió
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
// DEBE ser el último middleware que se registra con app.use().
app.use(errorHandler);

// Exportar la instancia de la aplicación Express para ser usada por server.js
module.exports = app;
