// src/controllers/rol.controller.js
const rolService = require("../services/rol.service.js");
const permisosXRolService = require("../services/permisosXRol.service.js");

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
    const { id } = req.params;
    const datosActualizar = req.body;

    // --- INICIO DE MODIFICACIÓN ---

    // 1. Llamamos al servicio que ya devuelve un JSON limpio.
    const rolActualizado = await rolService.actualizarRol(id, datosActualizar);

    // 2. [Depuración] Imprimimos en la consola del servidor.
    console.log('Objeto a enviar como respuesta (Actualizar):', JSON.stringify(rolActualizado, null, 2));

    // 3. Verificamos si se encontró el rol antes de enviar.
    if (!rolActualizado) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    // 4. Enviamos la respuesta.
    res.status(200).json(rolActualizado);

    // --- FIN DE MODIFICACIÓN ---

  } catch (error) {
    // Mejoramos el log de errores para ver la causa real.
    console.error('Error detallado en rol.controller al actualizar:', error);
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

    if (!Array.isArray(idPermisos) || idPermisos.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Se requiere un array 'idPermisos' con al menos un ID de permiso.",
      });
    }

    const permisosActualizados = await permisosXRolService.asignarPermisosARol(
      Number(idRol),
      idPermisos
    );
    res.status(200).json({
      success: true,
      message: `Permisos asignados/actualizados para el rol ID ${idRol}.`,
      data: permisosActualizados,
    });
  } catch (error) {
    next(error);
  }
};

const quitarPermisosDeRol = async (req, res, next) => {
  try {
    const { idRol } = req.params;
    const { idPermisos } = req.body;

    if (!Array.isArray(idPermisos) || idPermisos.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Se requiere un array 'idPermisos' con al menos un ID de permiso.",
      });
    }

    const permisosRestantes = await permisosXRolService.quitarPermisosDeRol(
      Number(idRol),
      idPermisos
    );
    res.status(200).json({
      success: true,
      message: `Permisos quitados del rol ID ${idRol}.`,
      data: permisosRestantes,
    });
  } catch (error) {
    next(error);
  }
};

const listarPermisosDeRol = async (req, res, next) => {
  try {
    const { idRol } = req.params;
    const permisos = await permisosXRolService.obtenerPermisosDeRol(
      Number(idRol)
    );
    res.status(200).json({
      success: true,
      data: permisos,
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
  listarPermisosDeRol,
  cambiarEstadoRol,
};
