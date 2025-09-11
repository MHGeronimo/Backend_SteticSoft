// src/controllers/servicio.controller.js
const { handleValidationErrors } = require("../middlewares/validation.middleware");
const { 
  validateServicio, 
  validateServicioUpdate,  // ✅ Añadir esto
  listarServiciosValidator,
  cambiarEstadoServicioValidators,
  idServicioValidator
} = require("../validators/servicio.validators");
const servicioService = require("../services/servicio.service.js");

const crearServicio = async (req, res, next) => {
  try {
    const servicioData = {
      ...req.body,
      imagen: req.file ? req.file.path : null,
    };

    const nuevo = await servicioService.crearServicio(servicioData);
    res.status(201).json({ success: true, message: "Servicio creado.", data: nuevo });
  } catch (error) {
    next(error);
  }
};

const listarServicios = async (req, res, next) => {
    try {
        const filtros = {
            busqueda: req.query.busqueda,
            estado: req.query.estado,
            idCategoriaServicio: req.query.idCategoriaServicio,
        };
        const servicios = await servicioService.obtenerTodosLosServicios(filtros);
        res.status(200).json({ success: true, data: servicios });
    } catch (error) {
        next(error);
    }
};

/**
 * ✅ NUEVA FUNCIÓN: Responde a la ruta /disponibles
 */
const listarServiciosDisponibles = async (req, res, next) => {
    try {
        const servicios = await servicioService.obtenerServiciosDisponibles();
        res.status(200).json({ success: true, data: servicios });
    } catch (error) {
        next(error);
    }
};

/**
 * Obtiene una lista de servicios activos para mostrar en la landing pública.
 */
const listarServiciosPublicos = async (req, res, next) => {
  try {
    console.log("🔍 Entrando a listarServiciosPublicos");

    const resultado = await servicioService.obtenerTodosLosServicios({
      estado: true,
    });

    console.log("📥 Resultado crudo de servicioService:", resultado);

    // Aseguramos que siempre trabajamos con un array
    const listaServicios = Array.isArray(resultado)
      ? resultado
      : resultado?.servicios || [];

    console.log("📦 Lista de servicios procesada:", listaServicios.length, "items");

    // Filtrar y mapear al formato esperado por el frontend
    const serviciosPublicos = listaServicios
      .filter(s => s.estado === true)
      .map(s => ({
        id: s.idServicio,
        name: s.nombre,
        description: s.descripcion,
        price: Number(s.precio),
        image: s.imagen,
        categoryName: s.categoria?.nombre || null
      }));

    console.log("🧾 Servicios públicos listos para enviar:", serviciosPublicos.length);

    res.status(200).json({
      success: true,
      data: serviciosPublicos,
    });
  } catch (error) {
    console.error("❌ Error al listar servicios públicos:", error);
    next(error);
  }
};


const obtenerServicioPorId = async (req, res, next) => {
    try {
        const { idServicio } = req.params;
        const servicio = await servicioService.obtenerServicioPorId(Number(idServicio));
        res.status(200).json({ success: true, data: servicio });
    } catch (error) {
        next(error);
    }
};
const actualizarServicio = async (req, res, next) => {
    try {
        const { idServicio } = req.params;
        const servicioData = {
            ...req.body,
            imagen: req.file ? req.file.path : req.body.imagen,
        };
        const actualizado = await servicioService.actualizarServicio(Number(idServicio), servicioData);
        res.status(200).json({ success: true, message: "Servicio actualizado.", data: actualizado });
    } catch (error) {
        next(error);
    }
};
const cambiarEstadoServicio = async (req, res, next) => {
    try {
        const { idServicio } = req.params;
        const { estado } = req.body;
        const actualizado = await servicioService.cambiarEstadoServicio(Number(idServicio), estado);
        res.status(200).json({ success: true, message: "Estado del servicio cambiado.", data: actualizado });
    } catch (error) {
        next(error);
    }
};
const eliminarServicioFisico = async (req, res, next) => {
    try {
        const { idServicio } = req.params;
        await servicioService.eliminarServicioFisico(Number(idServicio));
        return res.status(204).send();
    } catch (error) {
        next(error);
    }
};

module.exports = {
  crearServicio,
 listarServicios,
  listarServiciosPublicos,
  obtenerServicioPorId,
  actualizarServicio,
  cambiarEstadoServicio,
  eliminarServicioFisico,
  listarServiciosDisponibles,
};
