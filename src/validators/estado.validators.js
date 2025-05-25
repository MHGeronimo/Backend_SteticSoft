// src/validators/estado.validators.js
const { body, param } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models"); // Para validaciones personalizadas

const crearEstadoValidators = [
  body("nombreEstado")
    .trim()
    .notEmpty()
    .withMessage("El nombre del estado es obligatorio.")
    .isString()
    .withMessage("El nombre del estado debe ser una cadena de texto.")
    .isLength({ min: 3, max: 45 })
    .withMessage("El nombre del estado debe tener entre 3 y 45 caracteres.")
    .custom(async (value) => {
      const estadoExistente = await db.Estado.findOne({
        where: { nombreEstado: value },
      });
      console.log(`Validador: Buscando estado existente con nombre: '${value}'`);
      console.log('Validador: Resultado de estadoExistente:', estadoExistente);
      if (estadoExistente) {
        return Promise.reject("El nombre del estado ya existe.");
      }
    }),
  // No hay campo 'estado' booleano en la tabla Estado, por lo que no se valida aquí.
  handleValidationErrors,
];

const actualizarEstadoValidators = [
  param("idEstado")
    .isInt({ gt: 0 })
    .withMessage("El ID del estado debe ser un entero positivo."),
  body("nombreEstado")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("El nombre del estado no puede estar vacío si se proporciona.")
    .isString()
    .withMessage("El nombre del estado debe ser una cadena de texto.")
    .isLength({ min: 3, max: 45 })
    .withMessage("El nombre del estado debe tener entre 3 y 45 caracteres.")
    .custom(async (value, { req }) => {
      const idEstado = Number(req.params.idEstado);
      const estadoExistente = await db.Estado.findOne({
        where: {
          nombreEstado: value,
          idEstado: { [db.Sequelize.Op.ne]: idEstado },
        },
      });
      if (estadoExistente) {
        return Promise.reject(
          "El nombre del estado ya está en uso por otro registro."
        );
      }
    }),
  handleValidationErrors,
];

const idEstadoValidator = [
  param("idEstado")
    .isInt({ gt: 0 })
    .withMessage("El ID del estado debe ser un entero positivo."),
  handleValidationErrors,
];

module.exports = {
  crearEstadoValidators,
  actualizarEstadoValidators,
  idEstadoValidator,
};
