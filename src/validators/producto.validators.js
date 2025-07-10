const { body, param } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");

// --- Validador para CREAR un producto ---
const crearProductoValidators = [
  body("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre del producto es obligatorio."),

  body("descripcion")
    .trim()
    .notEmpty()
    .withMessage("La descripción es obligatoria."),

  // INICIO DE LA CORRECCIÓN CLAVE: Convertir strings a números antes de validar
  body("precio")
    .trim()
    .notEmpty()
    .withMessage("El precio es obligatorio.")
    .toFloat() // Convierte el string '150.00' al número 150.00
    .isFloat({ gt: 0 })
    .withMessage("El precio debe ser un número mayor que cero."),

  body("existencia")
    .trim()
    .notEmpty()
    .withMessage("La existencia es obligatoria.")
    .toInt() // Convierte el string '10' al número 10
    .isInt({ min: 0 })
    .withMessage("La existencia debe ser un número entero no negativo."),

  body("stockMinimo")
    .trim()
    .notEmpty()
    .withMessage("El stock mínimo es obligatorio.")
    .toInt()
    .isInt({ min: 0 })
    .withMessage("El stock mínimo debe ser un número entero no negativo."),

  body("idCategoriaProducto") // El nombre del campo que envías desde el frontend
    .trim()
    .notEmpty()
    .withMessage("Debe seleccionar una categoría.")
    .toInt()
    .isInt({ gt: 0 })
    .withMessage("El ID de la categoría no es válido."),
  // FIN DE LA CORRECCIÓN

  body("tipoUso")
    .isIn(["Venta", "Interno"])
    .withMessage("El tipo de uso no es válido."),

  // La imagen no se valida aquí porque multer ya la procesó.
  // Podemos validar opcionalmente otros campos si es necesario.

  handleValidationErrors,
];

// --- Validador para ACTUALIZAR un producto ---
// Se aplican las mismas correcciones para la actualización
const actualizarProductoValidators = [
  param("idProducto").isInt({ gt: 0 }).withMessage("ID de producto inválido."),
  body("nombre").optional().trim().notEmpty(),
  body("descripcion").optional().trim().notEmpty(),
  body("precio").optional().toFloat().isFloat({ gt: 0 }),
  body("existencia").optional().toInt().isInt({ min: 0 }),
  body("stockMinimo").optional().toInt().isInt({ min: 0 }),
  body("idCategoriaProducto").optional().toInt().isInt({ gt: 0 }),
  body("tipoUso").optional().isIn(["Venta", "Interno"]),
  handleValidationErrors,
];

const idProductoValidator = [
  param("idProducto")
    .isInt({ gt: 0 })
    .withMessage("El ID del producto debe ser un entero positivo."),
  handleValidationErrors,
];

const cambiarEstadoProductoValidators = [
  param("idProducto").isInt({ gt: 0 }).withMessage("ID de producto inválido."),
  body("estado")
    .isBoolean()
    .withMessage("El estado debe ser un valor booleano."),
  handleValidationErrors,
];

module.exports = {
  crearProductoValidators,
  actualizarProductoValidators,
  idProductoValidator,
  cambiarEstadoProductoValidators,
};
