// src/validators/empleado.validators.js
const { body, param } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");

const crearEmpleadoValidators = [
  // --- Fields for Employee Profile ---
  body("nombre")
    .trim()
    .notEmpty().withMessage("The employee's name is required.")
    .isString().withMessage("The employee's name must be a text string.")
    .isLength({ min: 2, max: 100 }).withMessage("The name must be between 2 and 100 characters.")
    .matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/).withMessage("El nombre solo puede contener letras y espacios."),
  body("apellido") // New field: Last Name
    .trim()
    .notEmpty().withMessage("The employee's last name is required.")
    .isString().withMessage("The employee's last name must be a text string.")
    .isLength({ min: 2, max: 100 }).withMessage("The last name must be between 2 and 100 characters.")
    .matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/).withMessage("El apellido solo puede contener letras y espacios."),
  body("correo") // New field: Employee's email (assuming it's the same as the user's)
    .trim()
    .notEmpty().withMessage("The employee's email address is required.")
    .isEmail().withMessage("You must provide a valid email address for the employee.")
    .normalizeEmail()
    .custom(async (value) => {
      // Validate that the email is not already in use by another Employee
      const empleadoExistente = await db.Empleado.findOne({ where: { correo: value } });
      if (empleadoExistente) {
        return Promise.reject("The email address is already registered for another employee profile.");
      }
      // Validate that the email is not already in use by another User
      const usuarioExistente = await db.Usuario.findOne({ where: { correo: value } });
      if (usuarioExistente) {
        return Promise.reject("The email address is already registered for another user account.");
      }
    }),
  body("telefono") // New field: Phone (replaces cell)
    .trim()
    .notEmpty().withMessage("The employee's phone number is required.")
    .isString().withMessage("The employee's phone number must be a text string.")
    .isLength({ min: 7, max: 45 }).withMessage("The phone number must be between 7 and 45 characters."),
  body("tipoDocumento")
    .trim()
    .notEmpty().withMessage("The document type is required.")
    .isString().withMessage("The document type must be text.")
    .matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]*$/).withMessage("El tipo de documento no debe contener caracteres especiales.")
    .isIn(['Cédula de Ciudadanía', 'Cédula de Extranjería', 'Pasaporte', 'Tarjeta de Identidad'])
    .withMessage("Invalid document type."),
  body("numeroDocumento")
    .trim()
    .notEmpty().withMessage("The document number is required.")
    .isString().withMessage("The document number must be text.")
    .isLength({ min: 5, max: 45 }).withMessage("The document number must be between 5 and 45 characters.")
    .matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]*$/).withMessage("El número de documento no debe contener caracteres especiales.")
    .custom(async (value) => {
      const empleadoExistente = await db.Empleado.findOne({
        where: { numeroDocumento: value },
      });
      if (empleadoExistente) {
        return Promise.reject("The document number is already registered for another employee.");
      }
    }),
  body("fechaNacimiento")
    .notEmpty().withMessage("The date of birth is required.")
    .isISO8601().withMessage("The date of birth must be a valid date (YYYY-MM-DD).")
    .toDate(),
  body("estadoEmpleado")
    .optional().isBoolean().withMessage("The employee status must be a boolean value."),

  // --- Fields for the associated User Account ---
  // The 'correo' field has already been validated above and will be used for the user account
  body("contrasena")
    .notEmpty().withMessage("The password for the account is required.")
    .isString().withMessage("The password must be a text string.")
    .isLength({ min: 8 }).withMessage("The password must be at least 8 characters long."),
  body("estadoUsuario")
    .optional().isBoolean().withMessage("The user account status must be a boolean value."),
  
  handleValidationErrors,
];

