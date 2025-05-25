// src/errors/NotFoundError.js
const CustomError = require("./CustomError"); // Asumiendo que CustomError está en la misma carpeta

class NotFoundError extends CustomError {
  constructor(message = "Recurso no encontrado.") {
    super(message, 404); // Llama al constructor de CustomError con el statusCode 404
  }
}

module.exports =  NotFoundError; 
