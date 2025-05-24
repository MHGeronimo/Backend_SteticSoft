// src/errors/BadRequestError.js
const CustomError = require("./CustomError");

class BadRequestError extends CustomError {
  constructor(message = "Solicitud incorrecta.", errors = []) {
    super(message, 400, errors);
  }
}

module.exports = BadRequestError;
