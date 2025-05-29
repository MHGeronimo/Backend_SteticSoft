// src/validators/permiso.validators.js
const { body, param } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");

const crearPermisoValidators = [
  body("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre del permiso es obligatorio.")
    .isString()
    .withMessage("El nombre del permiso debe ser una cadena de texto.")
    .isLength({ min: 3, max: 150 })
    .withMessage("El nombre del permiso debe tener entre 3 y 150 caracteres."),
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
  handleValidationErrors,
];

const actualizarPermisoValidators = [
  param("idPermiso")
    .isInt({ gt: 0 })
    .withMessage("El ID del permiso debe ser un entero positivo."),
  body("nombre")
    .optional()
    .trim()
    .notEmpty()
    .withMessage(
      "El nombre del permiso no puede estar vacío si se proporciona."
    )
    .isString()
    .withMessage("El nombre del permiso debe ser una cadena de texto.")
    .isLength({ min: 3, max: 150 })
    .withMessage("El nombre del permiso debe tener entre 3 y 150 caracteres."),
  body("descripcion")
    .optional({ nullable: true })
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

const idPermisoValidator = [
  param("idPermiso")
    .isInt({ gt: 0 })
    .withMessage("El ID del permiso debe ser un entero positivo."),
  handleValidationErrors,
];

// Nuevo validador para cambiar el estado
const cambiarEstadoPermisoValidators = [
  param("idPermiso")
    .isInt({ gt: 0 })
    .withMessage("El ID del permiso debe ser un entero positivo."),
  body("estado")
    .exists({ checkFalsy: false })
    .withMessage(
      "El campo 'estado' es obligatorio en el cuerpo de la solicitud."
    )
    .isBoolean()
    .withMessage("El valor de 'estado' debe ser un booleano (true o false)."),
  handleValidationErrors,
];

module.exports = {
  crearPermisoValidators,
  actualizarPermisoValidators,
  idPermisoValidator,
  cambiarEstadoPermisoValidators, // <-- Exportar nuevo validador
};
