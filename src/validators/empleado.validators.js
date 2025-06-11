// src/validators/empleado.validators.js
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
  body("apellido") // Nuevo campo: Apellido
    .trim()
    .notEmpty().withMessage("El apellido del empleado es obligatorio.")
    .isString().withMessage("El apellido del empleado debe ser texto.")
    .isLength({ min: 2, max: 100 }).withMessage("El apellido debe tener entre 2 y 100 caracteres."),
  body("correo") // Nuevo campo: Correo del empleado (asumimos que es el mismo que el del usuario)
    .trim()
    .notEmpty().withMessage("El correo electrónico del empleado es obligatorio.")
    .isEmail().withMessage("Debe proporcionar un correo electrónico válido para el empleado.")
    .normalizeEmail()
    .custom(async (value) => {
      // Validar que el correo no esté ya en uso por otro Empleado
      const empleadoExistente = await db.Empleado.findOne({ where: { correo: value } });
      if (empleadoExistente) {
        return Promise.reject("El correo electrónico ya está registrado para otro perfil de empleado.");
      }
      // Validar que el correo no esté ya en uso por otro Usuario
      const usuarioExistente = await db.Usuario.findOne({ where: { correo: value } });
      if (usuarioExistente) {
        return Promise.reject("El correo electrónico ya está registrado para otra cuenta de usuario.");
      }
    }),
  body("telefono") // Nuevo campo: Teléfono (reemplaza a celular)
    .trim()
    .notEmpty().withMessage("El teléfono del empleado es obligatorio.")
    .isString().withMessage("El teléfono del empleado debe ser una cadena de texto.")
    .isLength({ min: 7, max: 45 }).withMessage("El teléfono debe tener entre 7 y 45 caracteres."),
  body("tipoDocumento")
    .trim()
    .notEmpty().withMessage("El tipo de documento es obligatorio.")
    .isString().withMessage("El tipo de documento debe ser texto.")
    .isIn(['Cédula de Ciudadanía', 'Cédula de Extranjería', 'Pasaporte', 'Tarjeta de Identidad'])
    .withMessage("Tipo de documento no válido."),
  body("numeroDocumento")
    .trim()
    .notEmpty().withMessage("El número de documento es obligatorio.")
    .isString().withMessage("El número de documento debe ser texto.")
    .isLength({ min: 5, max: 45 }).withMessage("El número de documento debe tener entre 5 y 45 caracteres.")
    .custom(async (value) => {
      const empleadoExistente = await db.Empleado.findOne({
        where: { numeroDocumento: value },
      });
      if (empleadoExistente) {
        return Promise.reject("El número de documento ya está registrado para otro empleado.");
      }
    }),
  body("fechaNacimiento")
    .notEmpty().withMessage("La fecha de nacimiento es obligatoria.")
    .isISO8601().withMessage("La fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD).")
    .toDate(),
  body("estadoEmpleado")
    .optional().isBoolean().withMessage("El estado del empleado debe ser un valor booleano."),

  // --- Campos para la Cuenta de Usuario asociada ---
  // El campo 'correo' ya fue validado arriba y se usará para la cuenta de usuario
  body("contrasena")
    .notEmpty().withMessage("La contraseña para la cuenta es obligatoria.")
    .isString().withMessage("La contraseña debe ser una cadena de texto.")
    .isLength({ min: 8 }).withMessage("La contraseña debe tener al menos 8 caracteres."),
  body("estadoUsuario")
    .optional().isBoolean().withMessage("El estado de la cuenta de usuario debe ser un valor booleano."),
  
  handleValidationErrors,
];

const actualizarEmpleadoValidators = [
  param("idEmpleado")
    .isInt({ gt: 0 })
    .withMessage("El ID del empleado debe ser un entero positivo."),
  
  // Campos de Perfil Empleado (opcionales en actualización)
  body("nombre").optional().trim().notEmpty().withMessage("El nombre no puede ser vacío si se actualiza.").isString().withMessage("El nombre debe ser texto.").isLength({ min: 2, max: 100 }),
  body("apellido").optional().trim().notEmpty().withMessage("El apellido no puede ser vacío si se actualiza.").isString().withMessage("El apellido debe ser texto.").isLength({ min: 2, max: 100 }), // Añadido
  body("correo").optional().trim().notEmpty().withMessage("El correo electrónico no puede ser vacío si se actualiza.").isEmail().withMessage("Debe proporcionar un correo electrónico válido.")
    .normalizeEmail()
    .custom(async (value, { req }) => {
      if (value) {
        const idEmpleado = Number(req.params.idEmpleado);
        
        // Verificar si el correo ya está en uso por otro Empleado (excluyendo el actual)
        const empleadoExistente = await db.Empleado.findOne({
          where: { correo: value, idEmpleado: { [db.Sequelize.Op.ne]: idEmpleado } },
        });
        if (empleadoExistente) {
          return Promise.reject("El correo electrónico ya está registrado por otro perfil de empleado.");
        }

        // Verificar si el correo está en uso por otra cuenta de Usuario (excluyendo la asociada al empleado actual)
        const empleadoActual = await db.Empleado.findByPk(idEmpleado);
        if (empleadoActual && empleadoActual.idUsuario) {
          const otroUsuarioConCorreo = await db.Usuario.findOne({
            where: { correo: value, idUsuario: { [db.Sequelize.Op.ne]: empleadoActual.idUsuario } },
          });
          if (otroUsuarioConCorreo) {
            return Promise.reject("El correo electrónico ya está en uso por otra cuenta de usuario.");
          }
        }
      }
    }),
  body("telefono").optional().trim().notEmpty().withMessage("El teléfono no puede ser vacío si se actualiza.").isString().withMessage("El teléfono debe ser texto.").isLength({ min: 7, max: 45 }), // Añadido
  body("tipoDocumento").optional().trim().notEmpty().withMessage("El tipo de documento no puede ser vacío si se actualiza.").isString().withMessage("El tipo de documento debe ser texto.").isIn(['Cédula de Ciudadanía', 'Cédula de Extranjería', 'Pasaporte', 'Tarjeta de Identidad']).withMessage("Tipo de documento no válido."),
  body("numeroDocumento").optional().trim().notEmpty().withMessage("El número de documento no puede ser vacío si se actualiza.").isString().withMessage("El número de documento debe ser texto.").isLength({ min: 5, max: 45 })
    .custom(async (value, { req }) => {
      if (value) {
        const idEmpleado = Number(req.params.idEmpleado);
        const empleadoExistente = await db.Empleado.findOne({
          where: {
            numeroDocumento: value,
            idEmpleado: { [db.Sequelize.Op.ne]: idEmpleado },
          },
        });
        if (empleadoExistente) {
          return Promise.reject("El número de documento ya está registrado por otro empleado.");
        }
      }
    }),
  body("fechaNacimiento").optional().notEmpty().withMessage("La fecha de nacimiento no puede ser vacía si se actualiza.").isISO8601().withMessage("La fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD).").toDate(),
  body("estadoEmpleado").optional().isBoolean().withMessage("El estado del perfil del empleado debe ser un valor booleano."),

  // Campos de Cuenta Usuario (opcionales en actualización)
  // El correo del Usuario se actualiza a través del campo de correo del Empleado,
  // por lo que no se requiere una entrada separada 'correoUsuario'.
  body("estadoUsuario").optional().isBoolean().withMessage("El estado de la cuenta de usuario debe ser un valor booleano."),
  
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

const cambiarEstadoEmpleadoValidators = [
  param("idEmpleado")
    .isInt({ gt: 0 })
    .withMessage("El ID del empleado debe ser un entero positivo."),
  body("estado")
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