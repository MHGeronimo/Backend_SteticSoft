// src/validators/venta.validators.js
const { body, param } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");

const crearVentaValidators = [
  body("fecha")
    .optional()
    .isISO8601()
    .withMessage("La fecha debe ser válida (YYYY-MM-DD).")
    .toDate(),
  body("clienteId")
    .notEmpty()
    .withMessage("El ID del cliente es obligatorio.")
    .isInt({ gt: 0 })
    .withMessage("El ID del cliente debe ser un entero positivo.")
    .custom(async (value) => {
      const cliente = await db.Cliente.findOne({
        where: { idCliente: value, estado: true },
      });
      if (!cliente) {
        return Promise.reject(
          "El cliente especificado no existe o no está activo."
        );
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
  body("estadoVentaId")
    .notEmpty()
    .withMessage("El ID del estado de la venta es obligatorio.")
    .isInt({ gt: 0 })
    .withMessage("El ID del estado de la venta debe ser un entero positivo.")
    .custom(async (value) => {
      const estado = await db.Estado.findByPk(value);
      if (!estado) {
        return Promise.reject("El estado de venta especificado no existe.");
      }
    }),
  body("productos")
    .optional()
    .isArray()
    .withMessage("Los productos deben ser un array.")
    .custom((productos, { req }) => {
      if (productos) {
        if (
          productos.length === 0 &&
          (!req.body.servicios || req.body.servicios.length === 0)
        ) {
          throw new Error(
            "Una venta debe tener al menos un producto o un servicio."
          );
        }
        for (const p of productos) {
          if (
            !p.productoId ||
            typeof p.productoId !== "number" ||
            p.productoId <= 0 ||
            !Number.isInteger(p.productoId)
          ) {
            throw new Error(
              'Cada producto vendido debe tener un "productoId" (entero positivo) válido.'
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
          // No se valida valorUnitario aquí, se toma del backend
        }
      }
      return true;
    }),
  body("servicios")
    .optional()
    .isArray()
    .withMessage("Los servicios deben ser un array.")
    .custom((servicios, { req }) => {
      if (servicios) {
        if (
          servicios.length === 0 &&
          (!req.body.productos || req.body.productos.length === 0)
        ) {
          throw new Error(
            "Una venta debe tener al menos un producto o un servicio."
          );
        }
        for (const s of servicios) {
          if (
            !s.servicioId ||
            typeof s.servicioId !== "number" ||
            s.servicioId <= 0 ||
            !Number.isInteger(s.servicioId)
          ) {
            throw new Error(
              'Cada servicio vendido debe tener un "servicioId" (entero positivo) válido.'
            );
          }
          // No se valida valorServicio aquí, se toma del backend
          if (
            s.citaId !== undefined &&
            s.citaId !== null &&
            (!Number.isInteger(s.citaId) || s.citaId <= 0)
          ) {
            throw new Error(
              `El citaId para el servicio ID ${s.servicioId}, si se proporciona, debe ser un entero positivo.`
            );
          }
        }
      } else if (!req.body.productos || req.body.productos.length === 0) {
        // Si no hay servicios Y no hay productos
        throw new Error(
          "Una venta debe tener al menos un producto o un servicio."
        );
      }
      return true;
    }),
  body("estado") // Estado booleano del registro Venta (activo/inactivo)
    .optional()
    .isBoolean()
    .withMessage(
      "El estado de la venta (registro) debe ser un valor booleano."
    ),
  handleValidationErrors,
];

const actualizarEstadoProcesoVentaValidators = [
  param("idVenta")
    .isInt({ gt: 0 })
    .withMessage("El ID de la venta debe ser un entero positivo."),
  body("estadoVentaId")
    .notEmpty()
    .withMessage("El nuevo ID del estado de la venta es obligatorio.")
    .isInt({ gt: 0 })
    .withMessage(
      "El nuevo ID del estado de la venta debe ser un entero positivo."
    )
    .custom(async (value) => {
      const estado = await db.Estado.findByPk(value);
      if (!estado) {
        return Promise.reject(
          "El nuevo estado de venta especificado no existe."
        );
      }
    }),
  body("estado") // estado booleano general de la Venta
    .optional()
    .isBoolean()
    .withMessage(
      "El estado (activo/inactivo) de la venta debe ser un valor booleano si se proporciona."
    ),
  handleValidationErrors,
];

const idVentaValidator = [
  param("idVenta")
    .isInt({ gt: 0 })
    .withMessage("El ID de la venta debe ser un entero positivo."),
  handleValidationErrors,
];

module.exports = {
  crearVentaValidators,
  actualizarEstadoProcesoVentaValidators,
  idVentaValidator,
};
