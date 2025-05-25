// src/validators/categoriaServicio.validators.js
const { body, param } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");

const crearCategoriaServicioValidators = [
  body("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre de la categoría de servicio es obligatorio.")
    .isString()
    .withMessage("El nombre de la categoría de servicio debe ser texto.")
    .isLength({ min: 3, max: 45 })
    .withMessage(
      "El nombre de la categoría de servicio debe tener entre 3 y 45 caracteres."
    )
    .custom(async (value) => {
      const categoriaExistente = await db.CategoriaServicio.findOne({
        where: { nombre: value },
      });
      if (categoriaExistente) {
        return Promise.reject(
          "El nombre de la categoría de servicio ya existe."
        );
      }
    }),
  body("descripcion")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString()
    .withMessage("La descripción debe ser texto.")
    .isLength({ max: 45 })
    .withMessage("La descripción no debe exceder los 45 caracteres."),
  body("estado")
    .optional()
    .isBoolean()
    .withMessage("El estado debe ser un valor booleano (true o false)."),
  handleValidationErrors,
];

const actualizarCategoriaServicioValidators = [
  param("idCategoriaServicio")
    .isInt({ gt: 0 })
    .withMessage(
      "El ID de la categoría de servicio debe ser un entero positivo."
    ),
  body("nombre")
    .optional()
    .trim()
    .notEmpty()
    .withMessage(
      "El nombre de la categoría no puede estar vacío si se proporciona."
    )
    .isString()
    .withMessage("El nombre de la categoría de servicio debe ser texto.")
    .isLength({ min: 3, max: 45 })
    .withMessage(
      "El nombre de la categoría de servicio debe tener entre 3 y 45 caracteres."
    )
    .custom(async (value, { req }) => {
      if (value) {
        const idCategoriaServicio = Number(req.params.idCategoriaServicio);
        const categoriaExistente = await db.CategoriaServicio.findOne({
          where: {
            nombre: value,
            idCategoriaServicio: { [db.Sequelize.Op.ne]: idCategoriaServicio },
          },
        });
        if (categoriaExistente) {
          return Promise.reject(
            "El nombre de la categoría de servicio ya está en uso por otro registro."
          );
        }
      }
    }),
  body("descripcion")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString()
    .withMessage("La descripción debe ser texto.")
    .isLength({ max: 45 })
    .withMessage("La descripción no debe exceder los 45 caracteres."),
  body("estado")
    .optional()
    .isBoolean()
    .withMessage("El estado debe ser un valor booleano (true o false)."),
  handleValidationErrors,
];

const idCategoriaServicioValidator = [
  param("idCategoriaServicio")
    .isInt({ gt: 0 })
    .withMessage(
      "El ID de la categoría de servicio debe ser un entero positivo."
    ),
  handleValidationErrors,
];

module.exports = {
  crearCategoriaServicioValidators,
  actualizarCategoriaServicioValidators,
  idCategoriaServicioValidator,
};
