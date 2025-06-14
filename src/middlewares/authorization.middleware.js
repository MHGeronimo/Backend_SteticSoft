// src/middlewares/authorization.middleware.js
const db = require("../models"); // Ajusta la ruta si es necesario

// ======================= CORRECCIÓN CLAVE =======================
// Se importan ambos errores desde el archivo 'index.js' central,
// que es la forma correcta de hacerlo en tu proyecto.
const { UnauthorizedError, ForbiddenError } = require("../errors/index.js");
// ================================================================

/**
 * Middleware para verificar si el usuario autenticado tiene un permiso específico.
 * Requiere que authMiddleware se haya ejecutado antes.
 * @param {string} permisoRequeridoNombre - El nombre del permiso a verificar.
 */
const checkPermission = (permisoRequeridoNombre) => {
  return async (req, res, next) => {
    // Asegurarse que authMiddleware haya establecido req.usuario
    if (!req.usuario || !req.usuario.idUsuario) {
      return next(
        new UnauthorizedError(
          "Autenticación requerida para verificar permisos."
        )
      );
    }

    try {
      // Usamos los permisos que ya vienen en req.usuario.permisos,
      // que fueron cargados por el auth.middleware.js. ¡Esto es mucho más eficiente!
      const tienePermiso = req.usuario.permisos.includes(
        permisoRequeridoNombre
      );

      if (tienePermiso) {
        return next(); // El usuario tiene el permiso, continuar.
      } else {
        return next(
          new ForbiddenError(
            `Acceso denegado. El permiso '${permisoRequeridoNombre}' es requerido para esta acción.`
          )
        );
      }
    } catch (error) {
      // Manejo de errores inesperados.
      console.error(
        "Error inesperado en el middleware checkPermission:",
        error.message,
        error.stack
      );
      return next(
        new Error(
          "Error interno del servidor al verificar los permisos del usuario."
        )
      );
    }
  };
};

/**
 * Middleware para verificar si el usuario autenticado tiene uno de los roles especificados.
 * Requiere que authMiddleware haya establecido req.usuario.rolNombre.
 * @param {Array<string>} rolesPermitidos - Array con los NOMBRES de los roles permitidos.
 */
const checkRole = (rolesPermitidos = []) => {
  return async (req, res, next) => {
    if (!req.usuario || !req.usuario.idUsuario) {
      return next(
        new UnauthorizedError("Autenticación requerida para verificar el rol.")
      );
    }

    const rolDelUsuario = req.usuario.rolNombre;

    if (!rolDelUsuario) {
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
      next(); // El rol del usuario está permitido.
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