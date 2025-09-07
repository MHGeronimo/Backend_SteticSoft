// src/validators/cita.validators.js
const { body, param, query } = require("express-validator");
const { handleValidationErrors } = require("../middlewares/validation.middleware.js");
const db = require("../models");
const moment = require("moment-timezone");

const crearCitaValidators = [
  body("fechaHora")
    .notEmpty().withMessage("La fecha y hora son obligatorias.")
    .isISO8601().withMessage("El formato de fecha y hora debe ser ISO8601.")
    .custom((value) => {
      if (moment(value).isBefore(moment())) {
        throw new Error("La fecha y hora de la cita no pueden ser en el pasado.");
      }
      return true;
    })
    .toDate(),

  body("idCliente")
    .notEmpty().withMessage("El ID del cliente es obligatorio.")
    .isInt({ gt: 0 }).withMessage("El ID del cliente debe ser un entero positivo.")
    .custom(async (value) => {
      const cliente = await db.Cliente.findOne({ where: { idCliente: value, estado: true } });
      if (!cliente) throw new Error("El cliente no existe o está inactivo.");
    }),

  body("idUsuario")
    .notEmpty().withMessage("El ID del empleado es obligatorio.")
    .isInt({ gt: 0 }).withMessage("El ID del empleado debe ser un entero positivo.")
    .custom(async (value) => {
      const usuario = await db.Usuario.findOne({ where: { idUsuario: value, estado: true } });
      if (!usuario) throw new Error("El empleado no existe o no está activo.");
    }),

  body("idNovedad")
    .notEmpty().withMessage("El ID de la novedad es obligatorio.")
    .isInt({ gt: 0 }).withMessage("El ID de la novedad debe ser un entero positivo.")
    .custom(async (value) => {
      const novedad = await db.Novedad.findOne({ where: { idNovedad: value, estado: true }});
      if (!novedad) throw new Error("La novedad no existe o está inactiva.");
    }),

  // ✅ CORRECCIÓN: Se añade la validación para el campo obligatorio 'idEstado'.
  body("idEstado")
    .notEmpty().withMessage("El ID del estado de la cita es obligatorio.")
    .isInt({ gt: 0 }).withMessage("El ID del estado debe ser un entero positivo.")
    .custom(async (value) => {
      const estado = await db.Estado.findByPk(value);
      if (!estado) throw new Error("El estado de la cita especificado no existe.");
    }),

  body("servicios")
    .isArray({ min: 1 }).withMessage("Debe seleccionar al menos un servicio.")
    .custom((servicios) => {
      if (!servicios.every((id) => Number.isInteger(id) && id > 0)) {
        throw new Error("Cada ID de servicio debe ser un entero positivo.");
      }
      return true;
    }),

  handleValidationErrors,
];

const actualizarCitaValidators = [
  param("idCita").isInt({ gt: 0 }).withMessage("El ID de la cita debe ser un entero positivo."),
  body("fechaHora").optional().isISO8601().toDate(),
  body("idCliente").optional().isInt({ gt: 0 }),
  body("idUsuario").optional().isInt({ gt: 0 }),
  body("idNovedad").optional().isInt({ gt: 0 }),
  body("servicios").optional().isArray(),
  body("idEstado").optional().isInt({ gt: 0 }),
  handleValidationErrors,
];

const idCitaValidator = [
  param("idCita").isInt({ gt: 0 }).withMessage("El ID de la cita debe ser un entero positivo."),
  handleValidationErrors,
];

const gestionarServiciosCitaValidator = [
  param("idCita").isInt({ gt: 0 }).withMessage("El ID de la cita debe ser un entero positivo."),
  body("idServicios")
    .isArray({ min: 1 }).withMessage("Se requiere un array 'idServicios' con al menos un elemento.")
    .custom((idServicios) => {
      if (!idServicios.every((id) => Number.isInteger(id) && id > 0)) {
        throw new Error("Cada ID de servicio en el array debe ser un entero positivo.");
      }
      return true;
    }),
  handleValidationErrors,
];

const buscarClientesValidators = [
    query("termino")
        .notEmpty().withMessage("El término de búsqueda es obligatorio.")
        .isLength({ min: 2 }).withMessage("El término de búsqueda debe tener al menos 2 caracteres."),
    handleValidationErrors,
];

const obtenerDisponibilidadNovedadValidators = [
  param("idNovedad").isInt({ gt: 0 }).withMessage("El ID de la novedad debe ser un entero positivo."),
  query("mes").optional().isInt({ min: 1, max: 12 }).withMessage("El mes debe ser un número entre 1 y 12."),
  query("anio").optional().isInt({ min: 2020, max: 2030 }).withMessage("El año debe ser válido."),
  query("fecha").optional().isISO8601().withMessage("La fecha debe estar en formato YYYY-MM-DD."),
  handleValidationErrors,
];

module.exports = {
  crearCitaValidators,
  actualizarCitaValidators,
  idCitaValidator,
  gestionarServiciosCitaValidator,
  buscarClientesValidators,
  obtenerDiasDisponiblesValidators: obtenerDisponibilidadNovedadValidators,
  obtenerHorariosDisponiblesValidators: obtenerDisponibilidadNovedadValidators,
};

