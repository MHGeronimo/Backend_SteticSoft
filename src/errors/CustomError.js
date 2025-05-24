// src/errors/CustomError.js
class CustomError extends Error {
  constructor(message, statusCode = 500, errors = []) {
    super(message);
    this.name = this.constructor.name; // Asegura que el nombre del error sea el de la clase hija
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors; // Para detalles adicionales o errores de validación
    Error.captureStackTrace(this, this.constructor); // Captura el stack trace correctamente
  }
}

module.exports = CustomError;
