// src/shared/src_api/validators/proveedor.validators.js

const { body, param } = require("express-validator");
const { Op } = require("sequelize");
const db = require("../models");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware");

// --- FUNCIÓN SANITIZADORA REUTILIZABLE ---
const emptyStringToNull = (value) => {
  return value === "" ? null : value;
};

// --- Validador para CREAR ---
const crearProveedorValidators = [
  body("nombre")
    .trim()
    .notEmpty().withMessage("El nombre del proveedor es un campo obligatorio.")
    .isLength({ min: 3 }).withMessage("El nombre del proveedor debe tener al menos 3 caracteres.")
    .matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/).withMessage("El nombre del proveedor solo puede contener letras y espacios."),
  
  body("tipo")
    .trim()
    .notEmpty().withMessage("El tipo de proveedor es un campo obligatorio."),
  
  body("telefono")
    .trim()
    .notEmpty().withMessage("El teléfono del proveedor es un campo obligatorio.")
    .matches(/^\d{10}$/).withMessage("El teléfono del proveedor debe tener exactamente 10 dígitos."),

  body("correo")
    .trim()
    .notEmpty().withMessage("El correo electrónico del proveedor es un campo obligatorio.")
    .isEmail().withMessage("El formato del correo electrónico es inválido.")
    .normalizeEmail()
    .custom(async (value) => {
      const proveedor = await db.Proveedor.findOne({
        where: { correo: value, estado: true },
      });
      if (proveedor) return Promise.reject("El correo electrónico ya está registrado. Por favor, ingrese uno diferente.");
    }),

  body("direccion")
    .trim()
    .notEmpty().withMessage("La dirección del proveedor es un campo obligatorio.")
    .isLength({ min: 5 }).withMessage("La dirección debe tener al menos 5 caracteres.")
    .matches(/^(Calle|Cl\.?|Carrera|Cra\.?|Avenida|Av\.?|Transversal|Tv\.?|Diagonal|Dg\.?|Circular|Cir\.?|Kilómetro|Km\.?)\s+[A-Za-z0-9]+(?:\s+#\s*[A-Za-z0-9]+(?:\s*-\s*[A-Za-z0-9]+)?)?$/i)
    .withMessage("La dirección debe iniciar con un tipo de vía válido (ej: Calle, Carrera, Av., Cra., etc.) seguido de un número y un numeral."),

  // --- Validación de campos opcionales con unicidad ---
  body("numeroDocumento")
    .trim()
    .customSanitizer(emptyStringToNull)
    .optional({ nullable: true })
    .custom(async (value) => {
      if (value === null) return true;
      const proveedor = await db.Proveedor.findOne({
        where: { numeroDocumento: value, estado: true },
      });
      if (proveedor)
        return Promise.reject("El número de documento ya está registrado. Por favor, ingrese uno diferente.");
    }),
  
  body("nitEmpresa")
    .trim()
    .customSanitizer(emptyStringToNull)
    .optional({ nullable: true })
    .custom(async (value) => {
      if (value === null) return true;
      const proveedor = await db.Proveedor.findOne({
        where: { nitEmpresa: value, estado: true },
      });
      if (proveedor) return Promise.reject("El NIT de la empresa ya está registrado. Por favor, ingrese uno diferente.");
    }),
  
  body("nombrePersonaEncargada")
    .optional()
    .trim()
    .notEmpty().withMessage("El nombre del encargado no puede estar vacío.")
    .isLength({ min: 3 }).withMessage("El nombre del encargado debe tener al menos 3 caracteres.")
    .matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/).withMessage("El nombre del encargado solo puede contener letras y espacios."),
  
  body("telefonoPersonaEncargada")
    .trim()
    .notEmpty().withMessage("El teléfono del encargado es obligatorio.")
    .matches(/^\d{10}$/).withMessage("El teléfono del encargado debe tener exactamente 10 dígitos."),

  body("emailPersonaEncargada")
    .trim()
    .notEmpty().withMessage("El correo del encargado es obligatorio.")
    .isEmail().withMessage("El formato del correo del encargado es inválido.")
    .normalizeEmail()
    .custom(async (value) => {
      const proveedor = await db.Proveedor.findOne({
        where: { emailPersonaEncargada: value, estado: true },
      });
      if (proveedor) {
        return Promise.reject("El correo del encargado ya está registrado.");
      }
    }),

  handleValidationErrors,
];

