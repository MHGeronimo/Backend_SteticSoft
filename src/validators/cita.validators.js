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
    .notEmpty()
    .withMessage("La fecha es obligatoria.")
    .isISO8601()
    .withMessage("El formato de fecha debe ser YYYY-MM-DD.")
    .custom((value) => {
      if (moment(value).isBefore(moment().startOf("day"))) {
        throw new Error("La fecha de la cita no puede ser en el pasado.");
      }
      return true;
    }),
  body("horaInicio")
    .notEmpty()
    .withMessage("La hora de inicio es obligatoria.")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/)
    .withMessage("El formato de hora debe ser HH:mm o HH:mm:ss."),
  body("idCliente")
    .notEmpty()
    .withMessage("El ID del cliente es obligatorio.")
    .isInt({ gt: 0 })
    .withMessage("El ID del cliente debe ser un entero positivo.")
    .custom(async (value) => {
      const cliente = await db.Cliente.findOne({
        where: { idCliente: value, estado: true },
      });
      if (!cliente) throw new Error("El cliente no existe o está inactivo.");
    }),
  body("idUsuario")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("El ID del empleado debe ser un entero positivo.")
    .custom(async (value) => {
      const usuario = await db.Usuario.findOne({
        where: { idUsuario: value, estado: true },
      });
      if (!usuario) throw new Error("El empleado no existe o no está activo.");
    }),
  body("idNovedad")
    .notEmpty()
    .withMessage("El ID de la novedad es obligatorio.")
    .isInt({ gt: 0 })
    .withMessage("El ID de la novedad debe ser un entero positivo.")
    .custom(async (value) => {
      const novedad = await db.Novedad.findOne({
        where: { idNovedad: value, estado: true },
      });
      if (!novedad) throw new Error("La novedad no existe o está inactiva.");
    }),
  body("servicios")
    .optional()
    .isArray()
    .withMessage("Debe seleccionar al menos un servicio.")
    .custom((servicios) => {
      if (!servicios.every((id) => Number.isInteger(id) && id > 0)) {
        throw new Error("Cada ID de servicio debe ser un entero positivo.");
      }
      return true;
    }),
  handleValidationErrors,
];

const actualizarCitaValidators = [
  param("id")
    .isInt({ gt: 0 })
    .withMessage("El ID de la cita debe ser un entero positivo."),
  body("fecha")
    .optional()
    .isISO8601()
    .withMessage("El formato de fecha debe ser YYYY-MM-DD."),
  body("horaInicio")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/)
    .withMessage("El formato de hora debe ser HH:mm o HH:mm:ss."),
  body("idCliente").optional().isInt({ gt: 0 }),
  body("idUsuario").optional().isInt({ gt: 0 }),
  body("idNovedad").optional().isInt({ gt: 0 }),
  body("servicios").optional().isArray(),
  // --- ✅ CORRECCIÓN AQUÍ ---
  // Se valida 'idEstado' como un número entero positivo, en lugar de 'estado' como texto.
  body("idEstado")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("El ID del estado debe ser un entero positivo."),
  handleValidationErrors,
];

const cambiarEstadoCitaValidators = [
  param("id")
    .isInt({ gt: 0 })
    .withMessage("El ID de la cita debe ser un entero positivo."),
  // --- ✅ CORRECCIÓN AQUÍ ---
  // Se valida 'idEstado' como un número entero requerido.
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