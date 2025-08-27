// src/validators/rol.validators.js
const { body, param } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");

const tipoPerfilValues = ["CLIENTE", "EMPLEADO", "NINGUNO"];
// MODIFICACIÓN: Expresión regular para nombres de roles.
const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s_]+$/;


const crearRolValidators = [
  body("nombre")
    .trim()
    .notEmpty().withMessage("El nombre del rol es obligatorio.")
    // MODIFICACIÓN: Longitud y validación de caracteres estándar.
    .isLength({ min: 3, max: 50 }).withMessage("El nombre del rol debe tener entre 3 y 50 caracteres.")
    .matches(nameRegex).withMessage("El nombre del rol solo puede contener letras, espacios y guiones bajos."),
  body("descripcion")
    .optional()
    .trim()
    .isString().withMessage("La descripción debe ser una cadena de texto.")
    .isLength({ max: 255 }).withMessage("La descripción no debe exceder los 255 caracteres."),
  body("estado")
    .optional()
    .isBoolean().withMessage("El estado debe ser un valor booleano (true o false)."),
  body("tipoPerfil")
    .optional()
    .isString().withMessage("El tipo de perfil debe ser un string.")
    .isIn(tipoPerfilValues).withMessage(`El tipo de perfil debe ser uno de los siguientes valores: ${tipoPerfilValues.join(", ")}`),
  handleValidationErrors,
];

const actualizarRolValidators = [
  param("idRol")
    .isInt({ gt: 0 }).withMessage("El ID del rol debe ser un entero positivo."),
  body("nombre")
    .optional()
    .trim()
    .notEmpty().withMessage("El nombre del rol no puede estar vacío si se proporciona.")
    // MODIFICACIÓN: Longitud y validación de caracteres estándar.
    .isLength({ min: 3, max: 50 }).withMessage("El nombre del rol debe tener entre 3 y 50 caracteres.")
    .matches(nameRegex).withMessage("El nombre del rol solo puede contener letras, espacios y guiones bajos."),
  body("descripcion")
    .optional({ nullable: true })
    .trim()
    .isString().withMessage("La descripción debe ser una cadena de texto.")
    .isLength({ max: 255 }).withMessage("La descripción no debe exceder los 255 caracteres."),
  body("estado")
    .optional()
    .isBoolean().withMessage("El estado debe ser un valor booleano (true o false)."),
  body("tipoPerfil")
    .optional()
    .isString().withMessage("El tipo de perfil debe ser un string.")
    .isIn(tipoPerfilValues).withMessage(`El tipo de perfil debe ser uno de los siguientes valores: ${tipoPerfilValues.join(", ")}`),
  handleValidationErrors,
];

// ... (el resto de validadores de rol.validators.js se mantienen igual)
const idRolValidator = [
  param("idRol")
    .isInt({ gt: 0 })
    .withMessage("El ID del rol debe ser un entero positivo."),
  handleValidationErrors,
];

const gestionarPermisosRolValidators = [
  param('idRol')
    .isInt({ gt: 0 }).withMessage('El ID del rol debe ser un entero positivo.'),
  body('idPermisos')
    .isArray({ min: 1 }).withMessage('Se requiere un array de idPermisos con al menos un elemento.')
    .custom((idPermisos) => {
      if (!idPermisos.every(id => Number.isInteger(id) && id > 0)) {
        throw new Error('Cada idPermiso en el array debe ser un entero positivo.');
      }
      return true;
    }),
  handleValidationErrors
];

const gestionarUnPermisoRolValidators = [
  param('idRol')
    .isInt({ gt: 0 }).withMessage('El ID del rol debe ser un entero positivo.'),
  param('idPermiso')
    .isInt({ gt: 0 }).withMessage('El ID del permiso debe ser un entero positivo.'),
  handleValidationErrors
];

const cambiarEstadoRolValidators = [
  param("idRol")
    .isInt({ gt: 0 })
    .withMessage("El ID del rol debe ser un entero positivo."),
  body("estado")
    .exists({ checkFalsy: false })
    .withMessage("El campo 'estado' es obligatorio en el cuerpo de la solicitud.")
    .isBoolean()
    .withMessage("El valor de 'estado' debe ser un booleano (true o false)."),
  handleValidationErrors,
];

module.exports = {
  crearRolValidators,
  actualizarRolValidators,
  idRolValidator,
  gestionarPermisosRolValidators,
  gestionarUnPermisoRolValidators,
  cambiarEstadoRolValidators,
};