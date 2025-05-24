// src/middlewares/validation.middleware.js
const { validationResult } = require("express-validator");

/**
 * Middleware para manejar los errores de validación de express-validator.
 * Si hay errores de validación, detiene la ejecución y envía una respuesta 400.
 * Si no hay errores, pasa el control al siguiente middleware/controlador.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Errores de validación detectados.", // Mensaje un poco más genérico
      errors: errors.array(), // Devuelve un array con los errores detallados
    });
  }
  next(); // Si no hay errores, pasa al siguiente middleware/controlador
};

module.exports = {
  handleValidationErrors,
};
