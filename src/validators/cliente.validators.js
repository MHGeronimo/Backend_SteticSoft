// src/validators/cliente.validators.js
const { body, param } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models"); // Para validaciones personalizadas

const crearClienteValidators = [
  body("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre del cliente es obligatorio.")
    .isString()
    .withMessage("El nombre del cliente debe ser texto.")
    .isLength({ min: 2, max: 45 })
    .withMessage("El nombre debe tener entre 2 y 45 caracteres."),
  body("apellido")
    .trim()
    .notEmpty()
    .withMessage("El apellido del cliente es obligatorio.")
    .isString()
    .withMessage("El apellido del cliente debe ser texto.")
    .isLength({ min: 2, max: 45 })
    .withMessage("El apellido debe tener entre 2 y 45 caracteres."),
  body("correo")
    .optional({ nullable: true, checkFalsy: true }) // Opcional, pero si se envía, se valida
    .trim()
    .isEmail()
    .withMessage(
      "Debe proporcionar un correo electrónico válido para el cliente."
    )
    .isLength({ max: 45 })
    .withMessage("El correo no debe exceder los 45 caracteres.")
    .normalizeEmail()
    .custom(async (value) => {
      if (value) {
        // Solo validar si se proporciona un correo
        const clienteExistente = await db.Cliente.findOne({
          where: { correo: value },
        });
        if (clienteExistente) {
          return Promise.reject(
            "El correo electrónico del cliente ya está registrado."
          );
        }
      }
    }),
  body("telefono")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString()
    .withMessage("El teléfono debe ser una cadena de texto.")
    .isLength({ min: 7, max: 45 })
    .withMessage("El teléfono debe tener entre 7 y 45 caracteres."),
  // Podrías añadir .isNumeric() o un regex si quieres un formato específico
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
    .toDate(), // Convierte a objeto Date de JavaScript
  body("idUsuario")
    .optional({ nullable: true }) // Un cliente puede o no estar asociado a un usuario al crearse
    .isInt({ gt: 0 })
    .withMessage(
      "El ID de usuario debe ser un entero positivo si se proporciona."
    )
    .custom(async (value) => {
      if (value) {
        const usuario = await db.Usuario.findByPk(value);
        if (!usuario) {
          return Promise.reject("El usuario especificado no existe.");
        }
        const clienteConEsteUsuario = await db.Cliente.findOne({
          where: { idUsuario: value },
        });
        if (clienteConEsteUsuario) {
          return Promise.reject(
            "El ID de usuario ya está asociado a otro cliente."
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

const actualizarClienteValidators = [
  param("idCliente")
    .isInt({ gt: 0 })
    .withMessage("El ID del cliente debe ser un entero positivo."),
  body("nombre")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("El nombre no puede ser vacío si se actualiza.")
    .isString()
    .withMessage("El nombre debe ser texto.")
    .isLength({ min: 2, max: 45 })
    .withMessage("El nombre debe tener entre 2 y 45 caracteres."),
  body("apellido")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("El apellido no puede ser vacío si se actualiza.")
    .isString()
    .withMessage("El apellido debe ser texto.")
    .isLength({ min: 2, max: 45 })
    .withMessage("El apellido debe tener entre 2 y 45 caracteres."),
  body("correo")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("Debe proporcionar un correo válido si se actualiza.")
    .isLength({ max: 45 })
    .withMessage("El correo no debe exceder los 45 caracteres.")
    .normalizeEmail()
    .custom(async (value, { req }) => {
      if (value) {
        const idCliente = Number(req.params.idCliente);
        const clienteExistente = await db.Cliente.findOne({
          where: {
            correo: value,
            idCliente: { [db.Sequelize.Op.ne]: idCliente },
          },
        });
        if (clienteExistente) {
          return Promise.reject(
            "El correo electrónico ya está registrado por otro cliente."
          );
        }
      }
    }),
  body("telefono")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString()
    .withMessage("El teléfono debe ser texto.")
    .isLength({ min: 7, max: 45 })
    .withMessage("El teléfono debe tener entre 7 y 45 caracteres."),
  body("tipoDocumento")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("El tipo de documento no puede ser vacío si se actualiza.")
    .isString()
    .withMessage("El tipo de documento debe ser texto."),
  body("numeroDocumento")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("El número de documento no puede ser vacío si se actualiza.")
    .isString()
    .withMessage("El número de documento debe ser texto.")
    .isLength({ min: 5, max: 45 })
    .withMessage("El número de documento debe tener entre 5 y 45 caracteres.")
    .custom(async (value, { req }) => {
      if (value) {
        const idCliente = Number(req.params.idCliente);
        const clienteExistente = await db.Cliente.findOne({
          where: {
            numeroDocumento: value,
            idCliente: { [db.Sequelize.Op.ne]: idCliente },
          },
        });
        if (clienteExistente) {
          return Promise.reject(
            "El número de documento ya está registrado por otro cliente."
          );
        }
      }
    }),
  body("fechaNacimiento")
    .optional()
    .notEmpty()
    .withMessage("La fecha de nacimiento no puede ser vacía si se actualiza.")
    .isISO8601()
    .withMessage(
      "La fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)."
    )
    .toDate(),
  body("idUsuario")
    .optional({ nullable: true })
    .isInt({ gt: 0 })
    .withMessage(
      "El ID de usuario debe ser un entero positivo si se proporciona, o null para desvincular."
    )
    .custom(async (value, { req }) => {
      if (value) {
        // Si se proporciona un idUsuario para actualizar
        const idCliente = Number(req.params.idCliente);
        const usuario = await db.Usuario.findByPk(value);
        if (!usuario) {
          return Promise.reject(
            "El usuario especificado para la asociación no existe."
          );
        }
        const otroClienteConEsteUsuario = await db.Cliente.findOne({
          where: {
            idUsuario: value,
            idCliente: { [db.Sequelize.Op.ne]: idCliente },
          },
        });
        if (otroClienteConEsteUsuario) {
          return Promise.reject(
            "El ID de usuario ya está asociado a otro cliente."
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

const idClienteValidator = [
  param("idCliente")
    .isInt({ gt: 0 })
    .withMessage("El ID del cliente debe ser un entero positivo."),
  handleValidationErrors,
];

module.exports = {
  crearClienteValidators,
  actualizarClienteValidators,
  idClienteValidator,
};
