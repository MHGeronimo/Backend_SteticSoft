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
  body("idCliente")
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
  body("idEstado")
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
            !p.idProducto ||
            typeof p.idProducto !== "number" ||
            p.idProducto <= 0 ||
            !Number.isInteger(p.idProducto)
          ) {
            throw new Error(
              'Cada producto vendido debe tener un "idProducto" (entero positivo) válido.'
            );
          }
          if (
            typeof p.cantidad !== "number" ||
            p.cantidad <= 0 ||
            !Number.isInteger(p.cantidad)
          ) {
            throw new Error(
              `La cantidad para el producto ID ${p.idProducto} debe ser un entero positivo.`
            );
          }
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
            !s.idServicio ||
            typeof s.idServicio !== "number" ||
            s.idServicio <= 0 ||
            !Number.isInteger(s.idServicio)
          ) {
            throw new Error(
              'Cada servicio vendido debe tener un "idServicio" (entero positivo) válido.'
            );
          }
          if (
            s.idCita !== undefined &&
            s.idCita !== null &&
            (!Number.isInteger(s.idCita) || s.idCita <= 0)
          ) {
            throw new Error(
              `El idCita para el servicio ID ${s.idServicio}, si se proporciona, debe ser un entero positivo.`
            );
          }
        }
      } else if (!req.body.productos || req.body.productos.length === 0) {
        throw new Error(
          "Una venta debe tener al menos un producto o un servicio."
        );
      }
      return true;
    }),
  body("estado")
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

  // 👇 CAMBIO IMPORTANTE AQUÍ
  body("idEstado") // Cambiamos "estadoVentaId" por "idEstado"
    .notEmpty()
    .withMessage("El campo 'idEstado' es obligatorio.")
    .isInt({ gt: 0 })
    .withMessage("El nuevo ID del estado de la venta debe ser un entero positivo.")
    .custom(async (value) => {
      const estado = await db.Estado.findByPk(value);
      if (!estado) {
        return Promise.reject("El nuevo estado de venta especificado no existe.");
      }
    }),
  handleValidationErrors,
];

// Nota: He simplificado un poco este validador para que sea más claro y directo
// para la ruta PUT que se encarga de actualizar el estado del proceso.

const idVentaValidator = [
  param("idVenta")
    .isInt({ gt: 0 })
    .withMessage("El ID de la venta debe ser un entero positivo."),
  handleValidationErrors,
];

// Nuevo validador para la ruta PATCH /:idVenta/estado
// Esta ruta se enfocará en cambiar el estado BOOLEANO general de la venta.
// La lógica de cambiar el estado del PROCESO de la venta (estadoVentaId)
// ya está en actualizarEstadoProcesoVentaValidators y su ruta PUT.
const cambiarEstadoVentaValidators = [
  param("idVenta")
    .isInt({ gt: 0 })
    .withMessage("El ID de la venta debe ser un entero positivo."),
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
  crearVentaValidators,
  actualizarEstadoProcesoVentaValidators, // Para la ruta PUT /:idVenta/estado-proceso
  idVentaValidator,
  cambiarEstadoVentaValidators, // Para la nueva ruta PATCH /:idVenta/estado
};
