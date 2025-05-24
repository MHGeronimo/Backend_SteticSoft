// src/errors/ConflictError.js
const CustomError = require("./CustomError");

class ConflictError extends CustomError {
  constructor(
    message = "Conflicto. El recurso ya existe o la operación no puede completarse debido a un conflicto de estado."
  ) {
    super(message, 409);
  }
}

module.exports = ConflictError;
