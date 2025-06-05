// src/shared/src_api/validators/empleado.validators.js
const { body, param } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");

const crearEmpleadoValidators = [
  // --- Campos para el Perfil del Empleado ---
  body("nombre")
    .trim()
    .notEmpty().withMessage("El nombre del empleado es obligatorio.")
    .isString().withMessage("El nombre del empleado debe ser texto.")
    .isLength({ min: 2, max: 100 }).withMessage("El nombre debe tener entre 2 y 100 caracteres."),
    // Si decides que Empleado también tiene apellido separado, añádelo aquí:
    // body("apellido").trim().notEmpty().withMessage("El apellido es obligatorio.").isLength({ min: 2, max: 100 }),
  body("tipoDocumento") // 'tipodocumento' en tu archivo original, mantenido en minúscula si así lo usa el frontend/servicio
    .trim()
    .notEmpty().withMessage("El tipo de documento es obligatorio.")
    .isString().withMessage("El tipo de documento debe ser texto.")
    .isIn(['Cédula de Ciudadanía', 'Cédula de Extranjería', 'Pasaporte', 'Tarjeta de Identidad']) // Ejemplo
    .withMessage("Tipo de documento no válido."),
  body("numeroDocumento") // 'numerodocumento' en tu archivo original
    .trim()
    .notEmpty().withMessage("El número de documento es obligatorio.")
    .isString().withMessage("El número de documento debe ser texto.")
    .isLength({ min: 5, max: 45 }).withMessage("El número de documento debe tener entre 5 y 45 caracteres.")
    .custom(async (value) => {
      const empleadoExistente = await db.Empleado.findOne({
        where: { numeroDocumento: value }, // Usar el nombre de campo del modelo/DB
      });
      if (empleadoExistente) {
        return Promise.reject(
          "El número de documento ya está registrado para otro empleado."
        );
      }
    }),
  body("fechaNacimiento") // 'fechanacimiento' en tu archivo original
    .notEmpty().withMessage("La fecha de nacimiento es obligatoria.")
    .isISO8601().withMessage("La fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD).")
    .toDate(),
  body("celular")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString().withMessage("El celular debe ser una cadena de texto.")
    .isLength({ min: 7, max: 45 }).withMessage("El celular debe tener entre 7 y 45 caracteres."),
  body("estadoEmpleado") // Estado para el perfil del Empleado
    .optional().isBoolean().withMessage("El estado del empleado debe ser un valor booleano."),

  // --- Campos para la Cuenta de Usuario asociada ---
  body("correo") // Este es el correo para la cuenta Usuario
    .trim()
    .notEmpty().withMessage("El correo electrónico para la cuenta es obligatorio.")
    .isEmail().withMessage("Debe proporcionar un correo electrónico válido.")
    .normalizeEmail()
    .custom(async (value) => {
      const usuarioExistente = await db.Usuario.findOne({ where: { correo: value } });
      if (usuarioExistente) {
        return Promise.reject("El correo electrónico ya está registrado para una cuenta de usuario.");
      }
      // La tabla Empleado no tiene campo 'correo' según tu SQL, así que no se valida unicidad aquí.
    }),
  body("contrasena")
    .notEmpty().withMessage("La contraseña para la cuenta es obligatoria.")
    .isString().withMessage("La contraseña debe ser una cadena de texto.")
    .isLength({ min: 8 }).withMessage("La contraseña debe tener al menos 8 caracteres."),
  body("estadoUsuario") // Estado para la cuenta Usuario
    .optional().isBoolean().withMessage("El estado de la cuenta de usuario debe ser un valor booleano."),
  
  handleValidationErrors,
];

