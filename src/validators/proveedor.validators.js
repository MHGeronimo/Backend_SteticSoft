// src/shared/src_api/validators/proveedores.validators.js

const { body, param } = require("express-validator");
const { Op } = require("sequelize"); // Asegúrate de importar Op
const db = require("../models"); // Asumo que así cargas tus modelos
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware");

// --- Validador para CREAR un proveedor ---
const crearProveedorValidators = [
  body("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre del proveedor es obligatorio.")
    .isString()
    .withMessage("El nombre debe ser texto.")
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres."),

  body("tipo")
    .trim()
    .notEmpty()
    .withMessage(
      'El tipo de proveedor es obligatorio (ej. "Natural", "Jurídico").'
    )
    .isString()
    .withMessage("El tipo debe ser texto."),

  body("telefono")
    .trim()
    .notEmpty()
    .withMessage("El teléfono principal es obligatorio.")
    .isString()
    .withMessage("El teléfono debe ser texto.")
    .isLength({ min: 7, max: 45 })
    .withMessage("El teléfono debe tener entre 7 y 45 caracteres."),

  body("correo")
    .trim()
    .notEmpty()
    .withMessage("El correo principal es obligatorio.")
    .isEmail()
    .withMessage("Debe proporcionar un correo electrónico válido.")
    .normalizeEmail()
    .custom(async (value) => {
      const proveedorExistente = await db.Proveedor.findOne({
        where: { correo: value, estado: true },
      });
      if (proveedorExistente) {
        return Promise.reject(
          "El correo electrónico ya está registrado en un proveedor activo."
        );
      }
    }),

  body("direccion")
    .trim()
    .notEmpty()
    .withMessage("La dirección es obligatoria.")
    .isString()
    .withMessage("La dirección debe ser texto.")
    .isLength({ min: 5, max: 255 })
    .withMessage("La dirección debe tener entre 5 y 255 caracteres."),

  body("tipoDocumento")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString(),

  body("numeroDocumento")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString()
    .custom(async (value) => {
      if (value) {
        const proveedorExistente = await db.Proveedor.findOne({
          where: { numero_documento: value, estado: true }, // Corregido a snake_case si así está en tu BD
        });
        if (proveedorExistente) {
          return Promise.reject(
            "El número de documento ya está registrado en un proveedor activo."
          );
        }
      }
    }),

  body("nitEmpresa")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString()
    .custom(async (value) => {
      if (value) {
        const proveedorExistente = await db.Proveedor.findOne({
          where: { nit_empresa: value, estado: true }, // Corregido a snake_case
        });
        if (proveedorExistente) {
          return Promise.reject(
            "El NIT de empresa ya está registrado en un proveedor activo."
          );
        }
      }
    }),

  // Campos opcionales de la persona encargada
  body("nombrePersonaEncargada")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString(),
  body("telefonoPersonaEncargada")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString(),
  body("emailPersonaEncargada")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail()
    .normalizeEmail(),

  handleValidationErrors,
];

// --- Validador para ACTUALIZAR un proveedor ---
const actualizarProveedorValidators = [
  // 1. Validar el ID del proveedor en la URL
  param("id") // Se espera que la ruta sea /proveedores/:id
    .isInt({ gt: 0 })
    .withMessage("El ID de proveedor es inválido."),

  // 2. Validaciones opcionales para cada campo
  body("nombre")
    .optional()
    .trim()
    .notEmpty()
    .isString()
    .isLength({ min: 2, max: 100 }),
  body("tipo").optional().trim().notEmpty().isString(),
  body("telefono")
    .optional()
    .trim()
    .notEmpty()
    .isString()
    .isLength({ min: 7, max: 45 }),
  body("direccion")
    .optional()
    .trim()
    .notEmpty()
    .isString()
    .isLength({ min: 5, max: 255 }),
  body("tipoDocumento")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString(),

  // 3. Validaciones de UNICIDAD (la clave de la corrección)
  body("correo")
    .optional()
    .trim()
    .isEmail()
    .normalizeEmail()
    .custom(async (value, { req }) => {
      const proveedorExistente = await db.Proveedor.findOne({
        where: {
          correo: value,
          id_proveedor: { [Op.ne]: req.params.id }, // [Op.ne] -> Not Equal
        },
      });
      if (proveedorExistente) {
        return Promise.reject(
          "El correo electrónico ya está en uso por otro proveedor."
        );
      }
    }),

  body("numeroDocumento")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString()
    .custom(async (value, { req }) => {
      if (value) {
        const proveedorExistente = await db.Proveedor.findOne({
          where: {
            numero_documento: value, // snake_case
            id_proveedor: { [Op.ne]: req.params.id },
          },
        });
        if (proveedorExistente) {
          return Promise.reject(
            "El número de documento ya está en uso por otro proveedor."
          );
        }
      }
    }),

  body("nitEmpresa")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString()
    .custom(async (value, { req }) => {
      if (value) {
        const proveedorExistente = await db.Proveedor.findOne({
          where: {
            nit_empresa: value, // snake_case
            id_proveedor: { [Op.ne]: req.params.id },
          },
        });
        if (proveedorExistente) {
          return Promise.reject(
            "El NIT de empresa ya está en uso por otro proveedor."
          );
        }
      }
    }),

  // 4. Otros campos opcionales
  body("nombrePersonaEncargada")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString(),
  body("telefonoPersonaEncargada")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString(),
  body("emailPersonaEncargada")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail()
    .normalizeEmail(),
  body("estado").optional().isBoolean(),

  handleValidationErrors,
];

// --- Validador para OBTENER/ELIMINAR por ID ---
const idProveedorValidator = [
  param("id")
    .isInt({ gt: 0 })
    .withMessage("El ID del proveedor debe ser un entero positivo."),
  handleValidationErrors,
];

// --- Validador para CAMBIAR ESTADO ---
const cambiarEstadoProveedorValidators = [
  param("id")
    .isInt({ gt: 0 })
    .withMessage("El ID del proveedor debe ser un entero positivo."),
  body("estado")
    .exists({ checkFalsy: false })
    .withMessage("El campo 'estado' es obligatorio.")
    .isBoolean()
    .withMessage("El valor de 'estado' debe ser un booleano."),
  handleValidationErrors,
];

module.exports = {
  crearProveedorValidators,
  actualizarProveedorValidators,
  idProveedorValidator,
  cambiarEstadoProveedorValidators,
};
