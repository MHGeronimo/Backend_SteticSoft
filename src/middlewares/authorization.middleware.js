// src/middlewares/authorization.middleware.js
const db = require("../models"); // Ajusta la ruta si es necesario
const { ForbiddenError } = require("../errors/ForbiddenError");
const { UnauthorizedError } = require("../errors/UnauthorizedError");

/**
 * Middleware para verificar si el usuario autenticado tiene un permiso específico.
 * Requiere que authMiddleware se haya ejecutado antes y haya establecido req.usuario.
 * @param {string} permisoRequeridoNombre - El nombre del permiso a verificar (como está en la tabla Permisos).
 */
const checkPermission = (permisoRequeridoNombre) => {
  return async (req, res, next) => {
    if (!req.usuario || !req.usuario.idUsuario) {
      return next(
        new UnauthorizedError(
          "Autenticación requerida para verificar permisos."
        )
      );
    }

    try {
      // Asumimos que authMiddleware ya pudo haber cargado el rol con sus permisos.
      // Si no, o para asegurar la información más fresca, consultamos aquí.
      const usuarioConPermisos = await db.Usuario.findByPk(
        req.usuario.idUsuario,
        {
          attributes: ["idUsuario"], // No necesitamos todos los datos del usuario aquí
          include: [
            {
              model: db.Rol,
              as: "rol", // Alias de la asociación Usuario -> Rol
              attributes: ["idRol", "nombre"],
              required: true, // Asegura que el usuario tenga un rol
              include: [
                {
                  model: db.Permisos,
                  as: "permisos", // Alias de la asociación Rol -> Permisos (vía PermisosXRol)
                  attributes: ["nombre"],
                  through: { attributes: [] }, // No necesitamos datos de la tabla de unión
                },
              ],
            },
          ],
        }
      );

      if (
        !usuarioConPermisos ||
        !usuarioConPermisos.rol ||
        !usuarioConPermisos.rol.permisos
      ) {
        return next(
          new ForbiddenError(
            "Acceso denegado. No se pudieron determinar los permisos del rol del usuario."
          )
        );
      }

      const tienePermiso = usuarioConPermisos.rol.permisos.some(
        (permiso) => permiso.nombre === permisoRequeridoNombre
      );

      if (tienePermiso) {
        next(); // El usuario tiene el permiso
      } else {
        return next(
          new ForbiddenError(
            `Acceso denegado. El permiso '${permisoRequeridoNombre}' es requerido para esta acción.`
          )
        );
      }
    } catch (error) {
      console.error("Error en el middleware checkPermission:", error.message);
      next(new Error("Error interno al verificar los permisos del usuario.")); // Error genérico para el errorHandler
    }
  };
};

/**
 * Middleware para verificar si el usuario autenticado tiene uno de los roles especificados.
 * Requiere que authMiddleware haya establecido req.usuario y req.usuario.rolNombre.
 * @param {Array<string>} rolesPermitidos - Array con los NOMBRES de los roles permitidos (ej. ['Administrador', 'Empleado']).
 */
const checkRole = (rolesPermitidos = []) => {
  return async (req, res, next) => {
    if (!req.usuario || !req.usuario.idUsuario) {
      return next(
        new UnauthorizedError("Autenticación requerida para verificar el rol.")
      );
    }

    // Asumimos que authMiddleware ya populó req.usuario.rolNombre
    const rolDelUsuario = req.usuario.rolNombre;

    if (!rolDelUsuario) {
      console.warn(
        `Usuario ID ${req.usuario.idUsuario} no tiene información de rolNombre en req.usuario.`
      );
      return next(
        new ForbiddenError(
          "Acceso denegado. No se pudo determinar el rol del usuario."
        )
      );
    }

    if (
      rolesPermitidos
        .map((r) => r.toLowerCase())
        .includes(rolDelUsuario.toLowerCase())
    ) {
      next(); // El rol del usuario está en la lista de roles permitidos
    } else {
      return next(
        new ForbiddenError(
          `Acceso denegado. Tu rol ('${rolDelUsuario}') no está autorizado para este recurso.`
        )
      );
    }
  };
};

module.exports = {
  checkPermission,
  checkRole,
};
