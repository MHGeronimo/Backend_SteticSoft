// src/errors/ForbiddenError.js
const CustomError = require("./CustomError");

class ForbiddenError extends CustomError {
  constructor(
    message = "Acceso denegado. No tienes permiso para realizar esta acción."
  ) {
    super(message, 403);
  }
}

module.exports = ForbiddenError;
