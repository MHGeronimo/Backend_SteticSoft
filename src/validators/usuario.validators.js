// src/validators/usuario.validators.js
const { body, param, query } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models");

const crearUsuarioValidators = [
  // Validaciones para la entidad Usuario
  body("correo")
    .trim()
    .notEmpty()
    .withMessage("La dirección de correo es obligatoria.")
    .isEmail()
    .withMessage("Debe proporcionar una dirección de correo válida.")
    .normalizeEmail()
    .custom(async (value) => {
      const usuarioExistente = await db.Usuario.findOne({
        where: { correo: value },
      });
      if (usuarioExistente) {
        return Promise.reject(
          "La dirección de correo ya está registrada para una cuenta de usuario."
        );
      }
    }),
  body("contrasena")
    .notEmpty()
    .withMessage("La contraseña es obligatoria.")
    .isString()
    .withMessage("La contraseña debe ser una cadena de texto.")
    .isLength({ min: 8 })
    .withMessage("La contraseña debe tener al menos 8 caracteres."),
  body("idRol")
    .notEmpty()
    .withMessage("El ID del rol es obligatorio.")
    .isInt({ gt: 0 })
    .withMessage("El ID del rol debe ser un entero positivo.")
    .custom(async (value) => {
      const rolExistente = await db.Rol.findByPk(value);
      if (!rolExistente) {
        return Promise.reject("El rol especificado no existe.");
      }
      if (!rolExistente.estado) {
        return Promise.reject("El rol especificado no está activo.");
      }
    }),
  body("estado")
    .optional()
    .isBoolean()
    .withMessage("El estado debe ser un valor booleano (true o false)."),

  // Validaciones para los campos del Perfil (Cliente/Empleado)
  body("nombre")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("El nombre no puede estar vacío si se proporciona.")
    .isString()
    .withMessage("El nombre debe ser una cadena de texto.")
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres."),

  body("apellido")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("El apellido no puede estar vacío si se proporciona.")
    .isString()
    .withMessage("El apellido debe ser una cadena de texto.")
    .isLength({ min: 2, max: 100 })
    .withMessage("El apellido debe tener entre 2 y 100 caracteres."),

  body("telefono")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("El número de teléfono no puede estar vacío si se proporciona.")
    .isString()
    .withMessage("El número de teléfono debe ser una cadena de texto.")
    .isLength({ min: 7, max: 20 })
    .withMessage("El número de teléfono debe tener entre 7 y 20 caracteres."),

  body("tipoDocumento")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("El tipo de documento no puede estar vacío si se proporciona.")
    .isString()
    .withMessage("El tipo de documento debe ser texto.")
    .isIn([
      "Cédula de Ciudadanía",
      "Cédula de Extranjería",
      "Pasaporte",
      "Tarjeta de Identidad",
    ])
    .withMessage("Tipo de documento no válido."),

  body("numeroDocumento")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("El número de documento no puede estar vacío si se proporciona.")
    .isString()
    .withMessage("El número de documento debe ser texto.")
    .isLength({ min: 5, max: 45 })
    .withMessage(
      "El número de documento debe tener entre 5 y 45 caracteres."
    )
    .custom(async (value, { req }) => {
      if (!value) return true;

      const rol = await db.Rol.findByPk(req.body.idRol);
      if (!rol) return true;

      let profileModel;
      if (rol.tipo_perfil === "CLIENTE") {
        profileModel = db.Cliente;
      } else if (rol.tipo_perfil === "EMPLEADO") {
        profileModel = db.Empleado;
      } else {
        return true;
      }

      const perfilExistente = await profileModel.findOne({
        where: { numero_documento: value },
      });
      if (perfilExistente) {
        return Promise.reject(
          `El número de documento ya está registrado para un ${rol.tipo_perfil.toLowerCase()}.`
        );
      }
      return true;
    }),

  body("fechaNacimiento")
    .optional()
    .isISO8601()
    .withMessage(
      "La fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)."
    )
    .toDate(),

  handleValidationErrors,
];

