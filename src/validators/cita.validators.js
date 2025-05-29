// src/validators/cita.validators.js
const { body, param } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");
const moment = require("moment-timezone");

const crearCitaValidators = [
  body("fechaHora")
    .notEmpty()
    .withMessage("La fecha y hora de la cita son obligatorias.")
    .isISO8601()
    .withMessage(
      "La fecha y hora deben estar en formato ISO8601 (YYYY-MM-DDTHH:mm:ssZ)."
    )
    .custom((value) => {
      if (moment(value).isBefore(moment())) {
        throw new Error(
          "La fecha y hora de la cita no pueden ser en el pasado."
        );
      }
      return true;
    })
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
  body("empleadoId")
    .optional({ nullable: true })
    .isInt({ gt: 0 })
    .withMessage(
      "El ID del empleado debe ser un entero positivo si se proporciona."
    )
    .custom(async (value) => {
      if (value) {
        const empleado = await db.Empleado.findOne({
          where: { idEmpleado: value, estado: true },
        });
        if (!empleado) {
          return Promise.reject(
            "El empleado especificado no existe o no está activo."
          );
        }
      }
    }),
  body("estadoCitaId")
    .notEmpty()
    .withMessage("El ID del estado de la cita es obligatorio.")
    .isInt({ gt: 0 })
    .withMessage("El ID del estado de la cita debe ser un entero positivo.")
    .custom(async (value) => {
      const estado = await db.Estado.findByPk(value);
      if (!estado) {
        return Promise.reject("El estado de la cita especificado no existe.");
      }
    }),
  body("servicios")
    .optional()
    .isArray()
    .withMessage("Los servicios deben ser un array de IDs.")
    .custom((servicios) => {
      if (servicios && servicios.length > 0) {
        if (!servicios.every((id) => Number.isInteger(id) && id > 0)) {
          throw new Error(
            "Cada ID de servicio en el array debe ser un entero positivo."
          );
        }
      }
      return true;
    }),
  body("estado")
    .optional()
    .isBoolean()
    .withMessage("El estado de la cita (registro) debe ser un valor booleano."),
  handleValidationErrors,
];

const actualizarCitaValidators = [
  param("idCita")
    .isInt({ gt: 0 })
    .withMessage("El ID de la cita debe ser un entero positivo."),
  body("fechaHora")
    .optional()
    .isISO8601()
    .withMessage(
      "La fecha y hora deben estar en formato ISO8601 si se actualizan."
    )
    .custom((value) => {
      if (moment(value).isBefore(moment().subtract(1, "hour"))) {
        // Permite un pequeño margen para ajustes
        throw new Error(
          "La nueva fecha y hora de la cita no pueden ser en el pasado."
        );
      }
      return true;
    })
    .toDate(),
  body("clienteId")
    .optional()
    .isInt({ gt: 0 })
    .withMessage(
      "El ID del cliente debe ser un entero positivo si se actualiza."
    )
    .custom(async (value) => {
      if (value) {
        const cliente = await db.Cliente.findOne({
          where: { idCliente: value, estado: true },
        });
        if (!cliente)
          return Promise.reject(
            "El nuevo cliente especificado no existe o no está activo."
          );
      }
    }),
  body("empleadoId")
    .optional({ nullable: true })
    .custom(async (value) => {
      if (value !== null && value !== undefined) {
        if (!(Number.isInteger(value) && value > 0)) {
          throw new Error(
            "El ID del empleado debe ser un entero positivo o null."
          );
        }
        const empleado = await db.Empleado.findOne({
          where: { idEmpleado: value, estado: true },
        });
        if (!empleado)
          return Promise.reject(
            "El nuevo empleado especificado no existe o no está activo."
          );
      }
      return true;
    }),
  body("estadoCitaId")
    .optional()
    .isInt({ gt: 0 })
    .withMessage(
      "El ID del estado de la cita debe ser un entero positivo si se actualiza."
    )
    .custom(async (value) => {
      if (value) {
        const estado = await db.Estado.findByPk(value);
        if (!estado)
          return Promise.reject(
            "El nuevo estado de cita especificado no existe."
          );
      }
    }),
  body("estado") // Validador para el estado booleano general de la Cita
    .optional()
    .isBoolean()
    .withMessage(
      "El estado (activo/inactivo) de la cita debe ser un valor booleano si se actualiza."
    ),
  handleValidationErrors,
];

const idCitaValidator = [
  param("idCita")
    .isInt({ gt: 0 })
    .withMessage("El ID de la cita debe ser un entero positivo."),
  handleValidationErrors,
];

const gestionarServiciosCitaValidator = [
  param("idCita")
    .isInt({ gt: 0 })
    .withMessage("El ID de la cita debe ser un entero positivo."),
  body("idServicios")
    .isArray({ min: 1 })
    .withMessage(
      "Se requiere un array de idServicios con al menos un elemento."
    )
    .custom((idServicios) => {
      if (!idServicios.every((id) => Number.isInteger(id) && id > 0)) {
        throw new Error(
          "Cada ID de servicio en el array debe ser un entero positivo."
        );
      }
      return true;
    }),
  handleValidationErrors,
];

// Nuevo validador para cambiar el estado booleano general
const cambiarEstadoCitaValidators = [
  param("idCita")
    .isInt({ gt: 0 })
    .withMessage("El ID de la cita debe ser un entero positivo."),
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
  crearCitaValidators,
  actualizarCitaValidators,
  idCitaValidator,
  gestionarServiciosCitaValidator,
  cambiarEstadoCitaValidators, // <-- Exportar nuevo validador
};
