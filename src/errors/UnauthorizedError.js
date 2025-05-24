// src/errors/UnauthorizedError.js
const CustomError = require("./CustomError");

class UnauthorizedError extends CustomError {
  constructor(
    message = "No autorizado. Credenciales inválidas o token faltante/incorrecto."
  ) {
    super(message, 401);
  }
}

module.exports = UnauthorizedError;
