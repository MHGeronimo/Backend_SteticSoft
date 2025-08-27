// src/shared/src_api/validators/cliente.validators.js
const { body, param } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");

const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;

const crearClienteValidators = [
  // --- Campos para el Perfil del Cliente ---
  body("nombre")
    .trim().notEmpty().withMessage("El nombre es obligatorio.")
    .isLength({ min: 3, max: 50 }).withMessage("El nombre debe tener entre 3 y 50 caracteres.")
    .matches(nameRegex).withMessage("El nombre solo puede contener letras y espacios."),
  body("apellido")
    .trim().notEmpty().withMessage("El apellido es obligatorio.")
    .isLength({ min: 3, max: 50 }).withMessage("El apellido debe tener entre 3 y 50 caracteres.")
    .matches(nameRegex).withMessage("El apellido solo puede contener letras y espacios."),
  body("telefono")
    .trim().notEmpty().withMessage("El teléfono es obligatorio.")
    .isLength({ min: 7, max: 15 }).withMessage("El teléfono debe tener entre 7 y 15 dígitos.")
    .isNumeric().withMessage("El teléfono solo puede contener números."),
  body("tipoDocumento")
    .trim().notEmpty().withMessage("El tipo de documento es obligatorio."),
  body("numeroDocumento")
    .trim().notEmpty().withMessage("El número de documento es obligatorio.")
    .isLength({ min: 5, max: 20 }).withMessage("El número de documento debe tener entre 5 y 20 caracteres."),
  body("fechaNacimiento")
    .notEmpty().withMessage("La fecha de nacimiento es obligatoria.")
    .isISO8601().withMessage("Formato de fecha no válido (YYYY-MM-DD).").toDate(),
  body("direccion")
    .trim().notEmpty().withMessage("La dirección es obligatoria.")
    .isLength({ min: 5, max: 255 }).withMessage("La dirección debe tener entre 5 y 255 caracteres."),
  
  // --- Campos para la Cuenta de Usuario asociada ---
  body("correo")
    .trim().notEmpty().withMessage("El correo electrónico es obligatorio.")
    .isEmail().withMessage("Debe ser un correo electrónico válido.").normalizeEmail(),
  body("contrasena")
    .notEmpty().withMessage("La contraseña es obligatoria.")
    .isLength({ min: 8 }).withMessage("La contraseña debe tener al menos 8 caracteres."),
  
  handleValidationErrors,
];

// Validador para actualizar un cliente
const actualizarClienteValidators = [
  param("idCliente").isInt({ gt: 0 }).withMessage("El ID del cliente debe ser un entero positivo."),
  
  body("nombre").optional().trim().notEmpty().withMessage("El nombre no puede ser vacío si se provee.").isLength({ min: 2, max: 50 }),
  body("apellido").optional().trim().notEmpty().withMessage("El apellido no puede ser vacío si se provee.").isLength({ min: 2, max: 50 }),
  body("telefono").optional().trim().notEmpty().withMessage("El teléfono no puede ser vacío si se provee.").isLength({ min: 7, max: 20 }),
  body("tipoDocumento").optional().trim().notEmpty().withMessage("El tipo de documento no puede ser vacío si se provee.")
    .isIn(['Cédula de Ciudadanía', 'Cédula de Extranjería', 'Pasaporte', 'Tarjeta de Identidad']).withMessage("Tipo de documento no válido."),
  body("numeroDocumento").optional().trim().notEmpty().withMessage("El número de documento no puede ser vacío si se provee.").isLength({ min: 5, max: 45 })
    .custom(async (value, { req }) => {
      if (value) {
        const idCliente = Number(req.params.idCliente);
        const clienteExistente = await db.Cliente.findOne({
          where: { numeroDocumento: value, idCliente: { [db.Sequelize.Op.ne]: idCliente } },
        });
        if (clienteExistente) {
          return Promise.reject("El número de documento ya está registrado para otro cliente.");
        }
      }
    }),
  body("fechaNacimiento").optional().isISO8601().withMessage("La fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD) si se provee.").toDate(),
  body("direccion").optional().trim().isString().withMessage("La dirección debe ser una cadena de texto.")
    .isLength({ max: 255 }).withMessage("La dirección no puede tener más de 255 caracteres."),
  body("estadoCliente").optional().isBoolean().withMessage("El estado del perfil del cliente debe ser un valor booleano."),

  body("correo").optional({ checkFalsy: true })
    .trim().isEmail().withMessage("Debe ser un correo electrónico válido si se provee.")
    .normalizeEmail()
    .custom(async (value, { req }) => {
      if (value) {
        const idCliente = Number(req.params.idCliente);
        const otroClienteConCorreo = await db.Cliente.findOne({
          where: { correo: value, idCliente: { [db.Sequelize.Op.ne]: idCliente } },
        });
        if (otroClienteConCorreo) {
          return Promise.reject("El correo electrónico ya está registrado para otro perfil de cliente.");
        }
        const clienteActual = await db.Cliente.findByPk(idCliente);
        if (clienteActual && clienteActual.idUsuario) {
          const otroUsuarioConCorreo = await db.Usuario.findOne({
            where: { correo: value, idUsuario: { [db.Sequelize.Op.ne]: clienteActual.idUsuario } },
          });
          if (otroUsuarioConCorreo) {
            return Promise.reject("El correo electrónico ya está en uso por otra cuenta de usuario.");
          }
        }
      }
    }),
  body("estadoUsuario").optional().isBoolean().withMessage("El estado de la cuenta de usuario debe ser un valor booleano."),
  body("idUsuario")
    .optional({ nullable: true })
    .isInt({ gt: 0 })
    .withMessage("El ID de usuario debe ser un entero positivo si se proporciona, o null para desvincular.")
    .custom(async (value, { req }) => {
      if (value) {
        const idCliente = Number(req.params.idCliente);
        const usuario = await db.Usuario.findByPk(value);
        if (!usuario) {
          return Promise.reject("El usuario especificado para la asociación no existe.");
        }
        const otroClienteConEsteUsuario = await db.Cliente.findOne({
          where: {
            idUsuario: value,
            idCliente: { [db.Sequelize.Op.ne]: idCliente },
          },
        });
        if (otroClienteConEsteUsuario) {
          return Promise.reject("El ID de usuario ya está asociado a otro cliente.");
        }
      }
    }),
  handleValidationErrors,
];

const idClienteValidator = [
  param("idCliente").isInt({ gt: 0 }).withMessage("El ID del cliente debe ser un entero positivo."),
  handleValidationErrors,
];

const cambiarEstadoClienteValidators = [
  param("idCliente")
    .isInt({ gt: 0 })
    .withMessage("El ID del cliente debe ser un entero positivo."),
  body("estado")
    .exists({ checkFalsy: false })
    .withMessage("El campo 'estado' es obligatorio en el cuerpo de la solicitud.")
    .isBoolean()
    .withMessage("El valor de 'estado' debe ser un booleano (true o false)."),
  handleValidationErrors,
];

module.exports = {
  crearClienteValidators,
  actualizarClienteValidators,
  idClienteValidator,
  cambiarEstadoClienteValidators,
};