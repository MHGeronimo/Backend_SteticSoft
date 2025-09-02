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
  body("idProducto")
    .isInt({ gt: 0 })
    .withMessage("El ID del producto debe ser un número entero positivo."),
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


const agotarAbastecimientoValidators = [
  param('id')
    .isInt({ gt: 0 }).withMessage('El ID del abastecimiento debe ser un entero positivo.'),
  body('razon_agotamiento')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('La razón de agotamiento debe ser una cadena de texto.')
    .trim()
    .isLength({ max: 500 }).withMessage('La razón de agotamiento no debe exceder los 500 caracteres.'),
 ];

module.exports = {
  idValidator,
  toggleEstadoValidator,
  createAbastecimientoValidator,
  updateAbastecimientoValidator,
  agotarAbastecimientoValidators,
};
