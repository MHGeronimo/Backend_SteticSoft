const { body } = require("express-validator");
const { validationResult } = require("express-validator");

// Middleware para manejar los errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

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
  body("fechaIngreso")
    .optional()
    .isISO8601()
    .withMessage("La fecha de ingreso debe tener un formato de fecha válido."),
  body("estado")
    .optional()
    .isBoolean()
    .withMessage("El estado debe ser un valor booleano."),

  handleValidationErrors,
];

// --- CORRECCIÓN CLAVE ---
// Validador para la ACTUALIZACIÓN de un abastecimiento.
// Hacemos que todos los campos sean OPCIONALES. Solo se validarán si se incluyen
// en el cuerpo de la solicitud PUT.
const updateAbastecimientoValidator = [
  body("cantidad")
    .optional() // <-- ESTA ES LA CORRECCIÓN
    .isInt({ gt: 0 })
    .withMessage("La cantidad debe ser un número entero positivo."),

  body("estado")
    .optional() // <-- ESTA ES LA CORRECCIÓN
    .isBoolean()
    .withMessage("El estado debe ser un valor booleano."),
  
  body("estaAgotado")
    .optional() // <-- ESTA ES LA CORRECCIÓN
    .isBoolean()
    .withMessage("El campo 'estaAgotado' debe ser booleano."),

  body("razonAgotamiento")
    .optional({ nullable: true }) // <-- ESTA ES LA CORRECCIÓN
    .isString()
    .withMessage("La razón de agotamiento debe ser un texto."),

  handleValidationErrors,
];


module.exports = {
  createAbastecimientoValidator,
  updateAbastecimientoValidator,
};