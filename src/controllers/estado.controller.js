// src/controllers/estado.controller.js
const estadoService = require("../services/estado.service.js"); // Ajusta la ruta si es necesario

/**
 * Crea un nuevo estado.
 */
const crearEstado = async (req, res, next) => {
  try {
    const nuevoEstado = await estadoService.crearEstado(req.body);
    res.status(201).json({
      success: true,
      message: "Estado creado exitosamente.",
      data: nuevoEstado,
    });
  } catch (error) {
    next(error); // Pasa el error al manejador global
  }
};

/**
 * Obtiene una lista de todos los estados.
 */
const listarEstados = async (req, res, next) => {
  try {
    const estados = await estadoService.obtenerTodosLosEstados();
    res.status(200).json({
      success: true,
      data: estados,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene un estado específico por su ID.
 */
const obtenerEstadoPorId = async (req, res, next) => {
  try {
    const { idEstado } = req.params;
    const estado = await estadoService.obtenerEstadoPorId(Number(idEstado));
    // El servicio lanza NotFoundError si no se encuentra
    res.status(200).json({
      success: true,
      data: estado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza (Edita) un estado existente por su ID.
 */
const actualizarEstado = async (req, res, next) => {
  try {
    const { idEstado } = req.params;
    const estadoActualizado = await estadoService.actualizarEstado(
      Number(idEstado),
      req.body
    );
    // El servicio lanza NotFoundError o ConflictError
    res.status(200).json({
      success: true,
      message: "Estado actualizado exitosamente.",
      data: estadoActualizado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina físicamente un estado por su ID.
 */
const eliminarEstadoFisico = async (req, res, next) => {
  try {
    const { idEstado } = req.params;
    await estadoService.eliminarEstadoFisico(Number(idEstado));
    // El servicio lanza NotFoundError o ConflictError
    res.status(204).send(); // 204 No Content para eliminaciones físicas exitosas
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearEstado,
  listarEstados,
  obtenerEstadoPorId,
  actualizarEstado,
  eliminarEstadoFisico,
};
