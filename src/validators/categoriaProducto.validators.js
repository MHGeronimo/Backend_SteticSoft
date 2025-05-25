// src/validators/categoriaProducto.validators.js
const { body, param } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");

const tiposDeUsoPermitidos = ["Interno", "Externo"];

const crearCategoriaProductoValidators = [
  body("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre de la categoría es obligatorio.")
    .isString()
    .withMessage("El nombre de la categoría debe ser texto.")
    .isLength({ min: 3, max: 45 })
    .withMessage(
      "El nombre de la categoría debe tener entre 3 y 45 caracteres."
    )
    .custom(async (value) => {
      const categoriaExistente = await db.CategoriaProducto.findOne({
        where: { nombre: value },
      });
      if (categoriaExistente) {
        return Promise.reject(
          "El nombre de la categoría de producto ya existe."
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
  body("vidaUtilDias") // Asumiendo que el frontend envía camelCase: vidaUtilDias
    .optional({ nullable: true })
    .isInt({ gt: -1 })
    .withMessage(
      "La vida útil en días debe ser un número entero no negativo (0 o más)."
    ) // gt: -1 permite 0
    .toInt(), // Convierte a entero
  body("tipoUso") // Asumiendo que el frontend envía camelCase: tipoUso
    .trim()
    .notEmpty()
    .withMessage("El tipo de uso es obligatorio.")
    .isIn(tiposDeUsoPermitidos)
    .withMessage(
      `El tipo de uso debe ser uno de: ${tiposDeUsoPermitidos.join(", ")}.`
    ),
  body("estado")
    .optional()
    .isBoolean()
    .withMessage("El estado debe ser un valor booleano (true o false)."),
  handleValidationErrors,
];

const actualizarCategoriaProductoValidators = [
  param("idCategoria")
    .isInt({ gt: 0 })
    .withMessage(
      "El ID de la categoría de producto debe ser un entero positivo."
    ),
  body("nombre")
    .optional()
    .trim()
    .notEmpty()
    .withMessage(
      "El nombre de la categoría no puede estar vacío si se proporciona."
    )
    .isString()
    .withMessage("El nombre de la categoría debe ser texto.")
    .isLength({ min: 3, max: 45 })
    .withMessage(
      "El nombre de la categoría debe tener entre 3 y 45 caracteres."
    )
    .custom(async (value, { req }) => {
      if (value) {
        const idCategoria = Number(req.params.idCategoria);
        const categoriaExistente = await db.CategoriaProducto.findOne({
          where: {
            nombre: value,
            idCategoria: { [db.Sequelize.Op.ne]: idCategoria },
          },
        });
        if (categoriaExistente) {
          return Promise.reject(
            "El nombre de la categoría de producto ya está en uso por otro registro."
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
  body("vidaUtilDias")
    .optional({ nullable: true })
    .isInt({ gt: -1 })
    .withMessage(
      "La vida útil en días debe ser un número entero no negativo (0 o más) si se proporciona."
    )
    .toInt(),
  body("tipoUso")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("El tipo de uso no puede estar vacío si se proporciona.")
    .isIn(tiposDeUsoPermitidos)
    .withMessage(
      `El tipo de uso debe ser uno de: ${tiposDeUsoPermitidos.join(", ")}.`
    ),
  body("estado")
    .optional()
    .isBoolean()
    .withMessage("El estado debe ser un valor booleano (true o false)."),
  handleValidationErrors,
];

const idCategoriaProductoValidator = [
  param("idCategoria")
    .isInt({ gt: 0 })
    .withMessage(
      "El ID de la categoría de producto debe ser un entero positivo."
    ),
  handleValidationErrors,
];

module.exports = {
  crearCategoriaProductoValidators,
  actualizarCategoriaProductoValidators,
  idCategoriaProductoValidator,
};
