// src/validators/compra.validators.js
const { body, param } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");

const crearCompraValidators = [
  body("fecha")
    .optional()
    .isISO8601()
    .withMessage("La fecha debe ser válida (YYYY-MM-DD).")
    .custom((value) => {
      if (!value) return true; // Si es opcional y no se provee, está bien
      const fechaIngresada = new Date(value);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0); // Ignorar la hora para la comparación

      if (fechaIngresada > hoy) {
        throw new Error("La fecha de la compra no puede ser futura.");
      }
      return true;
    })
    .custom((value) => {
      if (!value) return true; // Si es opcional y no se provee, está bien
      const fechaIngresada = new Date(value);
      const hoy = new Date();
      const fechaMinima = new Date(hoy.setFullYear(hoy.getFullYear() - 5)); // Resta 5 años
      fechaMinima.setHours(0, 0, 0, 0); // Ignorar la hora

      if (fechaIngresada < fechaMinima) {
        throw new Error("La fecha de la compra no puede ser de hace más de 5 años.");
      }
      return true;
    }),
  body("proveedorId")
    .notEmpty()
    .withMessage("El ID del proveedor es obligatorio.")
    .isInt({ gt: 0 })
    .withMessage("El ID del proveedor debe ser un entero positivo.")
    .custom(async (value) => {
      if (value) {
        const proveedor = await db.Proveedor.findOne({
          where: { idProveedor: value, estado: true },
        });
        if (!proveedor) {
          return Promise.reject(
            "El proveedor especificado no existe o no está activo."
          );
        }
      }
    }),
  body("dashboardId")
    .optional({ nullable: true })
    .isInt({ gt: 0 })
    .withMessage(
      "El ID del dashboard debe ser un entero positivo si se proporciona."
    )
    .custom(async (value) => {
      if (value) {
        const dashboard = await db.Dashboard.findByPk(value);
        if (!dashboard) {
          return Promise.reject("El dashboard especificado no existe.");
        }
      }
    }),
  body("productos")
    .isArray({ min: 1 })
    .withMessage("Se requiere al menos un producto para la compra.")
    .custom((productos) => {
      for (const p of productos) {
        if (
          !p.productoId ||
          typeof p.productoId !== "number" ||
          p.productoId <= 0 ||
          !Number.isInteger(p.productoId)
        ) {
          throw new Error(
            'Cada producto debe tener un "productoId" (entero positivo) válido.'
          );
        }
        if (
          typeof p.cantidad !== "number" ||
          p.cantidad <= 0 ||
          !Number.isInteger(p.cantidad)
        ) {
          throw new Error(
            `La cantidad para el producto ID ${p.productoId} debe ser un entero positivo.`
          );
        }
        if (typeof p.valorUnitario !== "number" || p.valorUnitario < 0) {
          throw new Error(
            `El valor unitario para el producto ID ${p.productoId} debe ser un número no negativo.`
          );
        }
      }
      return true;
    }),
  body("total")
    .optional({ checkFalsy: true })
    .isFloat({ gt: -0.01 })
    .withMessage("El total debe ser un número no negativo."),
  body("iva")
    .optional({ checkFalsy: true })
    .isFloat({ gt: -0.01 })
    .withMessage("El IVA debe ser un número no negativo."),
  body("estado")
    .optional()
    .isBoolean()
    .withMessage(
      "El estado de la compra debe ser un valor booleano (true o false)."
    ),
  handleValidationErrors,
];

const actualizarCompraValidators = [
  param("idCompra")
    .isInt({ gt: 0 })
    .withMessage("El ID de la compra debe ser un entero positivo."),
  body("fecha")
    .optional()
    .isISO8601()
    .withMessage("La fecha debe ser válida (YYYY-MM-DD).")
    .toDate()
    .custom((value) => {
      if (!value) return true; // Si es opcional y no se provee, está bien
      // value ya es un objeto Date gracias a .toDate()
      const fechaIngresada = value;
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0); // Ignorar la hora para la comparación

      if (fechaIngresada > hoy) {
        throw new Error("La fecha de la compra no puede ser futura.");
      }
      return true;
    })
    .custom((value) => {
      if (!value) return true; // Si es opcional y no se provee, está bien
      // value ya es un objeto Date
      const fechaIngresada = value;
      const hoy = new Date(); // Necesitamos una nueva instancia de 'hoy' porque setFullYear la modifica
      const fechaMinima = new Date(hoy.setFullYear(hoy.getFullYear() - 5)); // Resta 5 años
      fechaMinima.setHours(0, 0, 0, 0); // Ignorar la hora

      if (fechaIngresada < fechaMinima) {
        throw new Error("La fecha de la compra no puede ser de hace más de 5 años.");
      }
      return true;
    }),
  body("proveedorId")
    .optional()
    .isInt({ gt: 0 })
    .withMessage(
      "El ID del proveedor debe ser un entero positivo si se actualiza."
    )
    .custom(async (value) => {
      if (value) {
        const proveedor = await db.Proveedor.findOne({
          where: { idProveedor: value, estado: true },
        });
        if (!proveedor) {
          return Promise.reject(
            "El proveedor especificado para actualizar no existe o no está activo."
          );
        }
      }
    }),
  body("dashboardId")
    .optional({ nullable: true })
    .custom(async (value) => {
      if (value !== null && value !== undefined) {
        if (!(Number.isInteger(value) && value > 0)) {
          throw new Error(
            "El ID del dashboard debe ser un entero positivo o null."
          );
        }
        const dashboard = await db.Dashboard.findByPk(value);
        if (!dashboard) {
          return Promise.reject(
            "El dashboard especificado para actualizar no existe."
          );
        }
      }
      return true;
    }),
  body("estado")
    .optional()
    .isBoolean()
    .withMessage(
      "El estado de la compra debe ser un valor booleano (true o false) si se actualiza."
    ),
  handleValidationErrors,
];

const idCompraValidator = [
  param("idCompra")
    .isInt({ gt: 0 })
    .withMessage("El ID de la compra debe ser un entero positivo."),
  handleValidationErrors,
];

// Nuevo validador para cambiar el estado
const cambiarEstadoCompraValidators = [
  param("idCompra")
    .isInt({ gt: 0 })
    .withMessage("El ID de la compra debe ser un entero positivo."),
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
  crearCompraValidators,
  actualizarCompraValidators,
  idCompraValidator,
  cambiarEstadoCompraValidators, // <-- Exportar nuevo validador
};