const actualizarEmpleadoValidators = [
  param("idEmpleado")
    .isInt({ gt: 0 })
    .withMessage("The employee ID must be a positive integer."),
  
  // Employee Profile Fields (optional in update)
  body("nombre").optional().trim().notEmpty().withMessage("The name cannot be empty if provided.").isString().withMessage("The name must be text.").isLength({ min: 2, max: 100 }).matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/).withMessage("El nombre solo puede contener letras y espacios."),
  body("apellido").optional().trim().notEmpty().withMessage("The last name cannot be empty if provided.").isString().withMessage("The last name must be text.").isLength({ min: 2, max: 100 }).matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/).withMessage("El apellido solo puede contener letras y espacios."), // Added
  body("correo").optional().trim().notEmpty().withMessage("The email address cannot be empty if provided.").isEmail().withMessage("You must provide a valid email address.")
    .normalizeEmail()
    .custom(async (value, { req }) => {
      if (value) {
        const idEmpleado = Number(req.params.idEmpleado);
        
        // Check if the email is already in use by another Employee (excluding the current one)
        const empleadoExistente = await db.Empleado.findOne({
          where: { correo: value, idEmpleado: { [db.Sequelize.Op.ne]: idEmpleado } },
        });
        if (empleadoExistente) {
          return Promise.reject("The email address is already registered by another employee profile.");
        }

        // Check if the email is in use by another User account (excluding the one associated with the current employee)
        const empleadoActual = await db.Empleado.findByPk(idEmpleado);
        if (empleadoActual && empleadoActual.idUsuario) {
          const otroUsuarioConCorreo = await db.Usuario.findOne({
            where: { correo: value, idUsuario: { [db.Sequelize.Op.ne]: empleadoActual.idUsuario } },
          });
          if (otroUsuarioConCorreo) {
            return Promise.reject("The email address is already in use by another user account.");
          }
        }
      }
    }),
  body("telefono").optional().trim().notEmpty().withMessage("The phone number cannot be empty if provided.").isString().withMessage("The phone number must be text.").isLength({ min: 7, max: 45 }), // Added
  body("tipoDocumento").optional().trim().notEmpty().withMessage("The document type cannot be empty if provided.").isString().withMessage("The document type must be text.").matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]*$/).withMessage("El tipo de documento no debe contener caracteres especiales.").isIn(['Cédula de Ciudadanía', 'Cédula de Extranjería', 'Pasaporte', 'Tarjeta de Identidad']).withMessage("Invalid document type."),
  body("numeroDocumento").optional().trim().notEmpty().withMessage("The document number cannot be empty if provided.").isString().withMessage("The document number must be text.").isLength({ min: 5, max: 45 }).matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]*$/).withMessage("El número de documento no debe contener caracteres especiales.")
    .custom(async (value, { req }) => {
      if (value) {
        const idEmpleado = Number(req.params.idEmpleado);
        const empleadoExistente = await db.Empleado.findOne({
          where: {
            numeroDocumento: value,
            idEmpleado: { [db.Sequelize.Op.ne]: idEmpleado },
          },
        });
        if (empleadoExistente) {
          return Promise.reject("The document number is already registered by another employee.");
        }
      }
    }),
  body("fechaNacimiento").optional().notEmpty().withMessage("The date of birth cannot be empty if provided.").isISO8601().withMessage("The date of birth must be a valid date (YYYY-MM-DD).").toDate(),
  body("estadoEmpleado").optional().isBoolean().withMessage("The employee profile status must be a boolean value."),

  // User Account Fields (optional in update)
  // The User's email is updated through the Employee's email field,
  // so a separate 'correoUsuario' entry is not required.
  body("estadoUsuario").optional().isBoolean().withMessage("The user account status must be a boolean value."),
  
  handleValidationErrors,
];

const idEmpleadoValidator = [
  param("idEmpleado")
    .isInt({ gt: 0 })
    .withMessage("The employee ID must be a positive integer."),
  handleValidationErrors,
];

const gestionarEspecialidadesEmpleadoValidators = [
  param("idEmpleado")
    .isInt({ gt: 0 })
    .withMessage("The employee ID must be a positive integer."),
  body("idEspecialidades")
    .isArray({ min: 1 })
    .withMessage("An array of specialty IDs with at least one element is required.")
    .custom((idEspecialidades) => {
      if (!idEspecialidades.every((id) => Number.isInteger(id) && id > 0)) {
        throw new Error("Each specialty ID in the array must be a positive integer.");
      }
      return true;
    }),
  handleValidationErrors,
];

const cambiarEstadoEmpleadoValidators = [
  param("idEmpleado")
    .isInt({ gt: 0 })
    .withMessage("The employee ID must be a positive integer."),
  body("estado")
    .exists({ checkFalsy: false })
    .withMessage("The 'status' field is required in the request body.")
    .isBoolean()
    .withMessage("The 'status' value must be a boolean (true or false)."),
  handleValidationErrors,
];

module.exports = {
  crearEmpleadoValidators,
  actualizarEmpleadoValidators,
  idEmpleadoValidator,
  gestionarEspecialidadesEmpleadoValidators,
  cambiarEstadoEmpleadoValidators,
};