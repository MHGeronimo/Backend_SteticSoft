// src/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const {
  CORS_ORIGIN,
  NODE_ENV,
  LOG_LEVEL,
  APP_NAME,
} = require("./config/env.config");
const sessionMiddleware = require("./config/session.config.js");
const apiRoutes = require("./routes");

const { NotFoundError } = require("./errors/NotFoundError");
const errorHandler = require("./middlewares/errorHandler.middleware");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);

if (NODE_ENV === "development") {
  app.use(morgan(LOG_LEVEL || "dev"));
}

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(sessionMiddleware);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "welcome.html"));
});

app.use("/api", apiRoutes); // Esta podría ser una línea problemática si apiRoutes no es un router/función

// Manejo de Rutas No Encontradas (404)
const manejador404 = (req, res, next) => {
  if (req.path !== "/" && !req.path.startsWith("/api")) {
    return next(
      new NotFoundError( // Aquí se usa
        `No se encontró el recurso: ${req.method} ${req.originalUrl}`
      )
    );
  }
  next();
};
app.use(manejador404);

// Middleware Global de Manejo de Errores
app.use(errorHandler); // Si el error es aquí, errorHandler no es una función válida.

module.exports = app;
