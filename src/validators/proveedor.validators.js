// src/shared/src_api/validators/proveedor.validators.js

const { body, param } = require("express-validator");
const { Op } = require("sequelize");
const db = require("../models");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware");

// --- Validador para CREAR un proveedor ---
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
    .normalizeEmail()
    .custom(async (value) => {
      const proveedor = await db.Proveedor.findOne({
        where: { correo: value, estado: true },
      });
      if (proveedor) {
        return Promise.reject(
          "El correo electrónico ya está registrado en un proveedor activo."
        );
      }
    }),
  body("direccion")
    .trim()
    .notEmpty()
    .withMessage("La dirección es obligatoria."),
  body("numeroDocumento")
    .optional({ nullable: true, checkFalsy: true })
    .custom(async (value) => {
      if (value) {
        const proveedor = await db.Proveedor.findOne({
          where: { numeroDocumento: value, estado: true },
        });
        if (proveedor) {
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
        const proveedor = await db.Proveedor.findOne({
          where: { nitEmpresa: value, estado: true },
        });
        if (proveedor) {
          return Promise.reject(
            "El NIT de empresa ya está registrado en un proveedor activo."
          );
        }
      }
    }),
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
  // INICIO DE CORRECCIÓN: Usar 'idProveedor' para coincidir con el archivo de rutas.
  param("idProveedor")
    .isInt({ gt: 0 })
    .withMessage("El ID de proveedor es inválido."),

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
          idProveedor: { [Op.ne]: req.params.idProveedor }, // Se usa req.params.idProveedor
        },
      });
      if (proveedor)
        return Promise.reject("El correo ya está en uso por otro proveedor.");
    }),
  body("numeroDocumento")
    .optional({ nullable: true, checkFalsy: true })
    .custom(async (value, { req }) => {
      if (value) {
        const proveedor = await db.Proveedor.findOne({
          where: {
            numeroDocumento: value,
            idProveedor: { [Op.ne]: req.params.idProveedor }, // Se usa req.params.idProveedor
          },
        });
        if (proveedor)
          return Promise.reject(
            "El número de documento ya está en uso por otro proveedor."
          );
      }
    }),
  body("nitEmpresa")
    .optional({ nullable: true, checkFalsy: true })
    .custom(async (value, { req }) => {
      if (value) {
        const proveedor = await db.Proveedor.findOne({
          where: {
            nitEmpresa: value,
            idProveedor: { [Op.ne]: req.params.idProveedor }, // Se usa req.params.idProveedor
          },
        });
        if (proveedor)
          return Promise.reject("El NIT ya está en uso por otro proveedor.");
      }
    }),
  body("estado").optional().isBoolean(),
  handleValidationErrors,
];
// FIN DE CORRECCIÓN

// --- Validador de ID (Corregido para consistencia) ---
const idProveedorValidator = [
  param("idProveedor")
    .isInt({ gt: 0 })
    .withMessage("El ID del proveedor debe ser un entero positivo."),
  handleValidationErrors,
];

// --- Validador para CAMBIAR ESTADO (Corregido para consistencia) ---
const cambiarEstadoProveedorValidators = [
  param("idProveedor")
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