const actualizarEmpleadoValidators = [
  param("idEmpleado")
    .isInt({ gt: 0 })
    .withMessage("El ID del empleado debe ser un entero positivo."),
  
  // Campos de Perfil Empleado (opcionales en actualización)
  body("nombre").optional().trim().notEmpty().withMessage("El nombre no puede ser vacío si se actualiza.").isString().withMessage("El nombre debe ser texto.").isLength({ min: 2, max: 100 }),
  // body("apellido").optional().trim().notEmpty().withMessage("El apellido no puede ser vacío si se actualiza.").isLength({ min: 2, max: 100 }), // Si Empleado tiene apellido
  body("tipoDocumento").optional().trim().notEmpty().withMessage("El tipo de documento no puede ser vacío si se actualiza.").isString().withMessage("El tipo de documento debe ser texto.").isIn(['Cédula de Ciudadanía', 'Cédula de Extranjería', 'Pasaporte', 'Tarjeta de Identidad']).withMessage("Tipo de documento no válido."),
  body("numeroDocumento").optional().trim().notEmpty().withMessage("El número de documento no puede ser vacío si se actualiza.").isString().withMessage("El número de documento debe ser texto.").isLength({ min: 5, max: 45 })
    .custom(async (value, { req }) => {
      if (value) {
        const idEmpleado = Number(req.params.idEmpleado);
        const empleadoExistente = await db.Empleado.findOne({
          where: {
            numeroDocumento: value, // Usar el nombre de campo del modelo/DB
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
  body("fechaNacimiento").optional().notEmpty().withMessage("La fecha de nacimiento no puede ser vacía si se actualiza.").isISO8601().withMessage("La fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD).").toDate(),
  body("celular").optional({ nullable: true, checkFalsy: true }).trim().isString().withMessage("El celular debe ser texto.").isLength({ min: 7, max: 45 }),
  body("estadoEmpleado").optional().isBoolean().withMessage("El estado del perfil del empleado debe ser un valor booleano."),

  // Campos de Cuenta Usuario (opcionales en actualización)
  body("correo") // Correo de la cuenta Usuario
    .optional({ checkFalsy: true })
    .trim().isEmail().withMessage("Debe proporcionar un correo electrónico válido si se actualiza.")
    .normalizeEmail()
    .custom(async (value, { req }) => {
      if (value) {
        const idEmpleado = Number(req.params.idEmpleado);
        const empleadoActual = await db.Empleado.findByPk(idEmpleado);
        if (empleadoActual && empleadoActual.idUsuario) {
          const otroUsuarioConCorreo = await db.Usuario.findOne({
            where: {
              correo: value,
              idUsuario: { [db.Sequelize.Op.ne]: empleadoActual.idUsuario },
            },
          });
          if (otroUsuarioConCorreo) {
            return Promise.reject("El correo electrónico ya está en uso por otra cuenta de usuario.");
          }
        } else if (empleadoActual && !empleadoActual.idUsuario) {
            // Si el empleado no tiene un usuario vinculado y se intenta asignar un correo,
            // verificar que el correo no exista en la tabla de usuarios.
            const usuarioExistente = await db.Usuario.findOne({ where: { correo: value } });
            if (usuarioExistente) {
                return Promise.reject("El correo electrónico ya está registrado para una cuenta de usuario.");
            }
        }
      }
    }),
  body("estadoUsuario").optional().isBoolean().withMessage("El estado de la cuenta de usuario debe ser un valor booleano."),
  // La contraseña del Usuario no se actualiza aquí, debe ser un flujo separado.
  // El idUsuario vinculado a un Empleado generalmente no se cambia.

  handleValidationErrors,
];

const idEmpleadoValidator = [ // Sin cambios
  param("idEmpleado")
    .isInt({ gt: 0 })
    .withMessage("El ID del empleado debe ser un entero positivo."),
  handleValidationErrors,
];

const gestionarEspecialidadesEmpleadoValidators = [ // Sin cambios, asumiendo que su lógica es independiente
  param("idEmpleado")
    .isInt({ gt: 0 })
    .withMessage("El ID del empleado debe ser un entero positivo."),
  body("idEspecialidades")
    .isArray({ min: 1 })
    .withMessage("Se requiere un array de idEspecialidades con al menos un elemento.")
    .custom((idEspecialidades) => {
      if (!idEspecialidades.every((id) => Number.isInteger(id) && id > 0)) {
        throw new Error("Cada idEspecialidad en el array debe ser un entero positivo.");
      }
      return true;
    }),
  handleValidationErrors,
];

const cambiarEstadoEmpleadoValidators = [ // Ya estaba correcto
  param("idEmpleado")
    .isInt({ gt: 0 })
    .withMessage("El ID del empleado debe ser un entero positivo."),
  body("estado") // Se refiere al estado del Empleado (perfil)
    .exists({ checkFalsy: false })
    .withMessage("El campo 'estado' es obligatorio en el cuerpo de la solicitud.")
    .isBoolean()
    .withMessage("El valor de 'estado' debe ser un booleano (true o false)."),
  handleValidationErrors,
];

module.exports = {
  crearEmpleadoValidators,
  actualizarEmpleadoValidators,
  idEmpleadoValidator,
  gestionarEspecialidadesEmpleadoValidators,
  cambiarEstadoEmpleadoValidators,
};