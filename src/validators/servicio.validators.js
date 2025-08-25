// src/validators/servicio.validators.js
const { body, param } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");

const crearServicioValidators = [
  // 1. Validador para 'nombre'
  body("nombre")
    .trim()
    .notEmpty().withMessage("El nombre del servicio es obligatorio.")
    .isString().withMessage("El nombre debe ser texto.")
    .isLength({ min: 3, max: 100 }).withMessage("El nombre debe tener entre 3 y 100 caracteres.")
    .custom(async (value) => {
      const servicio = await db.Servicio.findOne({ where: { nombre: value } });
      if (servicio) {
        return Promise.reject("Ya existe un servicio con este nombre.");
      }
    }),

  // 2. Validador para 'descripcion' (opcional)
  body("descripcion")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString().withMessage("La descripción debe ser texto."),

  // 3. Validador para 'precio'
  body("precio")
    .notEmpty().withMessage("El precio es obligatorio.")
    .isFloat({ gt: 0 }).withMessage("El precio debe ser un número mayor a cero.")
    .toFloat(), // Convierte el string a número

  // 4. Validador para 'categoriaServicioId'
  body("categoriaServicioId") // Valida el nombre de campo que envía el frontend
    .notEmpty().withMessage("La categoría es obligatoria.")
    .isInt({ gt: 0 }).withMessage("El ID de la categoría es un número inválido.")
    .custom(async (value) => {
      // Verifica que la categoría exista y esté activa en la BD
      const categoria = await db.CategoriaServicio.findByPk(value);
      if (!categoria || !categoria.estado) {
        return Promise.reject("La categoría seleccionada no existe o no está activa.");
      }
    }),

  body("imagen")
    .optional({ nullable: true, checkFalsy: true }),


  handleValidationErrors,
];


// --- Validador para la ACTUALIZACIÓN ---
const actualizarServicioValidators = [
  param("idServicio").isInt({ gt: 0 }).withMessage("El ID del servicio en la URL es inválido."),
  body("nombre")
    .optional()
    .trim()
    .notEmpty().withMessage("El nombre no puede ser un texto vacío.")
    .isLength({ min: 3, max: 100 }).withMessage("El nombre debe tener entre 3 y 100 caracteres.")
    .custom(async (value, { req }) => {
      const servicio = await db.Servicio.findOne({
        where: {
          nombre: value,
          idServicio: { [db.Sequelize.Op.ne]: req.params.idServicio },
        },
      });
      if (servicio) {
        return Promise.reject("Este nombre ya está en uso por otro servicio.");
      }
    }),

  // Añadir validaciones opcionales para otros campos
  body("descripcion")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString().withMessage("La descripción debe ser texto."),

  body("precio")
    .optional()
    .isFloat({ gt: 0 }).withMessage("El precio debe ser un número mayor a cero.")
    .toFloat(),

  body("categoriaServicioId")
    .optional()
    .isInt({ gt: 0 }).withMessage("El ID de la categoría es un número inválido.")
    .custom(async (value) => {
      const categoria = await db.CategoriaServicio.findByPk(value);
      if (!categoria || !categoria.estado) {
        return Promise.reject("La categoría seleccionada no existe o no está activa.");
      }
    }),

  body("imagen")
    .optional({ nullable: true, checkFalsy: true }),

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

// Validador para el ID del servicio en los parámetros de la URL
const idServicioValidator = [
  param("idServicio")
    .isInt({ gt: 0 })
    .withMessage("El ID del servicio debe ser un entero positivo.")
    .notEmpty()
    .withMessage("El ID del servicio no puede estar vacío."),
];

module.exports = {
  crearServicioValidators,
  actualizarServicioValidators,
  idServicioValidator,
  cambiarEstadoServicioValidators,
};
