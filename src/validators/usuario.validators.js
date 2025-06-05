// src/shared/src_api/validators/usuario.validators.js
const { body, param } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validation.middleware.js");
const db = require("../models"); // Asegúrate que db esté disponible

const crearUsuarioValidators = [
  // Validaciones para la entidad Usuario (existentes y correctas)
  body("correo")
    .trim().notEmpty().withMessage("El correo electrónico es obligatorio.")
    .isEmail().withMessage("Debe proporcionar un correo electrónico válido.")
    .normalizeEmail()
    .custom(async (value) => {
      const usuarioExistente = await db.Usuario.findOne({ where: { correo: value } });
      if (usuarioExistente) {
        return Promise.reject("El correo electrónico ya está registrado para una cuenta de usuario.");
      }
    }),
  body("contrasena")
    .notEmpty().withMessage("La contraseña es obligatoria.")
    .isString().withMessage("La contraseña debe ser una cadena de texto.")
    .isLength({ min: 8 }).withMessage("La contraseña debe tener al menos 8 caracteres."),
  body("idRol")
    .notEmpty().withMessage("El ID del rol es obligatorio.")
    .isInt({ gt: 0 }).withMessage("El ID del rol debe ser un entero positivo.")
    .custom(async (value) => {
      const rolExistente = await db.Rol.findOne({ where: { idRol: value, estado: true } });
      if (!rolExistente) {
        return Promise.reject("El rol especificado no existe o no está activo.");
      }
    }),
  body("estado").optional().isBoolean().withMessage("El estado debe ser un valor booleano (true o false)."),

  // Validaciones para campos de Perfil (Cliente/Empleado)
  // Estos se marcan como opcionales aquí, y el servicio (crearUsuario)
  // verificará la obligatoriedad basada en el rol.
  // O, puedes hacerlos condicionalmente requeridos aquí usando .custom() si prefieres.

  body("nombre")
    .optional() // El servicio verificará si es requerido según el rol
    .trim()
    .notEmpty().withMessage("El nombre no puede estar vacío si se proporciona.")
    .isString().withMessage("El nombre debe ser una cadena de texto.")
    .isLength({ min: 2, max: 100 }).withMessage("El nombre debe tener entre 2 y 100 caracteres."),
  
  body("apellido")
    .optional() // El servicio verificará si es requerido según el rol
    .trim()
    .notEmpty().withMessage("El apellido не puede estar vacío si se proporciona.")
    .isString().withMessage("El apellido debe ser una cadena de texto.")
    .isLength({ min: 2, max: 100 }).withMessage("El apellido debe tener entre 2 y 100 caracteres."),

  body("telefono")
    .optional() // El servicio verificará si es requerido según el rol
    .trim()
    .notEmpty().withMessage("El teléfono no puede estar vacío si se proporciona.")
    .isString().withMessage("El teléfono debe ser una cadena de texto.") // Podrías añadir isNumeric o un regex específico si quieres.
    .isLength({ min: 7, max: 45 }).withMessage("El teléfono debe tener entre 7 y 45 caracteres."),

  body("tipoDocumento")
    .optional() // El servicio verificará si es requerido según el rol
    .trim()
    .notEmpty().withMessage("El tipo de documento no puede estar vacío si se proporciona.")
    .isString().withMessage("El tipo de documento debe ser texto.")
    .isIn(['Cédula de Ciudadanía', 'Cédula de Extranjería', 'Pasaporte', 'Tarjeta de Identidad']) // Ejemplo de valores permitidos
    .withMessage("Tipo de documento no válido."),

  body("numeroDocumento")
    .optional() // El servicio verificará si es requerido según el rol
    .trim()
    .notEmpty().withMessage("El número de documento no puede estar vacío si se proporciona.")
    .isString().withMessage("El número de documento debe ser texto.")
    .isLength({ min: 5, max: 45 }).withMessage("El número de documento debe tener entre 5 y 45 caracteres.")
    .custom(async (value, { req }) => {
        if (!value) return true; // Si es opcional y no se provee, no validar custom

        const idRol = req.body.idRol;
        if (!idRol) return true; // Si no hay rol, no podemos determinar el tipo de perfil
        
        const rol = await db.Rol.findByPk(idRol);
        if (!rol) return true; // Si el rol no existe, otra validación lo capturará

        if (rol.nombre === 'Cliente') {
            const clienteExistente = await db.Cliente.findOne({ where: { numeroDocumento: value } });
            if (clienteExistente) {
                return Promise.reject("El número de documento ya está registrado para un cliente.");
            }
        } else if (rol.nombre === 'Empleado') {
            // Asumiendo que ya tienes la relación Empleado-Usuario y la tabla Empleado con numeroDocumento
            const empleadoExistente = await db.Empleado.findOne({ where: { numeroDocumento: value } });
            if (empleadoExistente) {
                return Promise.reject("El número de documento ya está registrado para un empleado.");
            }
        }
        return true;
    }),

  body("fechaNacimiento")
    .optional() // El servicio verificará si es requerido según el rol
    .isISO8601().withMessage("La fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD).")
    .toDate(), // Convierte a objeto Date

  // Validador para 'celular' (si es específico para Empleados)
  body("celular")
    .optional()
    .trim()
    .if((value, { req }) => { // Solo validar si el rol es Empleado
        const idRol = req.body.idRol;
        if (!idRol) return false;
        // Esta lógica es un poco simplista, idealmente se haría con una función custom o
        // el servicio manejaría la obligatoriedad
        // const rol = await db.Rol.findByPk(idRol); // No se puede hacer await directo aquí
        // Para una validación condicional más robusta, podrías necesitar una función custom para 'celular'
        // que internamente verifique el rol.
        // O dejar que el servicio lo valide.
        // Por ahora, si se envía, se valida su formato.
        return true; 
    })
    .notEmpty().withMessage("El celular no puede estar vacío si se proporciona para un empleado.")
    .isString().withMessage("El celular debe ser una cadena de texto.")
    .isLength({ min: 7, max: 45 }).withMessage("El celular debe tener entre 7 y 45 caracteres."),
  
  handleValidationErrors,
];

