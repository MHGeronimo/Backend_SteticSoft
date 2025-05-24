// src/middlewares/authorization.middleware.js
const db = require("../models"); // Ajusta la ruta si es necesario
const { ForbiddenError } = require("../errors/ForbiddenError");
const { UnauthorizedError } = require("../errors/UnauthorizedError");

/**
 * Middleware para verificar si el usuario autenticado tiene un permiso específico
 * (que podría ser un permiso de acceso a módulo completo, ej: 'ACCESO_MODULO_ROLES').
 * Requiere que authMiddleware se haya ejecutado antes y haya establecido req.usuario.
 * @param {string} permisoRequeridoNombre - El nombre del permiso a verificar (como está en la tabla Permisos).
 */
const checkPermission = (permisoRequeridoNombre) => {
  return async (req, res, next) => {
    // Asegurarse que authMiddleware haya establecido req.usuario y req.usuario.idUsuario
    if (!req.usuario || !req.usuario.idUsuario) {
      return next(
        new UnauthorizedError(
          "Autenticación requerida para verificar permisos."
        )
      );
    }

    try {
      // Consultar al usuario con su rol y los permisos asociados a ese rol.
      // Esta consulta es eficiente y asegura que se obtenga la información más actualizada.
      const usuarioConPermisos = await db.Usuario.findByPk(
        req.usuario.idUsuario,
        {
          attributes: ["idUsuario"], // Solo necesitamos confirmar la existencia y obtener relaciones.
          include: [
            {
              model: db.Rol,
              as: "rol", // Asegúrate que este sea el alias de tu asociación Usuario -> Rol
              attributes: ["idRol", "nombre"], // Atributos del rol que podrían ser útiles
              required: true, // Importante: asegura que el usuario DEBE tener un rol asociado.
              include: [
                {
                  model: db.Permisos,
                  as: "permisos", // Alias de tu asociación Rol <-> Permisos (vía PermisosXRol)
                  attributes: ["nombre"], // Solo necesitamos el nombre del permiso para la comparación.
                  through: { attributes: [] }, // No traer atributos de la tabla de unión (PermisosXRol).
                },
              ],
            },
          ],
        }
      );

      // Verificar si se encontró el usuario, su rol y los permisos del rol.
      if (
        !usuarioConPermisos ||
        !usuarioConPermisos.rol || // El usuario debe tener un rol
        !usuarioConPermisos.rol.permisos // El rol debe tener una lista de permisos (podría estar vacía)
      ) {
        // Este caso podría indicar un problema de datos o que el usuario no tiene rol.
        return next(
          new ForbiddenError(
            "Acceso denegado. No se pudieron determinar los permisos del rol del usuario."
          )
        );
      }

      // Verificar si alguno de los permisos del rol coincide con el permiso requerido.
      const tienePermiso = usuarioConPermisos.rol.permisos.some(
        (permiso) => permiso.nombre === permisoRequeridoNombre
      );

      if (tienePermiso) {
        next(); // El usuario tiene el permiso, continuar al siguiente middleware o controlador.
      } else {
        return next(
          new ForbiddenError(
            `Acceso denegado. El permiso '${permisoRequeridoNombre}' es requerido para esta acción.`
          )
        );
      }
    } catch (error) {
      // Manejo de errores inesperados durante la consulta a la BD.
      console.error(
        "Error en el middleware checkPermission:",
        error.message,
        error.stack
      );
      next(
        new Error(
          "Error interno del servidor al verificar los permisos del usuario."
        )
      );
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
    // Asegurarse que authMiddleware haya establecido req.usuario y req.usuario.idUsuario
    if (!req.usuario || !req.usuario.idUsuario) {
      return next(
        new UnauthorizedError("Autenticación requerida para verificar el rol.")
      );
    }

    // Asumimos que authMiddleware ya populó req.usuario.rolNombre
    // (el nombre del rol del usuario, ej. "Administrador")
    const rolDelUsuario = req.usuario.rolNombre;

    if (!rolDelUsuario) {
      console.warn(
        // Usar console.warn para advertencias que no necesariamente detienen todo
        `Usuario ID ${req.usuario.idUsuario} no tiene información de rolNombre en req.usuario.`
      );
      return next(
        new ForbiddenError(
          "Acceso denegado. No se pudo determinar el rol del usuario."
        )
      );
    }

    // Convertir ambos a minúsculas para una comparación insensible a mayúsculas/minúsculas
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
