// src/validators/auth.validators.js
const { body } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");

const registrarUsuarioValidators = [
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
        return Promise.reject("El correo electrónico ya está registrado.");
      }
    }),
  body("contrasena")
    .notEmpty()
    .withMessage("La contraseña es obligatoria.")
    .isString()
    .withMessage("La contraseña debe ser una cadena de texto.")
    .isLength({ min: 8 })
    .withMessage("La contraseña debe tener al menos 8 caracteres."),
  // Aquí podrías añadir más validaciones de complejidad de contraseña
  // que también deberían estar en usuario.validators.js para consistencia si un admin crea usuarios.
  body("nombre") // Asumiendo que en el auto-registro se pide el nombre
    .optional() // O hacerlo obligatorio si es necesario para tu flujo de registro
    .trim()
    .isString()
    .withMessage("El nombre debe ser una cadena de texto.")
    .isLength({ min: 2, max: 45 })
    .withMessage("El nombre debe tener entre 2 y 45 caracteres."),
  body("apellido") // Asumiendo que en el auto-registro se pide el apellido
    .optional()
    .trim()
    .isString()
    .withMessage("El apellido debe ser una cadena de texto.")
    .isLength({ min: 2, max: 45 })
    .withMessage("El apellido debe tener entre 2 y 45 caracteres."),
  // Al auto-registrarse, el idRol podría ser fijo (ej. 'Cliente') o no pedirse si hay un default.
  // Si el usuario puede elegir rol al registrarse (menos común para autoregistro), añadir validación para idRol.
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
  // Añadir aquí las mismas validaciones de complejidad que en registrarUsuarioValidators y usuario.validators.js
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
