const { body, param } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");

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
            idCategoriaProducto: { [db.Sequelize.Op.ne]: idCategoria },
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

const cambiarEstadoCategoriaProductoValidators = [
  param("idCategoria")
    .isInt({ gt: 0 })
    .withMessage(
      "El ID de la categoría de producto debe ser un entero positivo."
    ),
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
  crearCategoriaProductoValidators,
  actualizarCategoriaProductoValidators,
  idCategoriaProductoValidator,
  cambiarEstadoCategoriaProductoValidators,
};