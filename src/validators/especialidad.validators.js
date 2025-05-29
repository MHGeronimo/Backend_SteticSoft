// src/validators/especialidad.validators.js
const { body, param } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");

const crearEspecialidadValidators = [
  body("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre de la especialidad es obligatorio.")
    .isString()
    .withMessage("El nombre de la especialidad debe ser texto.")
    .isLength({ min: 3, max: 45 })
    .withMessage(
      "El nombre de la especialidad debe tener entre 3 y 45 caracteres."
    )
    .custom(async (value) => {
      const especialidadExistente = await db.Especialidad.findOne({
        where: { nombre: value },
      });
      if (especialidadExistente) {
        return Promise.reject("El nombre de la especialidad ya existe.");
      }
    }),
  body("descripcion")
    .optional()
    .trim()
    .isString()
    .withMessage("La descripción debe ser texto.")
    .isLength({ max: 255 })
    .withMessage("La descripción no debe exceder los 255 caracteres."),
  body("estado")
    .optional()
    .isBoolean()
    .withMessage("El estado debe ser un valor booleano (true o false)."),
  handleValidationErrors,
];

const actualizarEspecialidadValidators = [
  param("idEspecialidad")
    .isInt({ gt: 0 })
    .withMessage("El ID de la especialidad debe ser un entero positivo."),
  body("nombre")
    .optional()
    .trim()
    .notEmpty()
    .withMessage(
      "El nombre de la especialidad no puede estar vacío si se proporciona."
    )
    .isString()
    .withMessage("El nombre de la especialidad debe ser texto.")
    .isLength({ min: 3, max: 45 })
    .withMessage(
      "El nombre de la especialidad debe tener entre 3 y 45 caracteres."
    )
    .custom(async (value, { req }) => {
      if (value) {
        const idEspecialidad = Number(req.params.idEspecialidad);
        const especialidadExistente = await db.Especialidad.findOne({
          where: {
            nombre: value,
            idEspecialidad: { [db.Sequelize.Op.ne]: idEspecialidad },
          },
        });
        if (especialidadExistente) {
          return Promise.reject(
            "El nombre de la especialidad ya está en uso por otro registro."
          );
        }
      }
    }),
  body("descripcion")
    .optional({ nullable: true })
    .trim()
    .isString()
    .withMessage("La descripción debe ser texto.")
    .isLength({ max: 255 })
    .withMessage("La descripción no debe exceder los 255 caracteres."),
  body("estado")
    .optional()
    .isBoolean()
    .withMessage("El estado debe ser un valor booleano (true o false)."),
  handleValidationErrors,
];

const idEspecialidadValidator = [
  param("idEspecialidad")
    .isInt({ gt: 0 })
    .withMessage("El ID de la especialidad debe ser un entero positivo."),
  handleValidationErrors,
];

// Nuevo validador para cambiar el estado
const cambiarEstadoEspecialidadValidators = [
  param("idEspecialidad")
    .isInt({ gt: 0 })
    .withMessage("El ID de la especialidad debe ser un entero positivo."),
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
  crearEspecialidadValidators,
  actualizarEspecialidadValidators,
  idEspecialidadValidator,
  cambiarEstadoEspecialidadValidators, // <-- Exportar nuevo validador
};