const actualizarUsuarioValidators = [
  param("idUsuario")
    .isInt({ gt: 0 })
    .withMessage("El ID del usuario debe ser un entero positivo."),
  body("correo")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Debe proporcionar un correo electrónico válido si se actualiza.")
    .normalizeEmail()
    .custom(async (value, { req }) => {
      const idUsuario = Number(req.params.idUsuario);
      const usuarioExistente = await db.Usuario.findOne({
        where: {
          correo: value,
          idUsuario: { [db.Sequelize.Op.ne]: idUsuario }, // Usar Op de db.Sequelize
        },
      });
      if (usuarioExistente) {
        return Promise.reject("El correo electrónico ya está registrado por otro usuario.");
      }
    }),
  body("contrasena") // La contraseña es opcional en actualización
    .optional({ checkFalsy: true }) // Permite string vacío para ser ignorado, o no enviar el campo
    .isString().withMessage("La contraseña debe ser una cadena de texto.")
    .isLength({ min: 8 }).withMessage("La contraseña debe tener al menos 8 caracteres si se actualiza."),
  body("idRol")
    .optional()
    .isInt({ gt: 0 }).withMessage("El ID del rol debe ser un entero positivo si se actualiza.")
    .custom(async (value) => {
      if (value) { // Solo validar si se proporciona un idRol
        const rolExistente = await db.Rol.findOne({
          where: { idRol: value, estado: true },
        });
        if (!rolExistente) {
          return Promise.reject("El rol especificado para actualizar no existe o no está activo.");
        }
      }
    }),
  body("estado").optional().isBoolean().withMessage("El estado debe ser un valor booleano (true o false)."),

  // Validadores opcionales para campos de perfil en actualización
  body("nombre").optional().trim().notEmpty().withMessage("El nombre no puede ser vacío si se actualiza.").isLength({ min: 2, max: 100 }),
  body("apellido").optional().trim().notEmpty().withMessage("El apellido no puede ser vacío si se actualiza.").isLength({ min: 2, max: 100 }),
  body("telefono").optional().trim().notEmpty().withMessage("El teléfono no puede ser vacío si se actualiza.").isLength({ min: 7, max: 45 }),
  body("tipoDocumento").optional().trim().notEmpty().withMessage("El tipo de documento no puede ser vacío si se actualiza.").isIn(['Cédula de Ciudadanía', 'Cédula de Extranjería', 'Pasaporte', 'Tarjeta de Identidad']),
  body("numeroDocumento").optional().trim().notEmpty().withMessage("El número de documento no puede ser vacío si se actualiza.").isLength({ min: 5, max: 45 })
    .custom(async (value, { req }) => {
        if (!value) return true;
        const idUsuario = Number(req.params.idUsuario); // Obtener el idUsuario que se está actualizando
        const usuarioActual = await db.Usuario.findByPk(idUsuario, { include: ['rol'] });
        if (!usuarioActual) return true; // Otra validación lo capturará

        const rolNombre = usuarioActual.rol?.nombre;

        if (rolNombre === 'Cliente') {
            const clienteAsociado = await db.Cliente.findOne({ where: { idUsuario } });
            if (clienteAsociado && clienteAsociado.numeroDocumento === value) return true; // Es el mismo documento del cliente actual, no hay conflicto
            const otroClienteConDocumento = await db.Cliente.findOne({ where: { numeroDocumento: value } });
            if (otroClienteConDocumento) {
                return Promise.reject("El número de documento ya está registrado para otro cliente.");
            }
        } else if (rolNombre === 'Empleado') {
            const empleadoAsociado = await db.Empleado.findOne({ where: { idUsuario } });
            if (empleadoAsociado && empleadoAsociado.numeroDocumento === value) return true;
            const otroEmpleadoConDocumento = await db.Empleado.findOne({ where: { numeroDocumento: value } });
            if (otroEmpleadoConDocumento) {
                return Promise.reject("El número de documento ya está registrado para otro empleado.");
            }
        }
        return true;
    }),
  body("fechaNacimiento").optional().isISO8601().withMessage("La fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD).").toDate(),
  // body("celular").optional().trim().isLength({ min: 7, max: 45 }),
  // body("direccion").optional().trim(),

  handleValidationErrors,
];

const idUsuarioValidator = [ // Sin cambios
  param("idUsuario")
    .isInt({ gt: 0 })
    .withMessage("El ID del usuario debe ser un entero positivo."),
  handleValidationErrors,
];

const cambiarEstadoUsuarioValidators = [ // Sin cambios
  param("idUsuario")
    .isInt({ gt: 0 })
    .withMessage("El ID del usuario debe ser un entero positivo."),
  body("estado")
    .exists({ checkFalsy: false }) // Asegura que 'estado' exista, incluso si es false
    .withMessage("El campo 'estado' es obligatorio en el cuerpo de la solicitud.")
    .isBoolean()
    .withMessage("El valor de 'estado' debe ser un booleano (true o false)."),
  handleValidationErrors,
];

module.exports = {
  crearUsuarioValidators,
  actualizarUsuarioValidators,
  idUsuarioValidator,
  cambiarEstadoUsuarioValidators,
};