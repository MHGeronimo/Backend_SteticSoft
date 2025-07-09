// src/validators/rol.validators.js
const { body, param } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js"); // Asegúrate que la ruta sea correcta

const tipoPerfilValues = ["CLIENTE", "EMPLEADO", "NINGUNO"];


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
  body("tipoPerfil")
    .optional() // Lo hacemos opcional para que si no se envía, tome el defaultValue del modelo.
    .isString()
    .withMessage("El tipo de perfil debe ser un string.")
    .isIn(tipoPerfilValues)
    .withMessage(
      `El tipo de perfil debe ser uno de los siguientes valores: ${tipoPerfilValues.join(", ")}`
    ),
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
  body("tipoPerfil")
    .optional()
    .isString()
    .withMessage("El tipo de perfil debe ser un string.")
    .isIn(tipoPerfilValues)
    .withMessage(
      `El tipo de perfil debe ser uno de los siguientes valores: ${tipoPerfilValues.join(", ")}`
    ),
  handleValidationErrors,
];

// Validador genérico para cuando solo se necesita el ID del rol en el parámetro de la ruta
const idRolValidator = [
  param("idRol")
    .isInt({ gt: 0 })
    .withMessage("El ID del rol debe ser un entero positivo."),
  handleValidationErrors,
];

const gestionarPermisosRolValidators = [
  param('idRol')
    .isInt({ gt: 0 }).withMessage('El ID del rol debe ser un entero positivo.'),
  body('idPermisos') // Asumimos que el cuerpo enviará un array de IDs de permisos
    .isArray({ min: 1 }).withMessage('Se requiere un array de idPermisos con al menos un elemento.')
    .custom((idPermisos) => {
      if (!idPermisos.every(id => Number.isInteger(id) && id > 0)) {
        throw new Error('Cada idPermiso en el array debe ser un entero positivo.');
      }
      return true;
    }),
  handleValidationErrors
];

// Validador para cuando solo se necesita el idRol y un idPermiso en el path (para quitar uno específico)
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
    .exists({ checkFalsy: false }) // Asegura que el campo 'estado' exista, incluso si es false
    .withMessage(
      "El campo 'estado' es obligatorio en el cuerpo de la solicitud."
    )
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

