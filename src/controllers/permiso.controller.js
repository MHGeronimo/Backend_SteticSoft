// src/controllers/permiso.controller.js
const permisoService = require("../services/permiso.service.js");

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
    next(error);
  }
};

/**
 * Obtiene una lista de todos los permisos.
 */
const listarPermisos = async (req, res, next) => {
  try {
    const opcionesDeFiltro = {};
    if (req.query.estado === "true") {
      opcionesDeFiltro.estado = true;
    } else if (req.query.estado === "false") {
      opcionesDeFiltro.estado = false;
    }
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
 * Cambia el estado (activo/inactivo) de un permiso.
 */
const cambiarEstadoPermiso = async (req, res, next) => {
  try {
    const { idPermiso } = req.params;
    const { estado } = req.body; // Se espera un booleano

    const permisoActualizado = await permisoService.cambiarEstadoPermiso(
      Number(idPermiso),
      estado
    );
    res.status(200).json({
      success: true,
      message: `Estado del permiso ID ${idPermiso} cambiado a ${estado} exitosamente.`,
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
    res.status(204).send();
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
  cambiarEstadoPermiso, // <-- Nueva función exportada
};
