// src/validators/abastecimiento.validators.js
const { body, param } = require("express-validator");

// Validador para IDs en parámetros de URL
const idValidator = [
  param("id")
    .isInt({ gt: 0 })
    .withMessage("El ID en la URL debe ser un número entero positivo."),
];

// Validador para cambiar el estado
const toggleEstadoValidator = [
  body("estado")
    .exists()
    .withMessage("El campo 'estado' es requerido.")
    .isBoolean()
    .withMessage(
      "El campo 'estado' debe ser un valor booleano (true o false)."
    ),
];

// Validador para la creación de un abastecimiento
const createAbastecimientoValidator = [
  body("productoId")
    .isInt({ gt: 0 })
    .withMessage("El ID del producto debe ser un número entero positivo."),
  body("empleadoId")
    .isInt({ gt: 0 })
    .withMessage("El ID del empleado debe ser un número entero positivo."),
  body("cantidad")
    .isInt({ gt: 0 })
    .withMessage("La cantidad debe ser un número entero positivo."),
];

// Validador para la ACTUALIZACIÓN de un abastecimiento
const updateAbastecimientoValidator = [
  body("cantidad")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("La cantidad debe ser un número entero positivo."),
  body("estado")
    .optional()
    .isBoolean()
    .withMessage("El estado debe ser un valor booleano."),
];

// --- CORRECCIÓN CLAVE ---
// Exportamos cada validador como una propiedad de module.exports
module.exports = {
  idValidator,
  toggleEstadoValidator,
  createAbastecimientoValidator,
  updateAbastecimientoValidator,
};
