// src/validators/cliente.validators.js
const { body, param } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");

// --- Expresiones Regulares para Validación ---
const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
const numericOnlyRegex = /^\d+$/;
const addressRegex = /^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñ\s.,#\-_]+$/;

// --- Validador para CREAR Cliente (POST /) ---
// Se enfoca en validar los datos del perfil del cliente.
// La creación del usuario asociado se maneja en el controlador.
const clienteCreateValidators = [
  body("nombre")
    .trim()
    .notEmpty().withMessage("El nombre es obligatorio.")
    .isLength({ min: 3, max: 100 }).withMessage("El nombre debe tener entre 3 y 100 caracteres.")
    .matches(nameRegex).withMessage("El nombre solo puede contener letras y espacios."),

  body("apellido")
    .trim()
    .notEmpty().withMessage("El apellido es obligatorio.")
    .isLength({ min: 3, max: 100 }).withMessage("El apellido debe tener entre 3 y 100 caracteres.")
    .matches(nameRegex).withMessage("El apellido solo puede contener letras y espacios."),

  body("correo")
    .trim()
    .notEmpty().withMessage("El correo electrónico es obligatorio.")
    .isEmail().withMessage("El formato del correo no es válido.")
    .normalizeEmail()
    .custom(async (value) => {
      // Verifica que el correo no esté ya registrado en la tabla de clientes.
      const cliente = await db.Cliente.findOne({ where: { correo: value } });
      if (cliente) {
        return Promise.reject("Este correo electrónico ya está registrado para un cliente.");
      }
    }),

  body("telefono")
    .trim()
    .notEmpty().withMessage("El teléfono es obligatorio.")
    .isLength({ min: 7, max: 15 }).withMessage("El teléfono debe tener entre 7 y 15 dígitos.")
    .matches(numericOnlyRegex).withMessage("El teléfono solo puede contener números."),

  body("tipoDocumento")
    .trim()
    .notEmpty().withMessage("El tipo de documento es obligatorio.")
    .isIn(["Cédula de Ciudadanía", "Cédula de Extranjería", "Pasaporte", "Tarjeta de Identidad"])
    .withMessage("Tipo de documento no válido."),

  body("numeroDocumento")
    .trim()
    .notEmpty().withMessage("El número de documento es obligatorio.")
    .isLength({ min: 5, max: 20 }).withMessage("El número de documento debe tener entre 5 y 20 caracteres.")
    .custom(async (value) => {
      // Verifica que el número de documento no esté ya registrado.
      const cliente = await db.Cliente.findOne({ where: { numeroDocumento: value } });
      if (cliente) {
        return Promise.reject("Este número de documento ya está registrado.");
      }
    }),

  body("fechaNacimiento")
    .notEmpty().withMessage("La fecha de nacimiento es obligatoria.")
    .isISO8601().withMessage("Formato de fecha no válido (debe ser YYYY-MM-DD).")
    .toDate(),

  body("direccion")
    .trim()
    .notEmpty().withMessage("La dirección es obligatoria.")
    .isLength({ min: 5, max: 255 }).withMessage("La dirección debe tener entre 5 y 255 caracteres.")
    .matches(addressRegex).withMessage("La dirección contiene caracteres no permitidos."),

  // La contraseña se valida en el controlador o servicio al crear el usuario
  body("contrasena")
    .notEmpty().withMessage("La contraseña es obligatoria para la creación de la cuenta de usuario.")
    .isLength({ min: 8 }).withMessage("La contraseña debe tener al menos 8 caracteres."),

  handleValidationErrors,
];

// --- Validador para ACTUALIZAR Cliente (PUT /:idCliente) ---
const clienteUpdateValidators = [
  // 1. Validar el ID del parámetro de la ruta
  param("idCliente").isInt({ gt: 0 }).withMessage("El ID del cliente es inválido."),

  // 2. Validar los campos opcionales del cuerpo de la solicitud
  body("nombre")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage("El nombre debe tener entre 3 y 100 caracteres.")
    .matches(nameRegex).withMessage("El nombre solo puede contener letras y espacios."),

  body("apellido")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage("El apellido debe tener entre 3 y 100 caracteres.")
    .matches(nameRegex).withMessage("El apellido solo puede contener letras y espacios."),

  body("correo")
    .optional()
    .trim()
    .isEmail().withMessage("El formato del correo no es válido.")
    .normalizeEmail()
    .custom(async (value, { req }) => {
      const idCliente = req.params.idCliente;
      // Busca si otro cliente (uno con un ID diferente) ya está usando este correo.
      const cliente = await db.Cliente.findOne({
        where: {
          correo: value,
          idCliente: { [db.Sequelize.Op.ne]: idCliente }, // Excluir el cliente actual
        },
      });
      if (cliente) {
        return Promise.reject("Este correo electrónico ya está en uso por otro cliente.");
      }
    }),

  body("telefono")
    .optional()
    .trim()
    .isLength({ min: 7, max: 15 }).withMessage("El teléfono debe tener entre 7 y 15 dígitos.")
    .matches(numericOnlyRegex).withMessage("El teléfono solo puede contener números."),

  body("tipoDocumento")
    .optional()
    .trim()
    .isIn(["Cédula de Ciudadanía", "Cédula de Extranjería", "Pasaporte", "Tarjeta de Identidad"])
    .withMessage("Tipo de documento no válido."),

  body("numeroDocumento")
    .optional()
    .trim()
    .isLength({ min: 5, max: 20 }).withMessage("El número de documento debe tener entre 5 y 20 caracteres.")
    .custom(async (value, { req }) => {
      const idCliente = req.params.idCliente;
      // Busca si otro cliente (uno con un ID diferente) ya está usando este número de documento.
      const cliente = await db.Cliente.findOne({
        where: {
          numeroDocumento: value,
          idCliente: { [db.Sequelize.Op.ne]: idCliente }, // Excluir el cliente actual
        },
      });
      if (cliente) {
        return Promise.reject("Este número de documento ya está en uso por otro cliente.");
      }
    }),

  body("fechaNacimiento")
    .optional()
    .isISO8601().withMessage("Formato de fecha no válido (debe ser YYYY-MM-DD).")
    .toDate(),

  body("direccion")
    .optional()
    .trim()
    .isLength({ min: 5, max: 255 }).withMessage("La dirección debe tener entre 5 y 255 caracteres.")
    .matches(addressRegex).withMessage("La dirección contiene caracteres no permitidos."),

  body("estado")
    .optional()
    .isBoolean().withMessage("El estado debe ser un valor booleano (true o false)."),

  handleValidationErrors,
];

// Validador genérico para rutas que solo usan el ID del cliente
const idClienteValidator = [
  param("idCliente").isInt({ gt: 0 }).withMessage("El ID del cliente debe ser un entero positivo."),
  handleValidationErrors,
];

// Validador para el cambio de estado
const cambiarEstadoClienteValidators = [
  param("idCliente").isInt({ gt: 0 }).withMessage("El ID del cliente debe ser un entero positivo."),
  body("estado").isBoolean().withMessage("El valor de 'estado' debe ser un booleano."),
  handleValidationErrors,
];

module.exports = {
  clienteCreateValidators,
  clienteUpdateValidators,
  idClienteValidator,
  cambiarEstadoClienteValidators,
  // Se mantiene compatibilidad con nombres anteriores si es necesario
  crearClienteValidators: clienteCreateValidators,
  actualizarClienteValidators: clienteUpdateValidators,
};
