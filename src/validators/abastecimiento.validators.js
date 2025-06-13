// src/shared/src_api/validators/abastecimiento.validators.js

const { body, param } = require("express-validator");
const { Producto, Empleado } = require("../models"); // Importar modelos directamente

/**
 * @description Valida los datos para crear un nuevo registro de abastecimiento.
 */
const createAbastecimientoValidator = [
  body("productoId")
    .notEmpty()
    .withMessage("El ID del producto es obligatorio.")
    .isInt({ gt: 0 })
    .withMessage("El ID del producto debe ser un entero positivo.")
    .custom(async (value) => {
      const producto = await Producto.findOne({
        where: { idProducto: value, estado: true },
      });
      if (!producto) {
        return Promise.reject(
          "El producto especificado no existe o no está activo."
        );
      }
    }),

  // Corregido: de 'empleadoAsignado' a 'empleadoId' para consistencia.
  body("empleadoId")
    .notEmpty()
    .withMessage("El ID del empleado es obligatorio.")
    .isInt({ gt: 0 })
    .withMessage("El ID del empleado asignado debe ser un entero positivo.")
    .custom(async (value) => {
      const empleado = await Empleado.findOne({
        where: { idEmpleado: value, estado: true },
      });
      if (!empleado) {
        return Promise.reject(
          "El empleado asignado especificado no existe o no está activo."
        );
      }
    }),

  body("cantidad")
    .notEmpty()
    .withMessage("La cantidad es obligatoria.")
    .isInt({ gt: 0 })
    .withMessage("La cantidad debe ser un entero positivo.")
    .toInt(),
];

/**
 * @description Valida los datos para actualizar un registro de abastecimiento existente.
 */
const updateAbastecimientoValidator = [
  // Corregido: El parámetro de la ruta es 'id'.
  param("id")
    .isInt({ gt: 0 })
    .withMessage("El ID del abastecimiento en la URL debe ser un entero positivo."),

  body("cantidad")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("La cantidad debe ser un entero positivo si se actualiza.")
    .toInt(),
  
  // Se valida que si se marca como agotado, la razón sea obligatoria.
  body("estaAgotado")
    .optional()
    .isBoolean()
    .withMessage('El campo "estaAgotado" debe ser un valor booleano.'),

  body("razonAgotamiento")
    .if(body("estaAgotado").equals("true")) // Condicional: solo si estaAgotado es true
    .notEmpty({ ignore_whitespace: true })
    .withMessage(
      "La razón de agotamiento es obligatoria si el producto se marca como agotado."
    )
    .isString()
    .withMessage("La razón de agotamiento debe ser texto."),
];

/**
 * @description Valida que el parámetro de ID en la URL sea válido.
 */
const idValidator = [
  // Corregido: El parámetro de la ruta es 'id'.
  param("id")
    .isInt({ gt: 0 })
    .withMessage("El ID en la URL debe ser un entero positivo."),
];

/**
 * @description Valida los datos para cambiar el estado (soft-delete) de un registro.
 */
const toggleEstadoValidator = [
  // Corregido: El parámetro de la ruta es 'id'.
  param("id")
    .isInt({ gt: 0 })
    .withMessage("El ID del abastecimiento en la URL debe ser un entero positivo."),

  body("estado")
    .exists({ checkNull: true })
    .withMessage("El campo 'estado' es obligatorio.")
    .isBoolean()
    .withMessage("El valor de 'estado' debe ser un booleano (true o false)."),
];

module.exports = {
  createAbastecimientoValidator,
  updateAbastecimientoValidator,
  idValidator,
  toggleEstadoValidator,
};