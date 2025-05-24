// src/middlewares/auth.middleware.js
const jwt = require("jsonwebtoken");
const db = require("../models"); // Ajusta la ruta si tu carpeta models está en otro lugar
const { JWT_SECRET } = require("../config/env.config"); // Importa JWT_SECRET desde tu config centralizada
const { UnauthorizedError } = require("../errors/UnauthorizedError"); // Importa tu error personalizado

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // Si no hay cabecera o no empieza con 'Bearer ', lanzar error.
      throw new UnauthorizedError(
        "Acceso denegado. Se requiere token en formato Bearer."
      );
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      // Si hay 'Bearer ' pero no hay token después del espacio.
      throw new UnauthorizedError(
        "Acceso denegado. Token no encontrado después de Bearer."
      );
    }

    // Verificar el token con el secreto
    const decoded = jwt.verify(token, JWT_SECRET);

    // Buscar al usuario en la base de datos para asegurar que existe y está activo
    const usuario = await db.Usuario.findOne({
      where: {
        idUsuario: decoded.idUsuario, // Asume que el payload del token tiene idUsuario
        estado: true, // Solo usuarios activos
      },
      include: [
        {
          // Incluir el rol del usuario para posible uso en autorización
          model: db.Rol,
          as: "rol", // Asegúrate que 'rol' es el alias definido en tu asociación Usuario -> Rol
          attributes: ["idRol", "nombre"], // Solo los atributos necesarios del rol
        },
      ],
    });

    if (!usuario) {
      throw new UnauthorizedError(
        "Acceso denegado. Usuario no válido, no encontrado o inactivo."
      );
    }

    // Adjuntar información del usuario (y su rol) al objeto request para uso posterior
    req.usuario = {
      idUsuario: usuario.idUsuario,
      correo: usuario.correo, // Tomado del objeto usuario de la BD para asegurar frescura
      idRol: usuario.idRol, // Tomado del objeto usuario de la BD
      rolNombre: usuario.rol ? usuario.rol.nombre : null, // Nombre del rol
      // Puedes añadir más datos del 'decoded' (payload del token) si son necesarios y confías en ellos
      // Ejemplo: idCliente: decoded.idCliente (si idCliente está en el payload del JWT)
    };

    next(); // Continuar al siguiente middleware o controlador
  } catch (error) {
    // Si el error es de jwt.verify (TokenExpiredError, JsonWebTokenError) o nuestro UnauthorizedError,
    // lo transformamos o pasamos para que el errorHandler global lo maneje.
    if (error.name === "TokenExpiredError") {
      return next(
        new UnauthorizedError(
          "Token ha expirado. Por favor, inicia sesión de nuevo."
        )
      );
    }
    if (error.name === "JsonWebTokenError") {
      return next(new UnauthorizedError("Token inválido o malformado."));
    }
    // Para otros errores (incluyendo nuestros UnauthorizedError lanzados explícitamente)
    next(error);
  }
};

module.exports = authMiddleware;
