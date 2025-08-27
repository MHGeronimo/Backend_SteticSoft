// src/validators/auth.validators.js
const { body } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");

// Expresión regular para nombres y apellidos que permite letras, acentos y espacios.
const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;

const registrarUsuarioValidators = [
  // --- Campos de Usuario (Cuenta) ---
  body("correo")
    .trim()
    .notEmpty().withMessage("El correo electrónico es obligatorio.")
    .isEmail().withMessage("Debe proporcionar un correo electrónico válido.")
    .normalizeEmail()
    .custom(async (value) => {
      const usuarioExistente = await db.Usuario.findOne({ where: { correo: value } });
      if (usuarioExistente) {
        return Promise.reject("El correo electrónico ya está registrado para una cuenta.");
      }
    }),
  body("contrasena")
    .notEmpty().withMessage("La contraseña es obligatoria.")
    .isLength({ min: 8 }).withMessage("La contraseña debe tener al menos 8 caracteres."),

  // --- Campos de Cliente (Perfil) ---
  body("nombre")
    .trim()
    .notEmpty().withMessage("El nombre es obligatorio.")
    // MODIFICACIÓN: Longitud estándar y validación de caracteres.
    .isLength({ min: 3, max: 50 }).withMessage("El nombre debe tener entre 3 y 50 caracteres.")
    .matches(nameRegex).withMessage("El nombre solo puede contener letras y espacios."),
  body("apellido")
    .trim()
    .notEmpty().withMessage("El apellido es obligatorio.")
    // MODIFICACIÓN: Longitud estándar y validación de caracteres.
    .isLength({ min: 3, max: 50 }).withMessage("El apellido debe tener entre 3 y 50 caracteres.")
    .matches(nameRegex).withMessage("El apellido solo puede contener letras y espacios."),
  body("telefono")
    .trim()
    .notEmpty().withMessage("El teléfono es obligatorio.")
    // MODIFICACIÓN: Longitud ajustada y validación numérica.
    .isLength({ min: 7, max: 15 }).withMessage("El teléfono debe tener entre 7 y 15 dígitos.")
    .isNumeric().withMessage("El teléfono solo puede contener números."),
  body("tipoDocumento")
    .trim()
    .notEmpty().withMessage("El tipo de documento es obligatorio."),
  body("numeroDocumento")
    .trim()
    .notEmpty().withMessage("El número de documento es obligatorio.")
    .isLength({ min: 5, max: 20 }).withMessage("El número de documento debe tener entre 5 y 20 caracteres.")
    .custom(async (value) => {
      const clienteExistente = await db.Cliente.findOne({ where: { numeroDocumento: value } });
      if (clienteExistente) {
        return Promise.reject("El número de documento ya está registrado para otro cliente.");
      }
    }),
  body("fechaNacimiento")
    .notEmpty().withMessage("La fecha de nacimiento es obligatoria.")
    .isISO8601().withMessage("La fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD).")
    .toDate(),
  handleValidationErrors,
];

const loginValidators = [
  body("correo")
    .trim()
    .notEmpty().withMessage("El correo electrónico es obligatorio.")
    .isEmail().withMessage("Debe ser un correo electrónico válido.")
    .normalizeEmail(),
  body("contrasena")
    .notEmpty().withMessage("La contraseña es obligatoria."),
  handleValidationErrors,
];

// ... (el resto de validadores de auth.validators.js se mantienen igual)
const solicitarRecuperacionValidators = [
  body("correo")
    .trim()
    .notEmpty()
    .withMessage("El correo electrónico es obligatorio para la recuperación.")
    .isEmail()
    .withMessage("Debe proporcionar un correo electrónico válido.")
    .normalizeEmail(),
  handleValidationErrors,
];

const resetearContrasenaValidators = [
  body("token")
    .trim()
    .notEmpty()
    .withMessage("El token de recuperación es obligatorio."),
  body("nuevaContrasena")
    .notEmpty()
    .withMessage("La nueva contraseña es obligatoria.")
    .isString()
    .withMessage("La nueva contraseña debe ser una cadena de texto.")
    .isLength({ min: 8 })
    .withMessage("La nueva contraseña debe tener al menos 8 caracteres."),
  body("confirmarNuevaContrasena")
    .notEmpty()
    .withMessage("La confirmación de la nueva contraseña es obligatoria.")
    .custom((value, { req }) => {
      if (value !== req.body.nuevaContrasena) {
        throw new Error(
          "La confirmación de la contraseña no coincide con la nueva contraseña."
        );
      }
      return true;
    }),
  handleValidationErrors,
];

module.exports = {
  registrarUsuarioValidators,
  loginValidators,
  solicitarRecuperacionValidators,
  resetearContrasenaValidators,
};