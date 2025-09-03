// src/shared/src_api/middlewares/index.js
"use strict";

// Importamos cada uno de los middlewares de la carpeta.
const authMiddleware = require("./auth.middleware.js");
const errorHandler = require("./errorHandler.middleware.js");
const { checkPermission, checkRole } = require("./authorization.middleware.js");
const { handleValidationErrors } = require("./validation.middleware.js");

// Exportamos un solo objeto que contiene todo, para facilitar las importaciones en otros archivos.
module.exports = {
  authMiddleware,
  errorHandler,
  checkPermission,
  checkRole,
  handleValidationErrors,
};
