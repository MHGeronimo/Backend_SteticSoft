// src/middlewares/auth.middleware.js
const jwt = require("jsonwebtoken");
const db = require("../models");
const { JWT_SECRET } = require("../config/env.config");
const UnauthorizedError = require("../errors/UnauthorizedError");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError(
        "Acceso denegado. Se requiere token en formato Bearer."
      );
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new UnauthorizedError(
        "Acceso denegado. Token no encontrado después de Bearer."
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const usuario = await db.Usuario.findOne({
      where: {
        idUsuario: decoded.idUsuario,
        estado: true,
      },
      include: [
        {
          model: db.Rol,
          as: "rol",
          attributes: ["idRol", "nombre"],
          include: [
            {
              model: db.Permisos,
              as: "permisos",
              attributes: ["nombre"],
              through: { attributes: [] },
              where: { estado: true }, // Asegurarnos que solo traemos permisos activos
              required: false,
            },
          ],
        },
      ],
    });

    if (!usuario || !usuario.rol) {
      throw new UnauthorizedError(
        "Acceso denegado. Usuario no válido, inactivo o sin rol asignado."
      );
    }

    // Extraer los nombres de los permisos del objeto de rol
    const permisosUsuario =
      usuario.rol.permisos?.map((permiso) => permiso.nombre) || [];

    // Adjuntar la información enriquecida al objeto request
    req.usuario = {
      idUsuario: usuario.idUsuario,
      correo: usuario.correo,
      idRol: usuario.idRol,
      rolNombre: usuario.rol.nombre,
      permisos: permisosUsuario, // ¡Aquí está la lista de permisos!
    };

    next();
  } catch (error) {
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
    next(error);
  }
};

module.exports = authMiddleware;