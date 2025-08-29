// src/shared/src_api/validators/usuario.validators.js
const { body, param, query } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");

// --- Expresiones Regulares para Validación Estricta ---
const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
const phoneRegex = /^\d{7,15}$/; // Acepta solo números, de 7 a 15 dígitos.
const docRegex = /^[a-zA-Z0-9]{5,20}$/; // Alfanumérico, de 5 a 20 caracteres.
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Formato de email estricto.
// Requiere: min 8 caracteres, 1 mayúscula, 1 minúscula, 1 número, 1 símbolo.
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// --- Validador para CREAR Usuario ---
const crearUsuarioValidators = [
  // --- Campos de Cuenta (Siempre Requeridos) ---
  body("correo")
    .trim()
    .notEmpty()
    .withMessage("El correo electrónico es obligatorio.")
    .isEmail()
    .withMessage("El formato del correo no es válido.")
    .matches(emailRegex)
    .withMessage("El correo electrónico no tiene un formato válido.")
    .normalizeEmail()
    .custom(async (value) => {
      const usuario = await db.Usuario.findOne({ where: { correo: value } });
      if (usuario) {
        return Promise.reject("Este correo electrónico ya está registrado.");
      }
    }),

  body("contrasena")
    .notEmpty()
    .withMessage("La contraseña es obligatoria.")
    .isLength({ min: 8 })
    .withMessage("La contraseña debe tener al menos 8 caracteres.")
    .matches(passwordRegex)
    .withMessage(
      "La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial."
    ),

  body("idRol")
    .notEmpty()
    .withMessage("Debe seleccionar un rol.")
    .isInt({ gt: 0 })
    .withMessage("El ID del rol no es válido."),

  // --- Validador Condicional Centralizado para Campos de Perfil ---
  body().custom(async (value, { req }) => {
    if (!req.body.idRol) return true; // Si no hay rol, otras validaciones ya fallaron.

    const rol = await db.Rol.findByPk(req.body.idRol);
    if (
      rol &&
      (rol.tipoPerfil === "CLIENTE" || rol.tipoPerfil === "EMPLEADO")
    ) {
      const requiredFields = {
        nombre: "El nombre es obligatorio.",
        apellido: "El apellido es obligatorio.",
        telefono: "El teléfono es obligatorio.",
        tipoDocumento: "El tipo de documento es obligatorio.",
        numeroDocumento: "El número de documento es obligatorio.",
        fechaNacimiento: "La fecha de nacimiento es obligatoria.",
      };

      if (rol.tipoPerfil === "CLIENTE") {
        requiredFields.direccion = "La dirección es obligatoria.";
      }

      for (const field in requiredFields) {
        if (!req.body[field] || String(req.body[field]).trim() === "") {
          throw new Error(requiredFields[field]);
        }
      }
    }
    return true;
  }),

  // --- Validaciones de Formato para Campos de Perfil (siempre se aplican si el campo existe) ---
  body("nombre")
    .optional({ checkFalsy: true })
    .trim()
    .matches(nameRegex)
    .withMessage("El nombre solo debe contener letras.")
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres."),
  body("apellido")
    .optional({ checkFalsy: true })
    .trim()
    .matches(nameRegex)
    .withMessage("El apellido solo debe contener letras.")
    .isLength({ min: 2, max: 100 })
    .withMessage("El apellido debe tener entre 2 y 100 caracteres."),
  body("telefono")
    .optional({ checkFalsy: true })
    .trim()
    .matches(phoneRegex)
    .withMessage("El teléfono debe contener entre 7 y 15 dígitos numéricos."),
  body("tipoDocumento")
    .optional({ checkFalsy: true })
    .isIn([
      "Cédula de Ciudadanía",
      "Cédula de Extranjería",
      "Pasaporte",
      "Tarjeta de Identidad",
    ])
    .withMessage("Tipo de documento no válido."),
  body("numeroDocumento")
    .optional({ checkFalsy: true })
    .trim()
    .matches(docRegex)
    .withMessage(
      "El documento debe tener entre 5 y 20 caracteres alfanuméricos."
    ),
  body("fechaNacimiento")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("La fecha de nacimiento no es válida (formato YYYY-MM-DD).")
    .toDate(),
  body("direccion")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage("La dirección debe tener entre 5 y 255 caracteres."),

  handleValidationErrors,
];

// --- Validador para ACTUALIZAR Usuario ---
const actualizarUsuarioValidators = [
  param("idUsuario")
    .isInt({ gt: 0 })
    .withMessage("El ID de usuario es inválido."),

  body("correo")
    .optional()
    .trim()
    .isEmail()
    .normalizeEmail()
    .custom(async (value, { req }) => {
      const usuario = await db.Usuario.findOne({
        where: {
          correo: value,
          idUsuario: { [db.Sequelize.Op.ne]: req.params.idUsuario },
        },
      });
      if (usuario) {
        return Promise.reject("Este correo ya está en uso por otro usuario.");
      }
    }),
  // No se valida la contraseña aquí, debe tener su propia ruta/lógica de "cambiar contraseña"
  body("idRol").optional().isInt({ gt: 0 }),
  body("estado").optional().isBoolean(),

  // Las validaciones de formato de perfil se mantienen igual que en la creación
  body("nombre")
    .optional({ checkFalsy: true })
    .trim()
    .matches(nameRegex)
    .isLength({ min: 2, max: 100 }),
  body("apellido")
    .optional({ checkFalsy: true })
    .trim()
    .matches(nameRegex)
    .isLength({ min: 2, max: 100 }),
  body("telefono").optional({ checkFalsy: true }).trim().matches(phoneRegex),
  body("numeroDocumento")
    .optional({ checkFalsy: true })
    .trim()
    .matches(docRegex),
  body("fechaNacimiento").optional({ checkFalsy: true }).isISO8601().toDate(),
  body("direccion")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 5, max: 255 }),

  handleValidationErrors,
];

// --- Otros Validadores (Sin cambios, pero revisados para consistencia) ---
const idUsuarioValidator = [
  param("idUsuario")
    .isInt({ gt: 0 })
    .withMessage("El ID de usuario debe ser un entero positivo."),
  handleValidationErrors,
];

const cambiarEstadoUsuarioValidators = [
  param("idUsuario")
    .isInt({ gt: 0 })
    .withMessage("El ID de usuario debe ser un entero positivo."),
  body("estado")
    .exists({ checkFalsy: false })
    .withMessage("El campo 'estado' es obligatorio.")
    .isBoolean()
    .withMessage("El valor de 'estado' debe ser un booleano."),
  handleValidationErrors,
];

const verificarCorreoValidators = [
  query("correo")
    .trim()
    .notEmpty()
    .withMessage("El correo es requerido.")
    .isEmail()
    .withMessage("Debe proporcionar un correo electrónico válido.")
    .normalizeEmail(),
  handleValidationErrors,
];

module.exports = {
  crearUsuarioValidators,
  actualizarUsuarioValidators,
  idUsuarioValidator,
  cambiarEstadoUsuarioValidators,
  verificarCorreoValidators,
};
