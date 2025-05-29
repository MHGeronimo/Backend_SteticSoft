// src/validators/servicio.validators.js
const { body, param } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");

const crearServicioValidators = [
  body("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre del servicio es obligatorio.")
    .isString()
    .withMessage("El nombre del servicio debe ser texto.")
    .isLength({ min: 3, max: 100 })
    .withMessage("El nombre del servicio debe tener entre 3 y 100 caracteres.")
    .custom(async (value) => {
      const servicioExistente = await db.Servicio.findOne({
        where: { nombre: value },
      });
      if (servicioExistente) {
        return Promise.reject("El nombre del servicio ya existe.");
      }
    }),
  body("descripcion")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString()
    .withMessage("La descripción debe ser texto."),
  body("precio")
    .notEmpty()
    .withMessage("El precio es obligatorio.")
    .isFloat({ gt: -0.01 })
    .withMessage("El precio debe ser un número no negativo.")
    .toFloat(),
  body("duracionEstimada")
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage(
      "La duración estimada debe ser un número entero no negativo (en minutos)."
    )
    .toInt(),
  body("categoriaServicioId")
    .notEmpty()
    .withMessage("El ID de la categoría de servicio es obligatorio.")
    .isInt({ gt: 0 })
    .withMessage(
      "El ID de la categoría de servicio debe ser un entero positivo."
    )
    .custom(async (value) => {
      const categoria = await db.CategoriaServicio.findOne({
        where: { idCategoriaServicio: value, estado: true },
      });
      if (!categoria) {
        return Promise.reject(
          "La categoría de servicio especificada no existe o no está activa."
        );
      }
    }),
  body("especialidadId")
    .optional({ nullable: true })
    .isInt({ gt: 0 })
    .withMessage(
      "El ID de la especialidad debe ser un entero positivo si se proporciona."
    )
    .custom(async (value) => {
      if (value) {
        const especialidad = await db.Especialidad.findOne({
          where: { idEspecialidad: value, estado: true },
        });
        if (!especialidad) {
          return Promise.reject(
            "La especialidad especificada no existe o no está activa."
          );
        }
      }
    }),
  body("estado")
    .optional()
    .isBoolean()
    .withMessage("El estado debe ser un valor booleano (true o false)."),
  handleValidationErrors,
];

const actualizarServicioValidators = [
  param("idServicio")
    .isInt({ gt: 0 })
    .withMessage("El ID del servicio debe ser un entero positivo."),
  body("nombre")
    .optional()
    .trim()
    .notEmpty()
    .withMessage(
      "El nombre del servicio no puede estar vacío si se proporciona."
    )
    .isString()
    .withMessage("El nombre del servicio debe ser texto.")
    .isLength({ min: 3, max: 100 })
    .withMessage("El nombre del servicio debe tener entre 3 y 100 caracteres.")
    .custom(async (value, { req }) => {
      if (value) {
        const idServicio = Number(req.params.idServicio);
        const servicioExistente = await db.Servicio.findOne({
          where: {
            nombre: value,
            idServicio: { [db.Sequelize.Op.ne]: idServicio },
          },
        });
        if (servicioExistente) {
          return Promise.reject(
            "El nombre del servicio ya está en uso por otro registro."
          );
        }
      }
    }),
  body("descripcion")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString()
    .withMessage("La descripción debe ser texto."),
  body("precio")
    .optional()
    .isFloat({ gt: -0.01 })
    .withMessage("El precio debe ser un número no negativo si se actualiza.")
    .toFloat(),
  body("duracionEstimada")
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage(
      "La duración estimada debe ser un número entero no negativo si se actualiza."
    )
    .toInt(),
  body("categoriaServicioId")
    .optional()
    .isInt({ gt: 0 })
    .withMessage(
      "El ID de la categoría de servicio debe ser un entero positivo si se actualiza."
    )
    .custom(async (value) => {
      if (value) {
        const categoria = await db.CategoriaServicio.findOne({
          where: { idCategoriaServicio: value, estado: true },
        });
        if (!categoria) {
          return Promise.reject(
            "La nueva categoría de servicio especificada no existe o no está activa."
          );
        }
      }
    }),
  body("especialidadId")
    .optional({ nullable: true })
    .custom(async (value) => {
      if (value !== null && value !== undefined) {
        if (!(Number.isInteger(value) && value > 0)) {
          throw new Error(
            "El ID de la especialidad debe ser un entero positivo o null."
          );
        }
        const especialidad = await db.Especialidad.findOne({
          where: { idEspecialidad: value, estado: true },
        });
        if (!especialidad) {
          return Promise.reject(
            "La nueva especialidad especificada no existe o no está activa."
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

const idServicioValidator = [
  param("idServicio")
    .isInt({ gt: 0 })
    .withMessage("El ID del servicio debe ser un entero positivo."),
  handleValidationErrors,
];

// Nuevo validador para cambiar el estado
const cambiarEstadoServicioValidators = [
  param("idServicio")
    .isInt({ gt: 0 })
    .withMessage("El ID del servicio debe ser un entero positivo."),
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
  crearServicioValidators,
  actualizarServicioValidators,
  idServicioValidator,
  cambiarEstadoServicioValidators, // <-- Exportar nuevo validador
};
