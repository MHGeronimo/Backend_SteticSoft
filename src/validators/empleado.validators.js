// src/validators/empleado.validators.js
const { body, param } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");

const crearEmpleadoValidators = [
  body("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre del empleado es obligatorio.")
    .isString()
    .withMessage("El nombre del empleado debe ser texto.")
    .isLength({ min: 2, max: 45 })
    .withMessage("El nombre debe tener entre 2 y 45 caracteres."),
  body("tipodocumento")
    .trim()
    .notEmpty()
    .withMessage("El tipo de documento es obligatorio.")
    .isString()
    .withMessage("El tipo de documento debe ser texto."),
  body("numerodocumento")
    .trim()
    .notEmpty()
    .withMessage("El número de documento es obligatorio.")
    .isString()
    .withMessage("El número de documento debe ser texto.")
    .isLength({ min: 5, max: 45 })
    .withMessage("El número de documento debe tener entre 5 y 45 caracteres.")
    .custom(async (value) => {
      const empleadoExistente = await db.Empleado.findOne({
        where: { numerodocumento: value },
      });
      if (empleadoExistente) {
        return Promise.reject(
          "El número de documento ya está registrado para otro empleado."
        );
      }
    }),
  body("fechanacimiento")
    .notEmpty()
    .withMessage("La fecha de nacimiento es obligatoria.")
    .isISO8601()
    .withMessage(
      "La fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)."
    )
    .toDate(),
  body("celular")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString()
    .withMessage("El celular debe ser una cadena de texto.")
    .isLength({ min: 7, max: 45 })
    .withMessage("El celular debe tener entre 7 y 45 caracteres."),
  // Podrías añadir .isNumeric() o un regex si quieres un formato específico
  body("estado")
    .optional()
    .isBoolean()
    .withMessage("El estado debe ser un valor booleano (true o false)."),
  handleValidationErrors,
];

const actualizarEmpleadoValidators = [
  param("idEmpleado")
    .isInt({ gt: 0 })
    .withMessage("El ID del empleado debe ser un entero positivo."),
  body("nombre")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("El nombre no puede ser vacío si se actualiza.")
    .isString()
    .withMessage("El nombre debe ser texto.")
    .isLength({ min: 2, max: 45 })
    .withMessage("El nombre debe tener entre 2 y 45 caracteres."),
  body("tipodocumento")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("El tipo de documento no puede ser vacío si se actualiza.")
    .isString()
    .withMessage("El tipo de documento debe ser texto."),
  body("numerodocumento")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("El número de documento no puede ser vacío si se actualiza.")
    .isString()
    .withMessage("El número de documento debe ser texto.")
    .isLength({ min: 5, max: 45 })
    .withMessage("El número de documento debe tener entre 5 y 45 caracteres.")
    .custom(async (value, { req }) => {
      if (value) {
        const idEmpleado = Number(req.params.idEmpleado);
        const empleadoExistente = await db.Empleado.findOne({
          where: {
            numerodocumento: value,
            idEmpleado: { [db.Sequelize.Op.ne]: idEmpleado },
          },
        });
        if (empleadoExistente) {
          return Promise.reject(
            "El número de documento ya está registrado por otro empleado."
          );
        }
      }
    }),
  body("fechanacimiento")
    .optional()
    .notEmpty()
    .withMessage("La fecha de nacimiento no puede ser vacía si se actualiza.")
    .isISO8601()
    .withMessage(
      "La fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)."
    )
    .toDate(),
  body("celular")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString()
    .withMessage("El celular debe ser texto.")
    .isLength({ min: 7, max: 45 })
    .withMessage("El celular debe tener entre 7 y 45 caracteres."),
  body("estado")
    .optional()
    .isBoolean()
    .withMessage("El estado debe ser un valor booleano (true o false)."),
  handleValidationErrors,
];

const idEmpleadoValidator = [
  param("idEmpleado")
    .isInt({ gt: 0 })
    .withMessage("El ID del empleado debe ser un entero positivo."),
  handleValidationErrors,
];

const gestionarEspecialidadesEmpleadoValidators = [
  param("idEmpleado")
    .isInt({ gt: 0 })
    .withMessage("El ID del empleado debe ser un entero positivo."),
  body("idEspecialidades") // Asumimos que el cuerpo enviará un array de IDs de especialidades
    .isArray({ min: 1 })
    .withMessage(
      "Se requiere un array de idEspecialidades con al menos un elemento."
    )
    .custom((idEspecialidades) => {
      if (!idEspecialidades.every((id) => Number.isInteger(id) && id > 0)) {
        throw new Error(
          "Cada idEspecialidad en el array debe ser un entero positivo."
        );
      }
      return true;
    }),
  handleValidationErrors,
];

// Validador para cuando solo se necesita el idEmpleado y un idEspecialidad en el path (para quitar una específica si se opta por esa ruta)
// const gestionarUnaEspecialidadEmpleadoValidators = [
//   param('idEmpleado')
//     .isInt({ gt: 0 }).withMessage('El ID del empleado debe ser un entero positivo.'),
//   param('idEspecialidad')
//     .isInt({ gt: 0 }).withMessage('El ID de la especialidad debe ser un entero positivo.'),
//   handleValidationErrors
// ];

module.exports = {
  crearEmpleadoValidators,
  actualizarEmpleadoValidators,
  idEmpleadoValidator,
  gestionarEspecialidadesEmpleadoValidators, // Nuevo validador
  // gestionarUnaEspecialidadEmpleadoValidators, // Si decides usarlo
};
