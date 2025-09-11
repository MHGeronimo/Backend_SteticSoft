// src/controllers/servicio.controller.js
const servicioService = require("../services/servicio.service.js");
const { uploadImage } = require("../config/cloudinary.config.js");

const crearServicio = async (req, res, next) => {
  try {
    const servicioData = { ...req.body };

    // Si se adjunta un archivo en la petición...
    if (req.file) {
      // 1. Súbelo a Cloudinary usando el buffer de memoria.
      const result = await uploadImage(req.file.buffer, "servicios");
      // 2. Asigna la URL segura devuelta por Cloudinary al campo 'imagen'.
      servicioData.imagen = result.secure_url;
    }

    const nuevo = await servicioService.crearServicio(servicioData);
    res.status(201).json({ success: true, message: "Servicio creado exitosamente.", data: nuevo });
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

const listarServiciosDisponibles = async (req, res, next) => {
    try {
        const servicios = await servicioService.obtenerServiciosDisponibles();
        res.status(200).json({ success: true, data: servicios });
    } catch (error) {
        next(error);
    }
};

const listarServiciosPublicos = async (req, res, next) => {
    try {
        const servicios = await servicioService.obtenerTodosLosServicios({ estado: true });
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
        const servicioData = { ...req.body };

        // Misma lógica que en 'crearServicio': si hay un nuevo archivo, súbelo a Cloudinary.
        if (req.file) {
          const result = await uploadImage(req.file.buffer, "servicios");
          servicioData.imagen = result.secure_url;
        }

        const actualizado = await servicioService.actualizarServicio(Number(idServicio), servicioData);
        res.status(200).json({ success: true, message: "Servicio actualizado exitosamente.", data: actualizado });
    } catch (error) {
        next(error);
    }
};

const cambiarEstadoServicio = async (req, res, next) => {
    try {
        const { idServicio } = req.params;
        const { estado } = req.body;
        const actualizado = await servicioService.cambiarEstadoServicio(Number(idServicio), estado);
        res.status(200).json({ success: true, message: "Estado del servicio cambiado exitosamente.", data: actualizado });
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

