// src/validators/novedades.validators.js
const { body, param } = require("express-validator");
const { handleValidationErrors } = require("../middlewares/validation.middleware.js");
const moment = require("moment");

const crearNovedadValidators = [
  body("fechaInicio")
    .notEmpty().withMessage("La fecha de inicio es obligatoria.")
    .isISO8601().withMessage("La fecha de inicio debe tener formato YYYY-MM-DD.")
    .toDate(),

  body("fechaFin")
    .notEmpty().withMessage("La fecha de fin es obligatoria.")
    .isISO8601().withMessage("La fecha de fin debe tener formato YYYY-MM-DD.")
    .toDate()
    .custom((value, { req }) => {
      if (moment(value).isBefore(req.body.fechaInicio)) {
        throw new Error("La fecha de fin no puede ser anterior a la fecha de inicio.");
      }
      return true;
    }),

  // ✅ --- SECCIÓN CORREGIDA ---
  // 1. Se valida que "dias" sea un array y no esté vacío.
  body("dias")
    .notEmpty().withMessage("Escoger los días es obligatorio.")
    .isArray({ min: 1 }).withMessage("El campo 'dias' debe ser un array con al menos un día."),
  
  // 2. Con "dias.*", se valida cada elemento DENTRO del array.
  body("dias.*")
    .isString().withMessage("Cada día debe ser un texto.")
    .isIn(['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'])
    .withMessage("Uno de los días proporcionados no es válido."),
  // ✅ --- FIN DE LA CORRECCIÓN ---

  body("horaInicio")
    .notEmpty().withMessage("La hora de inicio es obligatoria.")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/).withMessage("La hora de inicio debe estar en formato HH:mm."),

  body("horaFin")
    .notEmpty().withMessage("La hora de fin es obligatoria.")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/).withMessage("La hora de fin debe estar en formato HH:mm.")
    .custom((value, { req }) => {
      if (req.body.horaInicio && moment(value, "HH:mm").isSameOrBefore(moment(req.body.horaInicio, "HH:mm"))) {
        throw new Error("La hora de fin debe ser posterior a la hora de inicio.");
      }
      return true;
    }),

  body("empleadosIds")
    .notEmpty().withMessage("Debe seleccionar al menos un empleado.")
    .isArray({ min: 1 }).withMessage("El campo 'empleadosIds' debe ser un array con al menos un ID."),
  
  body("empleadosIds.*")
    .isInt({ gt: 0 }).withMessage("Cada ID de empleado debe ser un número entero positivo."),

  body("estado")
    .optional()
    .isBoolean().withMessage("El estado debe ser un valor booleano (true o false)."),
  
  handleValidationErrors,
];

const actualizarNovedadValidators = [
  param("idNovedad")
    .isInt({ gt: 0 }).withMessage("El ID de la novedad debe ser un entero positivo."),
  
  body("fechaInicio").optional().isISO8601().toDate(),
  body("fechaFin").optional().isISO8601().toDate().custom((value, { req }) => {
    const fechaInicio = req.body.fechaInicio;
    if (fechaInicio && moment(value).isBefore(fechaInicio)) {
      throw new Error("La fecha de fin no puede ser anterior a la fecha de inicio.");
    }
    return true;
  }),
  body("horaInicio").optional().matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/),
  body("horaFin").optional().matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/),
  
  // También se corrige aquí para la actualización
  body("dias").optional().isArray({ min: 1 }).withMessage("El campo 'dias' debe ser un array."),
  body("dias.*")
    .isString().withMessage("Cada día debe ser un texto.")
    .isIn(['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'])
    .withMessage("Uno de los días proporcionados no es válido."),

  body("empleadosIds").optional().isArray().withMessage("El campo 'empleadosIds' debe ser un array."),
  body("empleadosIds.*").optional().isInt({ gt: 0 }).withMessage("Cada ID de empleado debe ser un número entero positivo."),
  body("estado").optional().isBoolean(),

  handleValidationErrors,
];

const idNovedadValidator = [
  param("idNovedad")
    .isInt({ gt: 0 }).withMessage("El ID de la novedad debe ser un entero positivo."),
  handleValidationErrors,
];

const cambiarEstadoNovedadValidators = [
  param("idNovedad")
    .isInt({ gt: 0 }).withMessage("El ID de la novedad debe ser un entero positivo."),
  body("estado")
    .exists({ checkNull: true }).withMessage("El campo 'estado' es obligatorio.")
    .isBoolean().withMessage("El valor de 'estado' debe ser un booleano (true o false)."),
  handleValidationErrors,
];

module.exports = {
  crearNovedadValidators,
  actualizarNovedadValidators,
  idNovedadValidator,
  cambiarEstadoNovedadValidators,
};
