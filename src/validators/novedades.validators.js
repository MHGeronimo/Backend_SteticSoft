// src/validators/novedades.validators.js
const { body, param } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");
const moment = require("moment");

const crearNovedadValidators = [
  body("empleadoId")
    .notEmpty()
    .withMessage("El ID del empleado es obligatorio.")
    .isInt({ gt: 0 })
    .withMessage("El ID del empleado debe ser un entero positivo.")
    .custom(async (value) => {
      const empleado = await db.Empleado.findOne({
        where: { idEmpleado: value, estado: true },
      });
      if (!empleado) {
        return Promise.reject(
          "El empleado especificado no existe o no está activo."
        );
      }
    }),
  body("diaSemana")
    .notEmpty()
    .withMessage("El día de la semana es obligatorio.")
    .isInt({ min: 0, max: 6 })
    .withMessage(
      "El día de la semana debe ser un número entre 0 (Domingo) y 6 (Sábado)."
    )
    .toInt(),
  body("horaInicio")
    .notEmpty()
    .withMessage("La hora de inicio es obligatoria.")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/)
    .withMessage("La hora de inicio debe estar en formato HH:mm o HH:mm:ss."),
  body("horaFin")
    .notEmpty()
    .withMessage("La hora de fin es obligatoria.")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/)
    .withMessage("La hora de fin debe estar en formato HH:mm o HH:mm:ss.")
    .custom((value, { req }) => {
      if (req.body.horaInicio) {
        const inicio = req.body.horaInicio.split(":").map(Number);
        const fin = value.split(":").map(Number);
        const inicioEnMinutos =
          inicio[0] * 60 + inicio[1] + (inicio[2] || 0) / 60;
        const finEnMinutos = fin[0] * 60 + fin[1] + (fin[2] || 0) / 60;
        if (finEnMinutos <= inicioEnMinutos) {
          throw new Error(
            "La hora de fin debe ser posterior a la hora de inicio."
          );
        }
      }
      return true;
    }),
  body("estado")
    .optional()
    .isBoolean()
    .withMessage("El estado debe ser un valor booleano (true o false)."),
  body().custom(async (value, { req }) => {
    const { empleadoId, diaSemana } = req.body;
    if (empleadoId && diaSemana !== undefined && diaSemana !== null) {
      const novedadExistente = await db.Novedades.findOne({
        where: { empleadoId: Number(empleadoId), diaSemana: Number(diaSemana) },
      });
      if (novedadExistente) {
        return Promise.reject(
          `El empleado ya tiene una novedad registrada para el día ${diaSemana}.`
        );
      }
    }
  }),
  handleValidationErrors,
];

const actualizarNovedadValidators = [
  param("idNovedades")
    .isInt({ gt: 0 })
    .withMessage("El ID de la novedad debe ser un entero positivo."),
  body("horaInicio")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/)
    .withMessage(
      "La hora de inicio debe estar en formato HH:mm o HH:mm:ss si se proporciona."
    ),
  body("horaFin")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/)
    .withMessage(
      "La hora de fin debe estar en formato HH:mm o HH:mm:ss si se proporciona."
    )
    .custom((value, { req }) => {
      const horaInicio =
        req.body.horaInicio ||
        (req.novedadActual ? req.novedadActual.horaInicio : null);
      if (horaInicio && value) {
        const inicio = horaInicio.split(":").map(Number);
        const fin = value.split(":").map(Number);
        const inicioEnMinutos =
          inicio[0] * 60 + inicio[1] + (inicio[2] || 0) / 60;
        const finEnMinutos = fin[0] * 60 + fin[1] + (fin[2] || 0) / 60;
        if (finEnMinutos <= inicioEnMinutos) {
          throw new Error(
            "La hora de fin debe ser posterior a la hora de inicio."
          );
        }
      }
      return true;
    }),
  body("estado")
    .optional()
    .isBoolean()
    .withMessage("El estado debe ser un valor booleano (true o false)."),
  handleValidationErrors,
];

const idNovedadValidator = [
  param("idNovedades")
    .isInt({ gt: 0 })
    .withMessage("El ID de la novedad debe ser un entero positivo."),
  handleValidationErrors,
];

const empleadoIdValidator = [
  param("idEmpleado")
    .isInt({ gt: 0 })
    .withMessage("El ID del empleado debe ser un entero positivo."),
  handleValidationErrors,
];

// Nuevo validador para cambiar el estado
const cambiarEstadoNovedadValidators = [
  param("idNovedades")
    .isInt({ gt: 0 })
    .withMessage("El ID de la novedad debe ser un entero positivo."),
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
  crearNovedadValidators,
  actualizarNovedadValidators,
  idNovedadValidator,
  empleadoIdValidator,
  cambiarEstadoNovedadValidators, // <-- Exportar nuevo validador
};
