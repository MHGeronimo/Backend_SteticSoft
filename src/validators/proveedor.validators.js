// src/shared/src_api/validators/proveedor.validators.js

const { body, param } = require("express-validator");
const { Op } = require("sequelize");
const db = require("../models");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware");

// --- FUNCIÓN SANITIZADORA REUTILIZABLE ---
// Convierte cadenas vacías a NULL. Esto es clave para los campos UNIQUE opcionales.
const emptyStringToNull = (value) => {
  return value === "" ? null : value;
};

// --- Validador para CREAR ---
const crearProveedorValidators = [
  body("nombre").trim().notEmpty().withMessage("El nombre es obligatorio."),
  body("tipo").trim().notEmpty().withMessage("El tipo es obligatorio."),
  body("telefono").trim().notEmpty().withMessage("El teléfono es obligatorio."),
  body("correo")
    .trim()
    .notEmpty()
    .isEmail()
    .normalizeEmail()
    .custom(async (value) => {
      const proveedor = await db.Proveedor.findOne({
        where: { correo: value, estado: true },
      });
      if (proveedor) return Promise.reject("El correo ya está registrado.");
    }),
  body("direccion")
    .trim()
    .notEmpty()
    .withMessage("La dirección es obligatoria."),

  // INICIO DE CORRECCIÓN: Aplicar sanitizador
  body("numeroDocumento")
    .trim()
    .customSanitizer(emptyStringToNull)
    .optional({ nullable: true })
    .custom(async (value) => {
      if (value) {
        const proveedor = await db.Proveedor.findOne({
          where: { numeroDocumento: value, estado: true },
        });
        if (proveedor)
          return Promise.reject("El número de documento ya está registrado.");
      }
    }),
  body("nitEmpresa")
    .trim()
    .customSanitizer(emptyStringToNull)
    .optional({ nullable: true })
    .custom(async (value) => {
      if (value) {
        const proveedor = await db.Proveedor.findOne({
          where: { nitEmpresa: value, estado: true },
        });
        if (proveedor) return Promise.reject("El NIT ya está registrado.");
      }
    }),
  // FIN DE CORRECCIÓN

  handleValidationErrors,
];

// --- Validador para ACTUALIZAR ---
const actualizarProveedorValidators = [
  param("idProveedor")
    .isInt({ gt: 0 })
    .withMessage("ID de proveedor inválido."),
  body("nombre").optional().trim().notEmpty(),
  body("tipo").optional().trim().notEmpty(),
  body("telefono").optional().trim().notEmpty(),
  body("direccion").optional().trim().notEmpty(),

  body("correo")
    .optional()
    .isEmail()
    .normalizeEmail()
    .custom(async (value, { req }) => {
      const proveedor = await db.Proveedor.findOne({
        where: {
          correo: value,
          idProveedor: { [Op.ne]: req.params.idProveedor },
        },
      });
      if (proveedor)
        return Promise.reject("El correo ya está en uso por otro proveedor.");
    }),

  // INICIO DE CORRECCIÓN: Aplicar sanitizador también al actualizar
  body("numeroDocumento")
    .trim()
    .customSanitizer(emptyStringToNull)
    .optional({ nullable: true })
    .custom(async (value, { req }) => {
      if (value) {
        const proveedor = await db.Proveedor.findOne({
          where: {
            numeroDocumento: value,
            idProveedor: { [Op.ne]: req.params.idProveedor },
          },
        });
        if (proveedor)
          return Promise.reject("El número de documento ya está en uso.");
      }
    }),
  body("nitEmpresa")
    .trim()
    .customSanitizer(emptyStringToNull)
    .optional({ nullable: true })
    .custom(async (value, { req }) => {
      if (value) {
        const proveedor = await db.Proveedor.findOne({
          where: {
            nitEmpresa: value,
            idProveedor: { [Op.ne]: req.params.idProveedor },
          },
        });
        if (proveedor) return Promise.reject("El NIT ya está en uso.");
      }
    }),
  // FIN DE CORRECCIÓN

  body("estado").optional().isBoolean(),
  handleValidationErrors,
];

const idProveedorValidator = [
  param("idProveedor")
    .isInt({ gt: 0 })
    .withMessage("El ID debe ser un entero positivo."),
  handleValidationErrors,
];

const cambiarEstadoProveedorValidators = [
  param("idProveedor")
    .isInt({ gt: 0 })
    .withMessage("ID de proveedor inválido."),
  body("estado")
    .exists({ checkFalsy: false })
    .withMessage("El campo 'estado' es obligatorio.")
    .isBoolean(),
  handleValidationErrors,
];

module.exports = {
  crearProveedorValidators,
  actualizarProveedorValidators,
  idProveedorValidator,
  cambiarEstadoProveedorValidators,
};
