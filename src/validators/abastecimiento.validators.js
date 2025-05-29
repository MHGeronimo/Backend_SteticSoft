// src/validators/abastecimiento.validators.js
const { body, param } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");

const crearAbastecimientoValidators = [
  body("productoId")
    .notEmpty()
    .withMessage("El ID del producto es obligatorio.")
    .isInt({ gt: 0 })
    .withMessage("El ID del producto debe ser un entero positivo.")
    .custom(async (value) => {
      const producto = await db.Producto.findOne({
        where: { idProducto: value, estado: true },
      });
      if (!producto) {
        return Promise.reject(
          "El producto especificado no existe o no está activo."
        );
      }
    }),
  body("cantidad")
    .notEmpty()
    .withMessage("La cantidad es obligatoria.")
    .isInt({ gt: 0 })
    .withMessage("La cantidad debe ser un entero positivo.")
    .toInt(),
  body("fechaIngreso")
    .optional()
    .isISO8601()
    .withMessage("La fecha de ingreso debe ser una fecha válida (YYYY-MM-DD).")
    .toDate(),
  body("empleadoAsignado")
    .optional({ nullable: true })
    .isInt({ gt: 0 })
    .withMessage(
      "El ID del empleado asignado debe ser un entero positivo si se proporciona."
    )
    .custom(async (value) => {
      if (value) {
        const empleado = await db.Empleado.findOne({
          where: { idEmpleado: value, estado: true },
        });
        if (!empleado) {
          return Promise.reject(
            "El empleado asignado especificado no existe o no está activo."
          );
        }
      }
    }),
  body("estado")
    .optional()
    .isBoolean()
    .withMessage("El estado del abastecimiento debe ser un valor booleano."),
  handleValidationErrors,
];

const actualizarAbastecimientoValidators = [
  param("idAbastecimiento")
    .isInt({ gt: 0 })
    .withMessage("El ID del abastecimiento debe ser un entero positivo."),
  body("cantidad")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("La cantidad debe ser un entero positivo si se actualiza.")
    .toInt(),
  body("empleadoAsignado")
    .optional({ nullable: true })
    .custom(async (value) => {
      if (value !== null && value !== undefined) {
        if (!(Number.isInteger(value) && value > 0)) {
          throw new Error(
            "El ID del empleado asignado debe ser un entero positivo o null."
          );
        }
        const empleado = await db.Empleado.findOne({
          where: { idEmpleado: value, estado: true },
        });
        if (!empleado)
          return Promise.reject(
            "El empleado asignado especificado no existe o no está activo."
          );
      }
      return true;
    }),
  body("estaAgotado")
    .optional()
    .isBoolean()
    .withMessage('El campo "estaAgotado" debe ser un valor booleano.'),
  body("razonAgotamiento")
    .optional({ nullable: true, checkFalsy: true })
    .if(body("estaAgotado").equals("true"))
    .notEmpty()
    .withMessage(
      "La razón de agotamiento es obligatoria si el producto se marca como agotado."
    )
    .isString()
    .withMessage("La razón de agotamiento debe ser texto."),
  body("fechaAgotamiento")
    .optional({ nullable: true })
    .if(body("estaAgotado").equals("true"))
    .notEmpty()
    .withMessage(
      "La fecha de agotamiento es obligatoria si el producto se marca como agotado."
    )
    .isISO8601()
    .withMessage(
      "La fecha de agotamiento debe ser una fecha válida (YYYY-MM-DD)."
    )
    .toDate(),
  body("estado")
    .optional()
    .isBoolean()
    .withMessage(
      "El estado del abastecimiento debe ser un valor booleano si se actualiza."
    ),
  handleValidationErrors,
];

const idAbastecimientoValidator = [
  param("idAbastecimiento")
    .isInt({ gt: 0 })
    .withMessage("El ID del abastecimiento debe ser un entero positivo."),
  handleValidationErrors,
];

// Nuevo validador para cambiar el estado
const cambiarEstadoAbastecimientoValidators = [
  param("idAbastecimiento")
    .isInt({ gt: 0 })
    .withMessage("El ID del abastecimiento debe ser un entero positivo."),
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
  crearAbastecimientoValidators,
  actualizarAbastecimientoValidators,
  idAbastecimientoValidator,
  cambiarEstadoAbastecimientoValidators, // <-- Exportar nuevo validador
};
