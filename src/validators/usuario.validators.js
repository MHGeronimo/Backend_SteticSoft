// src/validators/usuario.validators.js
const { body, param } = require('express-validator');
const { handleValidationErrors } = require('../middlewares/validation.middleware.js'); // Ajusta la ruta
const db = require('../models'); // Para validaciones personalizadas que consultan la BD

const crearUsuarioValidators = [
  body('correo')
    .trim()
    .notEmpty().withMessage('El correo electrónico es obligatorio.')
    .isEmail().withMessage('Debe proporcionar un correo electrónico válido.')
    .normalizeEmail()
    .custom(async (value) => { // Validación personalizada para verificar si el correo ya existe
      const usuarioExistente = await db.Usuario.findOne({ where: { correo: value } });
      if (usuarioExistente) {
        return Promise.reject('El correo electrónico ya está registrado.');
      }
    }),
  body('contrasena')
    .notEmpty().withMessage('La contraseña es obligatoria.')
    .isString().withMessage('La contraseña debe ser una cadena de texto.')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.')
    // Podrías añadir más validaciones para la contraseña (mayúsculas, números, símbolos) si lo deseas
    // .matches(/\d/).withMessage('La contraseña debe contener al menos un número.')
    // .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una mayúscula.')
    // .matches(/[a-z]/).withMessage('La contraseña debe contener al menos una minúscula.')
    // .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('La contraseña debe contener al menos un símbolo especial.'),
  ,body('idRol')
    .notEmpty().withMessage('El ID del rol es obligatorio.')
    .isInt({ gt: 0 }).withMessage('El ID del rol debe ser un entero positivo.')
    .custom(async (value) => { // Validación personalizada para verificar si el rol existe y está activo
      const rolExistente = await db.Rol.findOne({ where: { idRol: value, estado: true } });
      if (!rolExistente) {
        return Promise.reject('El rol especificado no existe o no está activo.');
      }
    }),
  body('estado')
    .optional()
    .isBoolean().withMessage('El estado debe ser un valor booleano (true o false).'),
  handleValidationErrors
];

const actualizarUsuarioValidators = [
  param('idUsuario')
    .isInt({ gt: 0 }).withMessage('El ID del usuario debe ser un entero positivo.'),
  body('correo')
    .optional()
    .trim()
    .isEmail().withMessage('Debe proporcionar un correo electrónico válido si se actualiza.')
    .normalizeEmail()
    .custom(async (value, { req }) => { // Verificar si el nuevo correo ya está en uso por OTRO usuario
      const idUsuario = Number(req.params.idUsuario);
      const usuarioExistente = await db.Usuario.findOne({
        where: {
          correo: value,
          idUsuario: { [db.Sequelize.Op.ne]: idUsuario } // [Op.ne] = Not Equal
        }
      });
      if (usuarioExistente) {
        return Promise.reject('El correo electrónico ya está registrado por otro usuario.');
      }
    }),
  body('contrasena')
    .optional() // La contraseña es opcional al actualizar; solo se cambia si se proporciona
    .isString().withMessage('La contraseña debe ser una cadena de texto.')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres si se actualiza.'),
    // Podrías repetir las validaciones de complejidad de contraseña aquí si es necesario
  body('idRol')
    .optional()
    .isInt({ gt: 0 }).withMessage('El ID del rol debe ser un entero positivo si se actualiza.')
    .custom(async (value) => {
      if (value) { // Solo validar si se proporciona un idRol
        const rolExistente = await db.Rol.findOne({ where: { idRol: value, estado: true } });
        if (!rolExistente) {
          return Promise.reject('El rol especificado para actualizar no existe o no está activo.');
        }
      }
    }),
  body('estado')
    .optional()
    .isBoolean().withMessage('El estado debe ser un valor booleano (true o false).'),
  handleValidationErrors
];

const idUsuarioValidator = [
  param('idUsuario')
    .isInt({ gt: 0 }).withMessage('El ID del usuario debe ser un entero positivo.'),
  handleValidationErrors
];

module.exports = {
  crearUsuarioValidators,
  actualizarUsuarioValidators,
  idUsuarioValidator,
};