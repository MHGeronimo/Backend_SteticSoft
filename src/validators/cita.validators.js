// src/validators/cita.validators.js
const { body, param, query } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");
const moment = require("moment-timezone");

const idValidator = [
  param("id")
    .isInt({ gt: 0 })
    .withMessage("El ID debe ser un entero positivo."),
  handleValidationErrors,
];

const crearCitaValidators = [
  body("fecha")
    .notEmpty().withMessage("La fecha de la cita es obligatoria.")
    .isISO8601().withMessage("La fecha debe estar en formato YYYY-MM-DD."),
  
  body("hora_inicio")
    .notEmpty().withMessage("La hora de inicio es obligatoria.")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/).withMessage("La hora debe estar en formato HH:mm."),

  body("clienteId")
    .notEmpty().withMessage("El ID del cliente es obligatorio.")
    .isInt({ gt: 0 }).withMessage("El ID del cliente debe ser un entero positivo."),
  
  body("usuarioId")
    .notEmpty().withMessage("El ID del empleado es obligatorio.")
    .isInt({ gt: 0 }).withMessage("El ID del empleado debe ser un entero positivo."),
  
  body("idEstado")
    .notEmpty().withMessage("El estado de la cita es obligatorio.")
    .isInt({ gt: 0 }).withMessage("El ID del estado debe ser un entero positivo."),

  body("novedadId")
    .notEmpty().withMessage("La novedad de horario es obligatoria.")
    .isInt({ gt: 0 }).withMessage("El ID de la novedad debe ser un entero positivo."),

  body("servicios")
    .isArray({ min: 1 }).withMessage("Debe seleccionar al menos un servicio.")
    .custom((servicios) => {
      if (!servicios.every(id => Number.isInteger(id) && id > 0)) {
        throw new Error("Cada ID de servicio debe ser un número entero positivo.");
      }
      return true;
    }),
  
  handleValidationErrors,
];

const cambiarEstadoCitaValidators = [
  param("id")
    .isInt({ gt: 0 })
    .withMessage("El ID de la cita debe ser un entero positivo."),
  body("idEstado")
    .notEmpty()
    .withMessage("El ID del estado es obligatorio.")
    .isInt({ gt: 0 })
    .withMessage("El ID del estado debe ser un entero positivo."),
  handleValidationErrors,
];

const buscarValidators = [
  query("search")
    .optional()
    .isString()
    .withMessage("El término de búsqueda debe ser un texto.")
    .isLength({ min: 2 })
    .withMessage("El término de búsqueda debe tener al menos 2 caracteres."),
  handleValidationErrors,
];

const actualizarCitaValidators = [
  param("idCita").isInt({ gt: 0 }).withMessage("El ID de la cita debe ser un entero positivo."),
  body("fecha").optional().isISO8601().withMessage("La fecha debe ser válida (YYYY-MM-DD)."),
  body("hora_inicio").optional().matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/).withMessage("La hora debe estar en formato HH:mm."),
  body("clienteId").optional().isInt({ gt: 0 }).withMessage("El ID del cliente debe ser un entero positivo."),
  body("usuarioId").optional().isInt({ gt: 0 }).withMessage("El ID del empleado debe ser un entero positivo."),
  body("idEstado").optional().isInt({ gt: 0 }).withMessage("El ID del estado debe ser un entero positivo."),
  body("novedadId").optional().isInt({ gt: 0 }).withMessage("El ID de la novedad debe ser un entero positivo."),
  body("servicios").optional().isArray().withMessage("Los servicios deben ser un array de IDs."),
  body("servicios.*").optional().isInt({ gt: 0 }).withMessage("Cada ID de servicio debe ser un entero positivo."),
  handleValidationErrors,
];

const obtenerDisponibilidadValidators = [
  param("id")
    .isInt({ gt: 0 })
    .withMessage("El ID de la novedad debe ser un entero positivo."),
  query("mes")
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage("El mes debe ser un número entre 1 y 12."),
  query("anio")
    .optional()
    .isInt({ min: 2020, max: 2030 })
    .withMessage("El año debe ser válido."),
  query("fecha")
    .optional()
    .isISO8601()
    .withMessage("La fecha debe estar en formato YYYY-MM-DD."),
  handleValidationErrors,
];

module.exports = {
  idValidator,
  crearCitaValidators,
  actualizarCitaValidators,
  cambiarEstadoCitaValidators,
  buscarValidators,
  obtenerDisponibilidadValidators,
};