const actualizarUsuarioValidators = [
  param("idUsuario")
    .isInt({ gt: 0 })
    .withMessage("El ID de usuario debe ser un entero positivo."),
  body("correo")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Debe proporcionar un correo electrónico válido si actualiza.")
    .normalizeEmail()
    .custom(async (value, { req }) => {
      const idUsuario = Number(req.params.idUsuario);
      const usuarioExistente = await db.Usuario.findOne({
        where: {
          correo: value,
          id_usuario: { [db.Sequelize.Op.ne]: idUsuario },
        },
      });
      if (usuarioExistente) {
        return Promise.reject(
          "La dirección de correo ya está registrada por otro usuario."
        );
      }
    }),
  body("contrasena")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("La contraseña debe ser una cadena de texto.")
    .isLength({ min: 8 })
    .withMessage(
      "La contraseña debe tener al menos 8 caracteres si se actualiza."
    ),
  body("idRol")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("El ID del rol debe ser un entero positivo si se actualiza.")
    .custom(async (value) => {
      if (value) {
        const rolExistente = await db.Rol.findOne({
          where: { id_rol: value, estado: true },
        });
        if (!rolExistente) {
          return Promise.reject(
            "El rol especificado para la actualización no existe o no está activo."
          );
        }
      }
    }),
  body("estado")
    .optional()
    .isBoolean()
    .withMessage("El estado debe ser un valor booleano (true o false)."),

  body("nombre").optional().trim().notEmpty().withMessage("El nombre no puede estar vacío si se actualiza.").isLength({ min: 2, max: 100 }),
  body("apellido").optional().trim().notEmpty().withMessage("El apellido no puede estar vacío si se actualiza.").isLength({ min: 2, max: 100 }),
  body("telefono").optional().trim().notEmpty().withMessage("El teléfono no puede estar vacío si se actualiza.").isLength({ min: 7, max: 20 }),
  body("tipoDocumento").optional().trim().notEmpty().withMessage("El tipo de documento no puede estar vacío si se actualiza.").isIn(['Cédula de Ciudadanía', 'Cédula de Extranjería', 'Pasaporte', 'Tarjeta de Identidad']),
  body("numeroDocumento").optional().trim().notEmpty().withMessage("El número de documento no puede estar vacío si se actualiza.").isLength({ min: 5, max: 45 })
    .custom(async (value, { req }) => {
        if (!value) return true;
        const idUsuario = Number(req.params.idUsuario);
        const usuario = await db.Usuario.findByPk(idUsuario, { include: [{ model: db.Rol, as: 'rol' }] });
        if (!usuario || !usuario.rol) return true;

        let profileModel;
        let profileFk = 'id_usuario';
        if (usuario.rol.tipo_perfil === "CLIENTE") {
            profileModel = db.Cliente;
        } else if (usuario.rol.tipo_perfil === "EMPLEADO") {
            profileModel = db.Empleado;
        } else {
            return true;
        }

        const perfilAsociado = await profileModel.findOne({ where: { [profileFk]: idUsuario } });
        if (perfilAsociado && perfilAsociado.numero_documento === value) return true;

        const otroPerfilConDocumento = await profileModel.findOne({ where: { numero_documento: value } });
        if (otroPerfilConDocumento) {
            return Promise.reject(`El número de documento ya está registrado para otro ${usuario.rol.tipo_perfil.toLowerCase()}.`);
        }
        return true;
    }),
  body("fechaNacimiento").optional().isISO8601().withMessage("La fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD).").toDate(),

  handleValidationErrors,
];

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
    .withMessage("El campo 'estado' es obligatorio en el cuerpo de la solicitud.")
    .isBoolean()
    .withMessage("El valor de 'estado' debe ser un booleano (true o false)."),
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