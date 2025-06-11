// src/shared/src_api/validators/usuario.validators.js
const { body, param } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models"); // Ensure db is available

const crearUsuarioValidators = [
  // Validations for the User entity (existing and correct)
  body("correo")
    .trim().notEmpty().withMessage("The email address is required.")
    .isEmail().withMessage("You must provide a valid email address.")
    .normalizeEmail()
    .custom(async (value) => {
      const usuarioExistente = await db.Usuario.findOne({ where: { correo: value } });
      if (usuarioExistente) {
        return Promise.reject("The email address is already registered for a user account.");
      }
    }),
  body("contrasena")
    .notEmpty().withMessage("The password is required.")
    .isString().withMessage("The password must be a text string.")
    .isLength({ min: 8 }).withMessage("The password must be at least 8 characters long."),
  body("idRol")
    .notEmpty().withMessage("The role ID is required.")
    .isInt({ gt: 0 }).withMessage("The role ID must be a positive integer.")
    .custom(async (value) => {
      const rolExistente = await db.Rol.findOne({ where: { idRol: value, estado: true } });
      if (!rolExistente) {
        return Promise.reject("The specified role does not exist or is not active.");
      }
    }),
  body("estado").optional().isBoolean().withMessage("The status must be a boolean value (true or false)."),

  // Validations for Profile fields (Client/Employee)
  // These are marked as optional here, and the service (crearUsuario)
  // will check for mandatory fields based on the role.
  // Or, you can make them conditionally required here using .custom() if you prefer.

  body("nombre")
    .optional() // The service will check if it is required based on the role
    .trim()
    .notEmpty().withMessage("The name cannot be empty if provided.")
    .isString().withMessage("The name must be a text string.")
    .isLength({ min: 2, max: 100 }).withMessage("The name must be between 2 and 100 characters."),
  
  body("apellido")
    .optional() // The service will check if it is required based on the role
    .trim()
    .notEmpty().withMessage("The last name cannot be empty if provided.")
    .isString().withMessage("The last name must be a text string.")
    .isLength({ min: 2, max: 100 }).withMessage("The last name must be between 2 and 100 characters."),

  body("telefono")
    .optional() // The service will check if it is required based on the role
    .trim()
    .notEmpty().withMessage("The phone number cannot be empty if provided.")
    .isString().withMessage("The phone number must be a text string.") // You could add isNumeric or a specific regex if you want.
    .isLength({ min: 7, max: 45 }).withMessage("The phone number must be between 7 and 45 characters."),

  body("tipoDocumento")
    .optional() // The service will check if it is required based on the role
    .trim()
    .notEmpty().withMessage("The document type cannot be empty if provided.")
    .isString().withMessage("The document type must be text.")
    .isIn(['Cédula de Ciudadanía', 'Cédula de Extranjería', 'Pasaporte', 'Tarjeta de Identidad']) // Example of allowed values
    .withMessage("Invalid document type."),

  body("numeroDocumento")
    .optional() // The service will check if it is required based on the role
    .trim()
    .notEmpty().withMessage("The document number cannot be empty if provided.")
    .isString().withMessage("The document number must be text.")
    .isLength({ min: 5, max: 45 }).withMessage("The document number must be between 5 and 45 characters.")
    .custom(async (value, { req }) => {
        if (!value) return true; // If optional and not provided, do not custom validate

        const idRol = req.body.idRol;
        if (!idRol) return true; // If no role, we cannot determine the profile type
        
        const rol = await db.Rol.findByPk(idRol);
        if (!rol) return true; // If the role does not exist, another validation will catch it

        if (rol.nombre === 'Cliente') {
            const clienteExistente = await db.Cliente.findOne({ where: { numeroDocumento: value } });
            if (clienteExistente) {
                return Promise.reject("The document number is already registered for a client.");
            }
        } else if (rol.nombre === 'Empleado') {
            // Assuming you already have the Employee-User relationship and the Employee table with numeroDocumento
            const empleadoExistente = await db.Empleado.findOne({ where: { numeroDocumento: value } });
            if (empleadoExistente) {
                return Promise.reject("The document number is already registered for an employee.");
            }
        }
        return true;
    }),

  body("fechaNacimiento")
    .optional() // The service will check if it is required based on the role
    .isISO8601().withMessage("The date of birth must be a valid date (YYYY-MM-DD).")
    .toDate(), // Converts to Date object
  
  handleValidationErrors,
];

