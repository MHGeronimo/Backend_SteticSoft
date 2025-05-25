// src/controllers/permiso.controller.js
const permisoService = require("../services/permiso.service.js"); // Ajusta la ruta si es necesario

/**
 * Crea un nuevo permiso.
 */
const crearPermiso = async (req, res, next) => {
  try {
    const nuevoPermiso = await permisoService.crearPermiso(req.body);
    res.status(201).json({
      success: true,
      message: "Permiso creado exitosamente.",
      data: nuevoPermiso,
    });
  } catch (error) {
    next(error); // Pasa el error al manejador global
  }
};

/**
 * Obtiene una lista de todos los permisos.
 * Se puede extender para aceptar query params de filtrado (ej. ?estado=true)
 */
const listarPermisos = async (req, res, next) => {
  try {
    const opcionesDeFiltro = {};
    if (req.query.estado === "true") {
      opcionesDeFiltro.estado = true;
    } else if (req.query.estado === "false") {
      opcionesDeFiltro.estado = false;
    }
    // Si no se pasa el query param 'estado', se listan todos

    const permisos = await permisoService.obtenerTodosLosPermisos(
      opcionesDeFiltro
    );
    res.status(200).json({
      success: true,
      data: permisos,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene un permiso específico por su ID.
 */
const obtenerPermisoPorId = async (req, res, next) => {
  try {
    const { idPermiso } = req.params;
    const permiso = await permisoService.obtenerPermisoPorId(Number(idPermiso));
    // El servicio ahora lanza NotFoundError si no se encuentra
    res.status(200).json({
      success: true,
      data: permiso,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza (Edita) un permiso existente por su ID.
 */
const actualizarPermiso = async (req, res, next) => {
  try {
    const { idPermiso } = req.params;
    const permisoActualizado = await permisoService.actualizarPermiso(
      Number(idPermiso),
      req.body
    );
    // El servicio ahora lanza NotFoundError o ConflictError
    res.status(200).json({
      success: true,
      message: "Permiso actualizado exitosamente.",
      data: permisoActualizado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Anula un permiso (borrado lógico, estado = false).
 */
const anularPermiso = async (req, res, next) => {
  try {
    const { idPermiso } = req.params;
    const permisoAnulado = await permisoService.anularPermiso(
      Number(idPermiso)
    );
    // El servicio lanza NotFoundError si no se encuentra
    res.status(200).json({
      success: true,
      message: "Permiso anulado (deshabilitado) exitosamente.",
      data: permisoAnulado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Habilita un permiso (estado = true).
 */
const habilitarPermiso = async (req, res, next) => {
  try {
    const { idPermiso } = req.params;
    const permisoHabilitado = await permisoService.habilitarPermiso(
      Number(idPermiso)
    );
    // El servicio lanza NotFoundError si no se encuentra
    res.status(200).json({
      success: true,
      message: "Permiso habilitado exitosamente.",
      data: permisoHabilitado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina físicamente un permiso por su ID.
 */
const eliminarPermisoFisico = async (req, res, next) => {
  try {
    const { idPermiso } = req.params;
    await permisoService.eliminarPermisoFisico(Number(idPermiso));
    // El servicio lanza NotFoundError o ConflictError (si estuviera referenciado y no hay ON DELETE CASCADE)
    res.status(204).send(); // 204 No Content para eliminaciones exitosas sin cuerpo de respuesta
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearPermiso,
  listarPermisos,
  obtenerPermisoPorId,
  actualizarPermiso,
  anularPermiso,
  habilitarPermiso,
  eliminarPermisoFisico,
};
