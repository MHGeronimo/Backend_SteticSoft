// src/middlewares/validation.middleware.js
const { validationResult } = require("express-validator");

/**
 * Middleware para manejar los errores de validación de express-validator.
 * Si hay errores, los agrupa por campo y envía una respuesta 400 con mensajes específicos.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const erroresPorCampo = {};

    errors.array().forEach(err => {
      const campo = err.path;
      if (!erroresPorCampo[campo]) {
        erroresPorCampo[campo] = [];
      }
      erroresPorCampo[campo].push(err.msg);
    });

    return res.status(400).json({
      success: false,
      message: "Se encontraron errores en los campos enviados.",
      errors: erroresPorCampo,
    });
  }

  next(); // Si no hay errores, continúa con el siguiente middleware/controlador
};

module.exports = {
  handleValidationErrors,
};
