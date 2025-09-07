// src/controllers/servicio.controller.js
const servicioService = require("../services/servicio.service.js");

// ... (las funciones crearServicio, listarServicios, etc., se mantienen como estaban)
const crearServicio = async (req, res, next) => {
    try {
        const servicioData = req.body;
        if (req.file) {
            servicioData.imagenUrl = `/uploads/servicios/${req.file.filename}`;
        }
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
            idCategoriaServicio: req.query.idCategoriaServicio || req.query.categoriaServicioId,
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

// ... (el resto de las funciones: listarServiciosPublicos, obtenerServicioPorId, etc., se mantienen)

const listarServiciosPublicos = async (req, res, next) => {
    try {
        const servicios = await servicioService.obtenerTodosLosServicios({ estado: "Activo" });
        res.status(200).json({ success: true, data: servicios });
    } catch (error) {
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
        const servicioData = req.body;
        if (req.file) {
            servicioData.imagenUrl = `/uploads/servicios/${req.file.filename}`;
        }
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
  listarServiciosDisponibles, // ✅ Exportar la nueva función
};
