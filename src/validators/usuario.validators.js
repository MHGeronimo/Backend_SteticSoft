// src/validators/usuario.validators.js
const { body, param } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");

const crearUsuarioValidators = [
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
  body("idRol")
    .notEmpty()
    .withMessage("El ID del rol es obligatorio.")
    .isInt({ gt: 0 })
    .withMessage("El ID del rol debe ser un entero positivo.")
    .custom(async (value) => {
      const rolExistente = await db.Rol.findOne({
        where: { idRol: value, estado: true },
      });
      if (!rolExistente) {
        return Promise.reject(
          "El rol especificado no existe o no está activo."
        );
      }
    }),
  body("estado")
    .optional()
    .isBoolean()
    .withMessage("El estado debe ser un valor booleano (true o false)."),
  handleValidationErrors,
];

const actualizarUsuarioValidators = [
  param("idUsuario")
    .isInt({ gt: 0 })
    .withMessage("El ID del usuario debe ser un entero positivo."),
  body("correo")
    .optional()
    .trim()
    .isEmail()
    .withMessage(
      "Debe proporcionar un correo electrónico válido si se actualiza."
    )
    .normalizeEmail()
    .custom(async (value, { req }) => {
      const idUsuario = Number(req.params.idUsuario);
      const usuarioExistente = await db.Usuario.findOne({
        where: {
          correo: value,
          idUsuario: { [db.Sequelize.Op.ne]: idUsuario },
        },
      });
      if (usuarioExistente) {
        return Promise.reject(
          "El correo electrónico ya está registrado por otro usuario."
        );
      }
    }),
  body("contrasena")
    .optional()
    .isString()
    .withMessage("La contraseña debe ser una cadena de texto.")
    .isLength({ min: 8 })
    .withMessage(
      "La contraseña debe tener al menos 8 caracteres si se actualiza."
    ),
  body("idRol")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("El ID del rol debe ser un entero positivo si se actualiza.")
    .custom(async (value) => {
      if (value) {
        const rolExistente = await db.Rol.findOne({
          where: { idRol: value, estado: true },
        });
        if (!rolExistente) {
          return Promise.reject(
            "El rol especificado para actualizar no existe o no está activo."
          );
        }
      }
    }),
  body("estado")
    .optional()
    .isBoolean()
    .withMessage("El estado debe ser un valor booleano (true o false)."),
  handleValidationErrors,
];

const idUsuarioValidator = [
  param("idUsuario")
    .isInt({ gt: 0 })
    .withMessage("El ID del usuario debe ser un entero positivo."),
  handleValidationErrors,
];

// Nuevo validador para cambiar el estado
const cambiarEstadoUsuarioValidators = [
  param("idUsuario")
    .isInt({ gt: 0 })
    .withMessage("El ID del usuario debe ser un entero positivo."),
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
  crearUsuarioValidators,
  actualizarUsuarioValidators,
  idUsuarioValidator,
  cambiarEstadoUsuarioValidators, // <-- Exportar nuevo validador
};