const actualizarUsuarioValidators = [
  param("idUsuario")
    .isInt({ gt: 0 })
    .withMessage("The user ID must be a positive integer."),
  body("correo")
    .optional()
    .trim()
    .isEmail()
    .withMessage("You must provide a valid email address if updating.")
    .normalizeEmail()
    .custom(async (value, { req }) => {
      const idUsuario = Number(req.params.idUsuario);
      const usuarioExistente = await db.Usuario.findOne({
        where: {
          correo: value,
          idUsuario: { [db.Sequelize.Op.ne]: idUsuario }, // Use Op from db.Sequelize
        },
      });
      if (usuarioExistente) {
        return Promise.reject("The email address is already registered by another user.");
      }
    }),
  body("contrasena") // Password is optional on update
    .optional({ checkFalsy: true }) // Allows empty string to be ignored, or not send the field
    .isString().withMessage("The password must be a text string.")
    .isLength({ min: 8 }).withMessage("The password must be at least 8 characters long if updating."),
  body("idRol")
    .optional()
    .isInt({ gt: 0 }).withMessage("The role ID must be a positive integer if updating.")
    .custom(async (value) => {
      if (value) { // Only validate if an idRol is provided
        const rolExistente = await db.Rol.findOne({
          where: { idRol: value, estado: true },
        });
        if (!rolExistente) {
          return Promise.reject("The specified role for update does not exist or is not active.");
        }
      }
    }),
  body("estado").optional().isBoolean().withMessage("The status must be a boolean value (true or false)."),

  // Optional validators for profile fields on update
  body("nombre").optional().trim().notEmpty().withMessage("The name cannot be empty if updating.").isLength({ min: 2, max: 100 }),
  body("apellido").optional().trim().notEmpty().withMessage("The last name cannot be empty if updating.").isLength({ min: 2, max: 100 }),
  body("telefono").optional().trim().notEmpty().withMessage("The phone number cannot be empty if updating.").isLength({ min: 7, max: 45 }),
  body("tipoDocumento").optional().trim().notEmpty().withMessage("The document type cannot be empty if updating.").isIn(['Cédula de Ciudadanía', 'Cédula de Extranjería', 'Pasaporte', 'Tarjeta de Identidad']),
  body("numeroDocumento").optional().trim().notEmpty().withMessage("The document number cannot be empty if updating.").isLength({ min: 5, max: 45 })
    .custom(async (value, { req }) => {
        if (!value) return true;
        const idUsuario = Number(req.params.idUsuario); // Get the idUsuario being updated
        const usuarioActual = await db.Usuario.findByPk(idUsuario, { include: ['rol'] });
        if (!usuarioActual) return true; // Another validation will catch it

        const rolNombre = usuarioActual.rol?.nombre;

        if (rolNombre === 'Cliente') {
            const clienteAsociado = await db.Cliente.findOne({ where: { idUsuario } });
            if (clienteAsociado && clienteAsociado.numeroDocumento === value) return true; // It's the same document of the current client, no conflict
            const otroClienteConDocumento = await db.Cliente.findOne({ where: { numeroDocumento: value } });
            if (otroClienteConDocumento) {
                return Promise.reject("The document number is already registered for another client.");
            }
        } else if (rolNombre === 'Empleado') {
            const empleadoAsociado = await db.Empleado.findOne({ where: { idUsuario } });
            if (empleadoAsociado && empleadoAsociado.numeroDocumento === value) return true;
            const otroEmpleadoConDocumento = await db.Empleado.findOne({ where: { numeroDocumento: value } });
            if (otroEmpleadoConDocumento) {
                return Promise.reject("The document number is already registered for another employee.");
            }
        }
        return true;
    }),
  body("fechaNacimiento").optional().isISO8601().withMessage("The date of birth must be a valid date (YYYY-MM-DD).").toDate(),
  
  handleValidationErrors,
];

const idUsuarioValidator = [ // No changes
  param("idUsuario")
    .isInt({ gt: 0 })
    .withMessage("The user ID must be a positive integer."),
  handleValidationErrors,
];

const cambiarEstadoUsuarioValidators = [ // No changes
  param("idUsuario")
    .isInt({ gt: 0 })
    .withMessage("The user ID must be a positive integer."),
  body("estado")
    .exists({ checkFalsy: false }) // Ensures 'status' field exists, even if false
    .withMessage("The 'status' field is required in the request body.")
    .isBoolean()
    .withMessage("The 'status' value must be a boolean (true or false)."),
  handleValidationErrors,
];

module.exports = {
  crearUsuarioValidators,
  actualizarUsuarioValidators,
  idUsuarioValidator,
  cambiarEstadoUsuarioValidators,
};