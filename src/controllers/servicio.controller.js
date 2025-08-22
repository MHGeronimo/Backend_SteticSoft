const path = require("path");
const db = require("../models");
const { Op } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors");

const servicioService = require("../services/servicio.service.js");

/**
 * Crea un nuevo servicio.
 */
const crearServicio = async (req, res, next) => {
    // --- INICIO DE LA DEPURACIÓN ---
  console.log("--- INICIO DEPURACIÓN crearServicio ---");
  console.log("CONTENIDO DE req.body:", JSON.stringify(req.body, null, 2));
  console.log("CONTENIDO DE req.file:", JSON.stringify(req.file, null, 2));
  // --- FIN DE LA DEPURACIÓN ---
  try {
    const servicioData = { ...req.body };
    if (req.file) {
      servicioData.imagen = path.join('uploads', 'servicios', req.file.filename).replace(/\\/g, '/');
    }

       // --- DEPURACIÓN ADICIONAL ---
    console.log("DATOS ENVIADOS AL SERVICIO:", JSON.stringify(servicioData, null, 2));
    // --- FIN DEPURACIÓN ADICIONAL ---

    const nuevoServicio = await servicioService.crearServicio(servicioData);
    res.status(201).json({
      success: true,
      message: "Servicio creado exitosamente.",
      data: nuevoServicio,
    });
  } catch (error) {
        // --- DEPURACIÓN DE ERRORES ---
    console.error("ERROR CAPTURADO EN EL CONTROLADOR:", error.message);
    // --- FIN DEPURACIÓN DE ERRORES ---
    next(error);
  }
};

/**
 * Obtiene una lista de todos los servicios con filtros y búsqueda.
 */
const listarServicios = async (req, res, next) => {
  try {
    const opcionesDeFiltro = {
      busqueda: req.query.busqueda,
      estado: req.query.estado,
      categoriaServicioId: req.query.categoriaServicioId,
    };

    const servicios = await servicioService.obtenerTodosLosServicios(
      opcionesDeFiltro
    );
    
    // El servicio ahora devuelve directamente el array de datos.
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
 * Actualiza un servicio existente por su ID.
 */
const actualizarServicio = async (req, res, next) => {
  try {
    const { idServicio } = req.params;
    const datosActualizar = { ...req.body };
    if (req.file) {
      datosActualizar.imagen = path.join('uploads', 'servicios', req.file.filename).replace(/\\/g, '/');
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
    const { estado } = req.body;
    const servicioActualizado = await servicioService.cambiarEstadoServicio(
      Number(idServicio),
      estado
    );
    res.status(200).json({
      success: true,
      message: `Estado del servicio cambiado exitosamente.`,
      data: servicioActualizado,
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
  cambiarEstadoServicio, // Esta función es más genérica y puede reemplazar a anular/habilitar
  eliminarServicioFisico,
};
