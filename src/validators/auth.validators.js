// src/validators/auth.validators.js
const { body } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");

const registrarUsuarioValidators = [
  // Campos de Usuario
  body("correo")
    .trim()
    .notEmpty()
    .withMessage("El correo electrónico es obligatorio.")
    .isEmail()
    .withMessage("Debe proporcionar un correo electrónico válido.")
    .normalizeEmail()
    .custom(async (value) => {
      const usuarioExistente = await db.Usuario.findOne({
        where: { correo: value },
      });
      if (usuarioExistente) {
        return Promise.reject(
          "El correo electrónico ya está registrado para una cuenta."
        );
      }
    }),
  body("contrasena")
    .notEmpty()
    .withMessage("La contraseña es obligatoria.")
    .isString()
    .withMessage("La contraseña debe ser una cadena de texto.")
    .isLength({ min: 8 })
    .withMessage("La contraseña debe tener al menos 8 caracteres."),
  // Aquí puedes añadir más reglas de complejidad para la contraseña

  // Campos de Cliente (obligatorios para el registro)
  body("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre es obligatorio.")
    .isString()
    .withMessage("El nombre debe ser una cadena de texto.")
    .isLength({ min: 2, max: 45 })
    .withMessage("El nombre debe tener entre 2 y 45 caracteres."),
  body("apellido")
    .trim()
    .notEmpty()
    .withMessage("El apellido es obligatorio.")
    .isString()
    .withMessage("El apellido debe ser una cadena de texto.")
    .isLength({ min: 2, max: 45 })
    .withMessage("El apellido debe tener entre 2 y 45 caracteres."),
  body("telefono")
    .trim()
    .notEmpty()
    .withMessage("El teléfono es obligatorio.") // Asumiendo que es obligatorio para el registro
    .isString()
    .withMessage("El teléfono debe ser una cadena de texto.")
    .isLength({ min: 7, max: 45 })
    .withMessage("El teléfono debe tener entre 7 y 45 caracteres."),
  body("tipoDocumento")
    .trim()
    .notEmpty()
    .withMessage("El tipo de documento es obligatorio.")
    .isString()
    .withMessage("El tipo de documento debe ser texto."),
  body("numeroDocumento")
    .trim()
    .notEmpty()
    .withMessage("El número de documento es obligatorio.")
    .isString()
    .withMessage("El número de documento debe ser texto.")
    .isLength({ min: 5, max: 45 })
    .withMessage("El número de documento debe tener entre 5 y 45 caracteres.")
    .custom(async (value) => {
      const clienteExistente = await db.Cliente.findOne({
        where: { numeroDocumento: value },
      });
      if (clienteExistente) {
        return Promise.reject(
          "El número de documento ya está registrado para otro cliente."
        );
      }
    }),
  body("fechaNacimiento")
    .notEmpty()
    .withMessage("La fecha de nacimiento es obligatoria.")
    .isISO8601()
    .withMessage(
      "La fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)."
    )
    .toDate(),
  // El idRol se asignará por defecto a 'Cliente' en el servicio, no se espera del usuario al registrarse.
  // El estado se asignará por defecto a 'true' en el servicio.
  handleValidationErrors,
];

const loginValidators = [
  body("correo")
    .trim()
    .notEmpty()
    .withMessage("El correo electrónico es obligatorio.")
    .isEmail()
    .withMessage("Debe ser un correo electrónico válido.")
    .normalizeEmail(),
  body("contrasena").notEmpty().withMessage("La contraseña es obligatoria."),
  handleValidationErrors,
];

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
