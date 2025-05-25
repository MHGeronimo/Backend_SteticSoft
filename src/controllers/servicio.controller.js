// src/controllers/servicio.controller.js
const servicioService = require("../services/servicio.service.js"); // Ajusta la ruta si es necesario

/**
 * Crea un nuevo servicio.
 */
const crearServicio = async (req, res, next) => {
  try {
    // Asumimos que req.body viene con claves camelCase: nombre, descripcion, categoriaServicioId, etc.
    const nuevoServicio = await servicioService.crearServicio(req.body);
    res.status(201).json({
      success: true,
      message: "Servicio creado exitosamente.",
      data: nuevoServicio,
    });
  } catch (error) {
    next(error); // Pasa el error al manejador global
  }
};

/**
 * Obtiene una lista de todos los servicios.
 * Permite filtrar por query params, ej. ?estado=true&categoriaServicioId=1&especialidadId=1
 */
const listarServicios = async (req, res, next) => {
  try {
    const opcionesDeFiltro = {};
    if (req.query.estado === "true") {
      opcionesDeFiltro.estado = true;
    } else if (req.query.estado === "false") {
      opcionesDeFiltro.estado = false;
    }
    if (req.query.categoriaServicioId) {
      const idCategoria = Number(req.query.categoriaServicioId);
      if (!isNaN(idCategoria) && idCategoria > 0) {
        opcionesDeFiltro.categoriaServicioId = idCategoria; // El servicio espera camelCase
      }
    }
    if (req.query.especialidadId) {
      const idEspecialidad = Number(req.query.especialidadId);
      if (!isNaN(idEspecialidad) && idEspecialidad > 0) {
        opcionesDeFiltro.especialidadId = idEspecialidad; // El servicio espera camelCase
      }
    }
    // Podrías añadir más filtros aquí (ej. por nombre)

    const servicios = await servicioService.obtenerTodosLosServicios(
      opcionesDeFiltro
    );
    res.status(200).json({
      success: true,
      data: servicios,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene un servicio específico por su ID.
 */
const obtenerServicioPorId = async (req, res, next) => {
  try {
    const { idServicio } = req.params;
    const servicio = await servicioService.obtenerServicioPorId(
      Number(idServicio)
    );
    // El servicio ya lanza NotFoundError si no se encuentra
    res.status(200).json({
      success: true,
      data: servicio,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza (Edita) un servicio existente por su ID.
 */
const actualizarServicio = async (req, res, next) => {
  try {
    const { idServicio } = req.params;
    const servicioActualizado = await servicioService.actualizarServicio(
      Number(idServicio),
      req.body
    );
    // El servicio ya lanza errores específicos (NotFoundError, ConflictError, BadRequestError)
    res.status(200).json({
      success: true,
      message: "Servicio actualizado exitosamente.",
      data: servicioActualizado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Anula un servicio (borrado lógico, estado = false).
 */
const anularServicio = async (req, res, next) => {
  try {
    const { idServicio } = req.params;
    const servicioAnulado = await servicioService.anularServicio(
      Number(idServicio)
    );
    res.status(200).json({
      success: true,
      message: "Servicio anulado (deshabilitado) exitosamente.",
      data: servicioAnulado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Habilita un servicio (estado = true).
 */
const habilitarServicio = async (req, res, next) => {
  try {
    const { idServicio } = req.params;
    const servicioHabilitado = await servicioService.habilitarServicio(
      Number(idServicio)
    );
    res.status(200).json({
      success: true,
      message: "Servicio habilitado exitosamente.",
      data: servicioHabilitado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina físicamente un servicio por su ID.
 */
const eliminarServicioFisico = async (req, res, next) => {
  try {
    const { idServicio } = req.params;
    await servicioService.eliminarServicioFisico(Number(idServicio));
    // El servicio lanza NotFoundError o ConflictError
    res.status(204).send(); // 204 No Content para eliminaciones físicas exitosas
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearServicio,
  listarServicios,
  obtenerServicioPorId,
  actualizarServicio,
  anularServicio,
  habilitarServicio,
  eliminarServicioFisico,
};
