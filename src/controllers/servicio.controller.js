// src/controllers/servicio.controller.js
const servicioService = require("../services/servicio.service.js");

/**
 * Crea un nuevo servicio.
 */
const crearServicio = async (req, res, next) => {
  try {
    const servicioData = { ...req.body };
    if (req.file) {
      // Normalize path to be platform-independent and web-accessible
      const imagePath = req.file.path.replace(/\\/g, "/");
      // Construct a web-accessible URL if 'uploads' is served statically
      // Assuming 'uploads' is at the root of the served static files
      servicioData.imagen = imagePath.substring(imagePath.indexOf("uploads"));
    }
    const nuevoServicio = await servicioService.crearServicio(servicioData);
    res.status(201).json({
      success: true,
      message: "Servicio creado exitosamente.",
      data: nuevoServicio,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene una lista de todos los servicios.
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
        opcionesDeFiltro.categoriaServicioId = idCategoria;
      }
    }
    if (req.query.especialidadId) {
      const idEspecialidad = Number(req.query.especialidadId);
      if (!isNaN(idEspecialidad) && idEspecialidad > 0) {
        opcionesDeFiltro.especialidadId = idEspecialidad;
      }
    }
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
    const datosActualizar = { ...req.body };
    if (req.file) {
      // Normalize path to be platform-independent and web-accessible
      const imagePath = req.file.path.replace(/\\/g, "/");
      // Construct a web-accessible URL if 'uploads' is served statically
      // Assuming 'uploads' is at the root of the served static files
      datosActualizar.imagen = imagePath.substring(imagePath.indexOf("uploads"));
    }
    const servicioActualizado = await servicioService.actualizarServicio(
      Number(idServicio),
      datosActualizar
    );
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
 * Cambia el estado (activo/inactivo) de un servicio.
 */
const cambiarEstadoServicio = async (req, res, next) => {
  try {
    const { idServicio } = req.params;
    const { estado } = req.body; // Se espera un booleano

    const servicioActualizado = await servicioService.cambiarEstadoServicio(
      Number(idServicio),
      estado
    );
    res.status(200).json({
      success: true,
      message: `Estado del servicio ID ${idServicio} cambiado a ${estado} exitosamente.`,
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
    res.status(204).send();
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
  cambiarEstadoServicio, // <-- Nueva función exportada
};
