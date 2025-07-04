// src/validators/proveedor.validators.js
const { body, param } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");

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
    .isLength({ max: 100 })
    .withMessage("El correo no debe exceder los 100 caracteres.")
    .normalizeEmail()
    .custom(async (value) => {
      const proveedorExistente = await db.Proveedor.findOne({
        where: { correo: value, estado: true }, // <-- AÑADIR ESTO
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
  
  // --- INICIO DE CORRECCIÓN ---
  body("numeroDocumento")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString()
    .isLength({ max: 45 })
    .custom(async (value) => {
      if (value) {
        const proveedorExistente = await db.Proveedor.findOne({
          where: { numeroDocumento: value, estado: true }, // <-- AÑADIR ESTO
          });
          if (proveedorExistente) {
            return Promise.reject("El número de documento ya está registrado en un proveedor activo.");
          }
        }
      }),
  // --- FIN DE CORRECCIÓN ---

  body("nitEmpresa")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString()
    .withMessage("El NIT de la empresa debe ser texto.")
    .isLength({ max: 45 })
    .withMessage("El NIT no debe exceder los 45 caracteres.")
    .custom(async (value) => {
      if (value) {
        const proveedorExistente = await db.Proveedor.findOne({
          where: { nitEmpresa: value, estado: true }, // <-- AÑADIR ESTO
          });
          if (proveedorExistente) {
            return Promise.reject("El NIT de empresa ya está registrado en un proveedor activo.");
          }
        }
      }),
  body("nombrePersonaEncargada")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString()
    .withMessage("El nombre de la persona encargada debe ser texto.")
    .isLength({ max: 100 })
    .withMessage(
      "El nombre de la persona encargada no debe exceder los 100 caracteres."
    ),
  body("telefonoPersonaEncargada")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString()
    .withMessage("El teléfono de la persona encargada debe ser texto.")
    .isLength({ max: 45 })
    .withMessage(
      "El teléfono de la persona encargada no debe exceder los 45 caracteres."
    ),
  body("emailPersonaEncargada")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage(
      "Debe proporcionar un correo electrónico válido para la persona encargada."
    )
    .isLength({ max: 100 })
    .withMessage(
      "El correo de la persona encargada no debe exceder los 100 caracteres."
    )
    .normalizeEmail(),
  body("estado")
    .optional()
    .isBoolean()
    .withMessage("El estado debe ser un valor booleano."),
  handleValidationErrors,
];

const actualizarProveedorValidators = [
  param("idProveedor")
    .isInt({ gt: 0 })
    .withMessage("ID de proveedor inválido."),
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
  body("correo")
    .optional()
    .trim()
    .notEmpty()
    .isEmail()
    .isLength({ max: 100 })
    .normalizeEmail()
    .custom(async (value, { req }) => {
      if (value) {
        const idProveedor = Number(req.params.idProveedor);
        const proveedorExistente = await db.Proveedor.findOne({
          where: {
            correo: value,
            idProveedor: { [db.Sequelize.Op.ne]: idProveedor },
            estado: true,
          },
        });
        if (proveedorExistente) {
          return Promise.reject(
            "El correo electrónico principal ya está registrado por otro proveedor."
          );
        }
      }
    }),
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

  // --- INICIO DE CORRECCIÓN ---
  body("numeroDocumento")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString()
    .isLength({ max: 45 })
    .custom(async (value, { req }) => {
        if (value) {
          const idProveedor = Number(req.params.idProveedor);
          const proveedorExistente = await db.Proveedor.findOne({
            where: {
              numeroDocumento: value,
              idProveedor: { [db.Sequelize.Op.ne]: idProveedor },
              estado: true,
            },
          });
          if (proveedorExistente) {
            return Promise.reject(
              "El número de documento ya está registrado para otro proveedor."
            );
          }
        }
      }),
  // --- FIN DE CORRECCIÓN ---

  body("nitEmpresa")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString()
    .withMessage("NIT inválido.")
    .isLength({ max: 45 })
    .custom(async (value, { req }) => {
      if (value) {
        const idProveedor = Number(req.params.idProveedor);
        const proveedorExistente = await db.Proveedor.findOne({
          where: {
            nitEmpresa: value,
            idProveedor: { [db.Sequelize.Op.ne]: idProveedor },
            estado: true,
          },
        });
        if (proveedorExistente) {
          return Promise.reject(
            "El NIT de empresa ya está registrado por otro proveedor."
          );
        }
      }
    }),
  body("nombrePersonaEncargada")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString()
    .isLength({ max: 100 }),
  body("telefonoPersonaEncargada")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString()
    .isLength({ max: 45 }),
  body("emailPersonaEncargada")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("Correo de persona encargada inválido.")
    .isLength({ max: 100 })
    .normalizeEmail(),
  body("estado").optional().isBoolean(),
  handleValidationErrors,
];

const idProveedorValidator = [
  param("idProveedor")
    .isInt({ gt: 0 })
    .withMessage("El ID del proveedor debe ser un entero positivo."),
  handleValidationErrors,
];

// Nuevo validador para cambiar el estado
const cambiarEstadoProveedorValidators = [
  param("idProveedor")
    .isInt({ gt: 0 })
    .withMessage("El ID del proveedor debe ser un entero positivo."),
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
  crearProveedorValidators,
  actualizarProveedorValidators,
  idProveedorValidator,
  cambiarEstadoProveedorValidators, // <-- Exportar nuevo validador
};