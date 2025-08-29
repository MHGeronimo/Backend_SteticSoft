// src/shared/src_api/validators/usuario.validators.js
const { body, param, query } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");

// --- Expresiones Regulares para Validación Estricta ---
const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
const numericOnlyRegex = /^\d+$/; // Para campos que solo deben ser números
const alphanumericRegex = /^[a-zA-Z0-9]+$/; // Para campos alfanuméricos
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const addressRegex = /^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñ\s.,#\-_]+$/;

// --- Validador para CREAR Usuario ---
const crearUsuarioValidators = [
  body("correo")
    .trim()
    .notEmpty().withMessage("El correo electrónico es obligatorio.")
    .isEmail().withMessage("El formato del correo no es válido.")
    .matches(emailRegex).withMessage("El correo electrónico no tiene un formato válido.")
    .normalizeEmail()
    .custom(async (value) => {
      const usuario = await db.Usuario.findOne({ where: { correo: value } });
      if (usuario) {
        return Promise.reject("Este correo electrónico ya está registrado.");
      }
    }),
  body("contrasena")
    .notEmpty().withMessage("La contraseña es obligatoria.")
    .isLength({ min: 8 }).withMessage("La contraseña debe tener al menos 8 caracteres.")
    .matches(passwordRegex).withMessage(
      "La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial."
    ),
  body("idRol")
    .notEmpty().withMessage("Debe seleccionar un rol.")
    .isInt({ gt: 0 }).withMessage("El ID del rol no es válido."),
  body().custom(async (value, { req }) => {
    if (!req.body.idRol) return true;
    const rol = await db.Rol.findByPk(req.body.idRol);
    if (rol && (rol.tipoPerfil === "CLIENTE" || rol.tipoPerfil === "EMPLEADO")) {
      const requiredFields = {
        nombre: "El nombre es obligatorio.",
        apellido: "El apellido es obligatorio.",
        telefono: "El teléfono es obligatorio.",
        tipoDocumento: "El tipo de documento es obligatorio.",
        numeroDocumento: "El número de documento es obligatorio.",
        fechaNacimiento: "La fecha de nacimiento es obligatoria.",
      };
      if (rol.tipoPerfil === "CLIENTE") {
        requiredFields.direccion = "La dirección es obligatoria.";
      }
      for (const field in requiredFields) {
        if (!req.body[field] || String(req.body[field]).trim() === "") {
          throw new Error(requiredFields[field]);
        }
      }
    }
    return true;
  }),
  body("nombre").optional({ checkFalsy: true }).trim().matches(nameRegex).withMessage("El nombre solo debe contener letras y espacios.").isLength({ min: 2, max: 100 }),
  body("apellido").optional({ checkFalsy: true }).trim().matches(nameRegex).withMessage("El apellido solo debe contener letras y espacios.").isLength({ min: 2, max: 100 }),
  body("telefono")
    .optional({ checkFalsy: true })
    .trim()
    .matches(numericOnlyRegex).withMessage("El teléfono solo puede contener números.")
    .isLength({ min: 7, max: 15 }).withMessage("El teléfono debe tener entre 7 y 15 dígitos."),
  body("tipoDocumento").optional({ checkFalsy: true }).isIn(["Cédula de Ciudadanía", "Cédula de Extranjería", "Pasaporte", "Tarjeta de Identidad"]),
  body("numeroDocumento").optional({ checkFalsy: true }).trim().isLength({ min: 5, max: 20 }).withMessage("El documento debe tener entre 5 y 20 caracteres.").custom((value, { req }) => {
      const docType = req.body.tipoDocumento;
      if (docType === "Cédula de Ciudadanía" || docType === "Tarjeta de Identidad" || docType === "Cédula de Extranjería") {
        if (!numericOnlyRegex.test(value)) { throw new Error("Para este tipo de documento, ingrese solo números."); }
      } else if (docType === "Pasaporte") {
        if (!alphanumericRegex.test(value)) { throw new Error("Para Pasaporte, ingrese solo letras y números."); }
      }
      return true;
  }),
  body("fechaNacimiento").optional({ checkFalsy: true }).customSanitizer((value) => {
      if (value && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        const [day, month, year] = value.split("/");
        return `${year}-${month}-${day}`;
      }
      return value;
    }).isISO8601().withMessage("La fecha de nacimiento no es válida.").custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; }
      if (age < 18) { throw new Error("El usuario debe ser mayor de 18 años."); }
      return true;
    }).toDate(),
  body("direccion").optional({ checkFalsy: true }).trim().isLength({ min: 5, max: 255 }).withMessage("La dirección debe tener entre 5 y 255 caracteres.").matches(addressRegex).withMessage("La dirección contiene caracteres no permitidos."),
  handleValidationErrors,
];

