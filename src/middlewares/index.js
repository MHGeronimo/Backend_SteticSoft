// src/shared/src_api/middlewares/index.js
"use strict";

// Importamos cada uno de los middlewares de la carpeta.
const authMiddleware = require("./auth.middleware.js");
const errorHandler = require("./errorHandler.middleware.js");
const authorization = require("./authorization.middleware.js"); // Contiene checkPermission y checkRole
const validation = require("./validation.middleware.js"); // Contiene handleValidationErrors

// Exportamos un solo objeto que contiene todo, para facilitar las importaciones en otros archivos.
module.exports = {
  authMiddleware,
  errorHandler,
  // Usamos el "spread operator" (...) para añadir las funciones de authorization y validation directamente.
  ...authorization, // Esto hace que checkPermission y checkRole estén disponibles.
  ...validation, // Esto hace que handleValidationErrors esté disponible.
};