// --- Validador para ACTUALIZAR ---
const actualizarProveedorValidators = [
  param("idProveedor")
    .isInt({ gt: 0 })
    .withMessage("El ID del proveedor es inválido. Debe ser un número entero positivo."),
  
  body("nombre")
    .optional()
    .trim()
    .notEmpty().withMessage("El nombre del proveedor es un campo obligatorio.")
    .isLength({ min: 3 }).withMessage("El nombre del proveedor debe tener al menos 3 caracteres.")
    .matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/).withMessage("El nombre del proveedor solo puede contener letras y espacios."),
  
  body("tipo")
    .optional()
    .trim()
    .notEmpty().withMessage("El tipo de proveedor es un campo obligatorio."),
  
  body("telefono")
    .optional()
    .trim()
    .notEmpty().withMessage("El teléfono del proveedor es un campo obligatorio.")
    .matches(/^\d{10}$/).withMessage("El teléfono del proveedor debe tener exactamente 10 dígitos."),
  
  body("direccion")
    .optional()
    .trim()
    .notEmpty().withMessage("La dirección del proveedor es un campo obligatorio.")
    .isLength({ min: 5 }).withMessage("La dirección debe tener al menos 5 caracteres.")
    .matches(/^(Calle|Cl\.?|Carrera|Cra\.?|Avenida|Av\.?|Transversal|Tv\.?|Diagonal|Dg\.?|Circular|Cir\.?|Kilómetro|Km\.?)\s+[A-Za-z0-9]+(?:\s+#\s*[A-Za-z0-9]+(?:\s*-\s*[A-Za-z0-9]+)?)?$/i)
    .withMessage("La dirección debe iniciar con un tipo de vía válido (ej: Calle, Carrera, Av., Cra., etc.) seguido de un número y un numeral."),
  
  body("nombrePersonaEncargada")
    .optional()
    .trim()
    .notEmpty().withMessage("El nombre del encargado no puede estar vacío.")
    .isLength({ min: 3 }).withMessage("El nombre del encargado debe tener al menos 3 caracteres.")
    .matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/).withMessage("El nombre del encargado solo puede contener letras y espacios."),

  body("telefonoPersonaEncargada")
    .optional()
    .trim()
    .notEmpty().withMessage("El teléfono del encargado es obligatorio.")
    .matches(/^\d{10}$/).withMessage("El teléfono del encargado debe tener exactamente 10 dígitos."),

  body("correo")
    .optional()
    .isEmail().withMessage("El formato del correo electrónico es inválido.")
    .normalizeEmail()
    .custom(async (value, { req }) => {
      if (value === null) return true;
      const proveedor = await db.Proveedor.findOne({
        where: {
          correo: value,
          idProveedor: { [Op.ne]: req.params.idProveedor },
        },
      });
      if (proveedor)
        return Promise.reject("El correo electrónico ya está en uso por otro proveedor.");
    }),

  body("emailPersonaEncargada")
    .trim()
    .notEmpty().withMessage("El correo del encargado es obligatorio.")
    .isEmail().withMessage("El formato del correo del encargado es inválido.")
    .normalizeEmail()
    .custom(async (value, { req }) => {
      const proveedor = await db.Proveedor.findOne({
        where: {
          emailPersonaEncargada: value,
          idProveedor: { [Op.ne]: req.params.idProveedor },
        },
      });
      if (proveedor) {
        return Promise.reject("El correo del encargado ya está registrado.");
      }
    }),

  body("numeroDocumento")
    .trim()
    .customSanitizer(emptyStringToNull)
    .optional({ nullable: true })
    .custom(async (value, { req }) => {
      if (value === null) return true;
      const proveedor = await db.Proveedor.findOne({
        where: {
          numeroDocumento: value,
          idProveedor: { [Op.ne]: req.params.idProveedor },
        },
      });
      if (proveedor)
        return Promise.reject("El número de documento ya está en uso. Por favor, ingrese uno diferente.");
    }),
  
  body("nitEmpresa")
    .trim()
    .customSanitizer(emptyStringToNull)
    .optional({ nullable: true })
    .custom(async (value, { req }) => {
      if (value === null) return true;
      const proveedor = await db.Proveedor.findOne({
        where: {
          nitEmpresa: value,
          idProveedor: { [Op.ne]: req.params.idProveedor },
        },
      });
      if (proveedor) return Promise.reject("El NIT de la empresa ya está en uso. Por favor, ingrese uno diferente.");
    }),

  body("estado")
    .optional()
    .isBoolean()
    .withMessage("El estado debe ser un valor booleano (true/false)."),
  
  handleValidationErrors,
];

const idProveedorValidator = [
  param("idProveedor")
    .isInt({ gt: 0 })
    .withMessage("El ID de proveedor debe ser un entero positivo válido."),
  handleValidationErrors,
];

const cambiarEstadoProveedorValidators = [
  param("idProveedor")
    .isInt({ gt: 0 })
    .withMessage("El ID de proveedor es inválido."),
  body("estado")
    .exists({ checkFalsy: false })
    .withMessage("El campo 'estado' es obligatorio para esta operación.")
    .isBoolean()
    .withMessage("El estado debe ser un valor booleano (true/false)."),
  handleValidationErrors,
];

module.exports = {
  crearProveedorValidators,
  actualizarProveedorValidators,
  idProveedorValidator,
  cambiarEstadoProveedorValidators,
};