// --- Validador para ACTUALIZAR Usuario ---
const actualizarUsuarioValidators = [
  param("idUsuario").isInt({ gt: 0 }).withMessage("El ID de usuario es inválido."),
  body("correo").optional().trim().isEmail().normalizeEmail().matches(emailRegex).custom(async (value, { req }) => {
      const usuario = await db.Usuario.findOne({
        where: {
          correo: value,
          idUsuario: { [db.Sequelize.Op.ne]: req.params.idUsuario },
        },
      });
      if (usuario) { return Promise.reject("Este correo ya está en uso por otro usuario."); }
  }),
  body("idRol").optional().isInt({ gt: 0 }),
  body("estado").optional().isBoolean(),
  body().custom(async (value, { req }) => {
    if (!req.body.idRol) return true;
    const rol = await db.Rol.findByPk(req.body.idRol);
    if (rol && (rol.tipoPerfil === "CLIENTE" || rol.tipoPerfil === "EMPLEADO")) {
      const requiredFields = [ "nombre", "apellido", "telefono", "tipoDocumento", "numeroDocumento", "fechaNacimiento" ];
      if (rol.tipoPerfil === "CLIENTE") {
        requiredFields.push("direccion");
      }
      for (const field of requiredFields) {
        if (req.body[field] !== undefined && String(req.body[field]).trim() === "") {
          throw new Error(`El campo '${field}' no puede estar vacío si se proporciona.`);
        }
      }
    }
    return true;
  }),
  body("nombre").optional({ checkFalsy: true }).trim().matches(nameRegex).withMessage("El nombre solo debe contener letras y espacios.").isLength({ min: 2, max: 100 }),
  body("apellido").optional({ checkFalsy: true }).trim().matches(nameRegex).withMessage("El apellido solo debe contener letras y espacios.").isLength({ min: 2, max: 100 }),
  body("telefono").optional({ checkFalsy: true }).trim().matches(numericOnlyRegex).withMessage("El teléfono solo puede contener números.").isLength({ min: 7, max: 15 }).withMessage("El teléfono debe tener entre 7 y 15 dígitos."),
  body("tipoDocumento").optional({ checkFalsy: true }).isIn(["Cédula de Ciudadanía", "Cédula de Extranjería", "Pasaporte", "Tarjeta de Identidad"]),
  
  // CORRECCIÓN CRÍTICA: Añadida validación de unicidad para numeroDocumento
  body("numeroDocumento").optional({ checkFalsy: true }).trim().isLength({ min: 5, max: 20 }).withMessage("El documento debe tener entre 5 y 20 caracteres.")
    .custom((value, { req }) => {
      const docType = req.body.tipoDocumento;
      if (docType === "Cédula de Ciudadanía" || docType === "Tarjeta de Identidad" || docType === "Cédula de Extranjería") {
        if (!numericOnlyRegex.test(value)) { throw new Error("Para este tipo de documento, ingrese solo números."); }
      } else if (docType === "Pasaporte") {
        if (!alphanumericRegex.test(value)) { throw new Error("Para Pasaporte, ingrese solo letras y números."); }
      }
      return true;
    })
    .custom(async (value, { req }) => {
      if (!value || !req.body.idRol) return true;
      const rol = await db.Rol.findByPk(req.body.idRol);
      if (!rol || (rol.tipoPerfil !== 'CLIENTE' && rol.tipoPerfil !== 'EMPLEADO')) return true;

      const model = rol.tipoPerfil === 'CLIENTE' ? db.Cliente : db.Empleado;
      const profile = await model.findOne({
          where: {
              numeroDocumento: value,
              idUsuario: { [db.Sequelize.Op.ne]: req.params.idUsuario }
          }
      });
      if (profile) {
          return Promise.reject(`Este número de documento ya está registrado para otro ${rol.tipoPerfil.toLowerCase()}.`);
      }
    }),
  
  body("fechaNacimiento").optional({ checkFalsy: true }).customSanitizer((value) => {
      if (value && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        const [day, month, year] = value.split("/");
        return `${year}-${month}-${day}`;
      }
      return value;
    }).isISO8601().withMessage("La fecha de nacimiento no es válida.").custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; }
      if (age < 18) { throw new Error("El usuario debe ser mayor de 18 años."); }
      return true;
    }).toDate(),
  body("direccion").optional({ checkFalsy: true }).trim().isLength({ min: 5, max: 255 }).withMessage("La dirección debe tener entre 5 y 255 caracteres.").matches(addressRegex).withMessage("La dirección contiene caracteres no permitidos."),
  handleValidationErrors,
];

// --- Otros Validadores (Sin cambios) ---
const idUsuarioValidator = [ param("idUsuario").isInt({ gt: 0 }).withMessage("El ID de usuario debe ser un entero positivo."), handleValidationErrors, ];
const cambiarEstadoUsuarioValidators = [ param("idUsuario").isInt({ gt: 0 }).withMessage("El ID de usuario debe ser un entero positivo."), body("estado").exists({ checkFalsy: false }).withMessage("El campo 'estado' es obligatorio.").isBoolean().withMessage("El valor de 'estado' debe ser un booleano."), handleValidationErrors, ];
const verificarCorreoValidators = [ query("correo").trim().notEmpty().withMessage("El correo es requerido.").isEmail().withMessage("Debe proporcionar un correo electrónico válido.").normalizeEmail(), handleValidationErrors, ];

module.exports = {
  crearUsuarioValidators,
  actualizarUsuarioValidators,
  idUsuarioValidator,
  cambiarEstadoUsuarioValidators,
  verificarCorreoValidators,
};