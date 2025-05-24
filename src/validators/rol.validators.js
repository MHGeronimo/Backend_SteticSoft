// src/validators/rol.validators.js
const { body, param } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js"); // Asegúrate que la ruta sea correcta

const crearRolValidators = [
  body("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre del rol es obligatorio.")
    .isString()
    .withMessage("El nombre del rol debe ser una cadena de texto.")
    .isLength({ min: 3, max: 100 })
    .withMessage("El nombre del rol debe tener entre 3 y 100 caracteres."),
  body("descripcion")
    .optional()
    .trim()
    .isString()
    .withMessage("La descripción debe ser una cadena de texto.")
    .isLength({ max: 255 })
    .withMessage("La descripción no debe exceder los 255 caracteres."),
  body("estado")
    .optional()
    .isBoolean()
    .withMessage("El estado debe ser un valor booleano (true o false)."),
  handleValidationErrors, // Middleware para manejar los errores de estas validaciones
];

const actualizarRolValidators = [
  param("idRol")
    .isInt({ gt: 0 })
    .withMessage("El ID del rol debe ser un entero positivo."),
  body("nombre")
    .optional() // El nombre es opcional al actualizar, solo se valida si se envía
    .trim()
    .notEmpty()
    .withMessage("El nombre del rol no puede estar vacío si se proporciona.")
    .isString()
    .withMessage("El nombre del rol debe ser una cadena de texto.")
    .isLength({ min: 3, max: 100 })
    .withMessage("El nombre del rol debe tener entre 3 y 100 caracteres."),
  body("descripcion")
    .optional({ nullable: true }) // Permite que sea null (para borrarla) o no se envíe
    .trim()
    .isString()
    .withMessage("La descripción debe ser una cadena de texto.")
    .isLength({ max: 255 })
    .withMessage("La descripción no debe exceder los 255 caracteres."),
  body("estado")
    .optional()
    .isBoolean()
    .withMessage("El estado debe ser un valor booleano (true o false)."),
  handleValidationErrors,
];

// Validador genérico para cuando solo se necesita el ID del rol en el parámetro de la ruta
const idRolValidator = [
  param("idRol")
    .isInt({ gt: 0 })
    .withMessage("El ID del rol debe ser un entero positivo."),
  handleValidationErrors,
];

module.exports = {
  crearRolValidators,
  actualizarRolValidators,
  idRolValidator,
};
