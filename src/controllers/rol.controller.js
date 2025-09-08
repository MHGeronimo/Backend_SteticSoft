// src/controllers/rol.controller.js
const rolService = require("../services/rol.service.js");

/**
 * Crea un nuevo rol.
 */
const crearRol = async (req, res, next) => {
  try {
    const datosRol = req.body;

    // --- INICIO DE MODIFICACIÓN ---

    // 1. Llamamos al servicio que ya devuelve un JSON limpio.
    const rolCreado = await rolService.crearRol(datosRol);

    // 2. [Depuración] Imprimimos en la consola del servidor lo que vamos a enviar.
    // Esto te permitirá ver en los logs de Render exactamente el objeto final.
    console.log(
      "Objeto a enviar como respuesta (Crear):",
      JSON.stringify(rolCreado, null, 2)
    );

    // 3. Enviamos la respuesta.
    res.status(201).json(rolCreado);

    // --- FIN DE MODIFICACIÓN ---
  } catch (error) {
    // Mejoramos el log de errores para ver la causa real.
    console.error("Error detallado en rol.controller al crear:", error);
    next(error);
  }
};

/**
 * Obtiene una lista de todos los roles.
 */
const listarRoles = async (req, res, next) => {
  try {
    const opcionesDeFiltro = {};
    if (req.query.estado === "true") {
      opcionesDeFiltro.estado = true;
    } else if (req.query.estado === "false") {
      opcionesDeFiltro.estado = false;
    }
    const roles = await rolService.obtenerTodosLosRoles(opcionesDeFiltro);
    res.status(200).json({
      success: true,
      data: roles,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene un rol específico por su ID.
 */
const obtenerRolPorId = async (req, res, next) => {
  try {
    const { idRol } = req.params;
    const rol = await rolService.obtenerRolPorId(Number(idRol));
    res.status(200).json({
      success: true,
      data: rol,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza (Edita) un rol existente por su ID.
 */
const actualizarRol = async (req, res, next) => {
  try {
    const { idRol } = req.params;
    const datosActualizar = req.body;
    const idUsuario = req.usuario.idUsuario; // Capturamos el ID del usuario

    const rolActualizado = await rolService.actualizarRol(
      Number(idRol),
      datosActualizar,
      idUsuario // Pasamos el ID del usuario al servicio
    );

    console.log(
      "Objeto a enviar como respuesta (Actualizar):",
      JSON.stringify(rolActualizado, null, 2)
    );

    if (!rolActualizado) {
      return res
        .status(404)
        .json({ message: "Rol no encontrado para actualizar." });
    }

    res.status(200).json(rolActualizado);
  } catch (error) {
    console.error("Error detallado en rol.controller al actualizar:", error);
    next(error);
  }
};


/**
 * Cambia el estado (activo/inactivo) de un rol.
 */
const cambiarEstadoRol = async (req, res, next) => {
  try {
    const { idRol } = req.params;
    const { estado } = req.body; // Se espera un booleano

    const rolActualizado = await rolService.cambiarEstadoRol(
      Number(idRol),
      estado
    );
    res.status(200).json({
      success: true,
      message: `Estado del rol ID ${idRol} cambiado a ${estado} exitosamente.`,
      data: rolActualizado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Anula un rol (borrado lógico, estado = false).
 */
const anularRol = async (req, res, next) => {
  try {
    const { idRol } = req.params;
    const rolAnulado = await rolService.anularRol(Number(idRol));
    res.status(200).json({
      success: true,
      message: "Rol anulado (deshabilitado) exitosamente.",
      data: rolAnulado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Habilita un rol (estado = true).
 */
const habilitarRol = async (req, res, next) => {
  try {
    const { idRol } = req.params;
    const rolHabilitado = await rolService.habilitarRol(Number(idRol));
    res.status(200).json({
      success: true,
      message: "Rol habilitado exitosamente.",
      data: rolHabilitado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina físicamente un rol por su ID.
 */
const eliminarRolFisico = async (req, res, next) => {
  try {
    const { idRol } = req.params;
    await rolService.eliminarRolFisico(Number(idRol));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const asignarPermisosARol = async (req, res, next) => {
  try {
    const { idRol } = req.params;
    const { idPermisos } = req.body;
    const idUsuario = req.usuario.idUsuario;

    if (!Array.isArray(idPermisos)) {
      return res.status(400).json({
        message: "Se requiere un array 'idPermisos'.",
      });
    }

    // Se centraliza la lógica en rolService.actualizarRol para garantizar la auditoría
    const rolActualizado = await rolService.actualizarRol(
      Number(idRol),
      { idPermisos }, // Solo pasamos los permisos para actualizar
      idUsuario
    );

    res.status(200).json({
      message: `Permisos asignados/actualizados para el rol ID ${idRol}.`,
      data: rolActualizado,
    });
  } catch (error) {
    next(error);
  }
};

const quitarPermisosDeRol = async (req, res, next) => {
  try {
    const { idRol } = req.params;
    const { idPermisos: permisosAQuitar } = req.body;
    const idUsuario = req.usuario.idUsuario;

    if (!Array.isArray(permisosAQuitar) || permisosAQuitar.length === 0) {
      return res.status(400).json({
        message: "Se requiere un array 'idPermisos' con al menos un ID de permiso a quitar.",
      });
    }

    // 1. Obtener el estado actual del rol
    const rolActual = await rolService.obtenerRolPorId(Number(idRol));
    const idPermisosActuales = rolActual.permisos.map(p => p.idPermiso);

    // 2. Calcular la nueva lista de permisos
    const idPermisosNuevos = idPermisosActuales.filter(
      id => !permisosAQuitar.includes(id)
    );

    // 3. Llamar al servicio centralizado para actualizar
    const rolActualizado = await rolService.actualizarRol(
      Number(idRol),
      { idPermisos: idPermisosNuevos },
      idUsuario
    );

    res.status(200).json({
      message: `Permisos quitados del rol ID ${idRol}.`,
      data: rolActualizado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene el historial de cambios de un rol.
 */
const obtenerHistorialDeRol = async (req, res, next) => {
  try {
    const { idRol } = req.params;
    const historial = await rolService.obtenerHistorialPorRolId(Number(idRol));
    res.status(200).json({
      success: true,
      data: historial,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearRol,
  listarRoles,
  obtenerRolPorId,
  actualizarRol,
  anularRol,
  habilitarRol,
  eliminarRolFisico,
  asignarPermisosARol,
  quitarPermisosDeRol,
  cambiarEstadoRol,
  obtenerHistorialDeRol,
};
