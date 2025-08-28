// src/shared/src_api/validators/rol.validators.js
const { body, param, query } = require("express-validator"); // <-- AÑADIR 'query'
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");

const tipoPerfilValues = ["CLIENTE", "EMPLEADO", "NINGUNO"];
const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s_]+$/;
// Solo permite letras (con acentos), números, espacios y los caracteres .,:;_-
const descriptionRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s.,:;_-]+$/;

const crearRolValidators = [
  body("nombre")
    .trim()
    .notEmpty().withMessage("El nombre del rol es obligatorio.")
    .isLength({ min: 3, max: 50 }).withMessage("El nombre del rol debe tener entre 3 y 50 caracteres.")
    .matches(nameRegex).withMessage("El nombre del rol solo puede contener letras, espacios y guiones bajos."),
  
  body("descripcion")
    .trim()
    .notEmpty().withMessage("La descripción es obligatoria.")
    .isLength({ min: 3, max: 250 }).withMessage("La descripción debe tener entre 3 y 250 caracteres.")
    .matches(descriptionRegex).withMessage("La descripción contiene caracteres no válidos."), // Mensaje de error más claro


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
    .isLength({ min: 3, max: 50 }).withMessage("El nombre del rol debe tener entre 3 y 50 caracteres.")
    .matches(nameRegex).withMessage("El nombre del rol solo puede contener letras, espacios y guiones bajos."),

  // MODIFICACIÓN: Aplicamos la nueva regex también en la actualización
  body("descripcion")
    .optional()
    .trim()
    .notEmpty().withMessage("La descripción no puede estar vacía si se proporciona.")
    .isLength({ min: 3, max: 250 }).withMessage("La descripción debe tener entre 3 y 250 caracteres.")
    .matches(descriptionRegex).withMessage("La descripción contiene caracteres no válidos."), // Mensaje de error más claro
  
  
  body("estado")
    .optional()
    .isBoolean().withMessage("El estado debe ser un valor booleano (true o false)."),
  body("tipoPerfil")
    .optional()
    .isString().withMessage("El tipo de perfil debe ser un string.")
    .isIn(tipoPerfilValues).withMessage(`El tipo de perfil debe ser uno de los siguientes valores: ${tipoPerfilValues.join(", ")}`),
  handleValidationErrors,
];

// ... (el resto de validadores no cambian)
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