// src/shared/src_api/validators/proveedores.validators.js

const { body, param } = require("express-validator");
const { Op } = require("sequelize");
const db = require("../models");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware");

// --- Validador para CREAR un proveedor ---
// (Se ajustan los campos en 'where' a camelCase para consistencia)
const crearProveedorValidators = [
  body("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre del proveedor es obligatorio."),
  body("tipo")
    .trim()
    .notEmpty()
    .withMessage(
      'El tipo de proveedor es obligatorio (ej. "Natural", "Jurídico").'
    ),
  body("telefono")
    .trim()
    .notEmpty()
    .withMessage("El teléfono principal es obligatorio."),
  body("correo")
    .trim()
    .notEmpty()
    .withMessage("El correo principal es obligatorio.")
    .isEmail()
    .withMessage("Debe proporcionar un correo electrónico válido.")
    .normalizeEmail()
    .custom(async (value) => {
      const proveedorExistente = await db.Proveedor.findOne({
        where: { correo: value, estado: true }, // camelCase
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
    .withMessage("La dirección es obligatoria."),
  body("tipoDocumento").optional({ nullable: true, checkFalsy: true }),
  body("numeroDocumento")
    .optional({ nullable: true, checkFalsy: true })
    .custom(async (value) => {
      if (value) {
        const proveedorExistente = await db.Proveedor.findOne({
          where: { numeroDocumento: value, estado: true }, // INICIO DE CORRECCIÓN: Usar camelCase
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
    .custom(async (value) => {
      if (value) {
        const proveedorExistente = await db.Proveedor.findOne({
          where: { nitEmpresa: value, estado: true }, // INICIO DE CORRECCIÓN: Usar camelCase
        });
        if (proveedorExistente) {
          return Promise.reject(
            "El NIT de empresa ya está registrado en un proveedor activo."
          );
        }
      }
    }),
  // Campos opcionales
  body("nombrePersonaEncargada").optional({ nullable: true, checkFalsy: true }),
  body("telefonoPersonaEncargada").optional({
    nullable: true,
    checkFalsy: true,
  }),
  body("emailPersonaEncargada")
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .normalizeEmail(),
  handleValidationErrors,
];

// --- Validador para ACTUALIZAR un proveedor ---
const actualizarProveedorValidators = [
  param("id").isInt({ gt: 0 }).withMessage("El ID de proveedor es inválido."),

  // Validaciones opcionales para cada campo
  body("nombre").optional().trim().notEmpty(),
  body("tipo").optional().trim().notEmpty(),
  body("telefono").optional().trim().notEmpty(),
  body("direccion").optional().trim().notEmpty(),
  body("tipoDocumento").optional({ nullable: true, checkFalsy: true }),

  // Validaciones de UNICIDAD (Corregidas a camelCase)
  body("correo")
    .optional()
    .trim()
    .isEmail()
    .normalizeEmail()
    .custom(async (value, { req }) => {
      const proveedorExistente = await db.Proveedor.findOne({
        where: {
          correo: value,
          idProveedor: { [Op.ne]: req.params.id }, // INICIO DE CORRECCIÓN: Usar idProveedor (o como se llame tu PK en el modelo)
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
    .custom(async (value, { req }) => {
      if (value) {
        const proveedorExistente = await db.Proveedor.findOne({
          where: {
            numeroDocumento: value, // INICIO DE CORRECCIÓN: Usar camelCase
            idProveedor: { [Op.ne]: req.params.id },
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
    .custom(async (value, { req }) => {
      if (value) {
        const proveedorExistente = await db.Proveedor.findOne({
          where: {
            nitEmpresa: value, // INICIO DE CORRECCIÓN: Usar camelCase
            idProveedor: { [Op.ne]: req.params.id },
          },
        });
        if (proveedorExistente) {
          return Promise.reject(
            "El NIT de empresa ya está en uso por otro proveedor."
          );
        }
      }
    }),

  // Otros campos opcionales
  body("nombrePersonaEncargada").optional({ nullable: true, checkFalsy: true }),
  body("telefonoPersonaEncargada").optional({
    nullable: true,
    checkFalsy: true,
  }),
  body("emailPersonaEncargada")
    .optional({ nullable: true, checkFalsy: true })
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
