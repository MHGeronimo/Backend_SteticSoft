// src/controllers/servicio.controller.js
const servicioService = require("../services/servicio.service.js");

const crearServicio = async (req, res, next) => {
  try {
    const nuevo = await servicioService.crearServicio(req.body);
    res.status(201).json({
      success: true,
      message: "Servicio creado exitosamente.",
      data: nuevo,
    });
  } catch (error) {
    next(error);
  }
};

const listarServicios = async (req, res, next) => {
  try {
    const filtros = {
      busqueda: req.query.busqueda ?? undefined,
      estado: req.query.estado ?? undefined,
      // Soportamos ambos nombres por si el FE manda cualquiera:
      idCategoriaServicio:
        req.query.idCategoriaServicio ??
        req.query.categoriaServicioId ??
        undefined,
    };

    const servicios = await servicioService.obtenerTodosLosServicios(filtros);
    res.status(200).json({ success: true, data: servicios });
  } catch (error) {
    next(error);
  }
};

const obtenerServicioPorId = async (req, res, next) => {
  try {
    const { idServicio } = req.params;
    const servicio = await servicioService.obtenerServicioPorId(
      Number(idServicio)
    );
    res.status(200).json({ success: true, data: servicio });
  } catch (error) {
    next(error);
  }
};

const actualizarServicio = async (req, res, next) => {
  try {
    const { idServicio } = req.params;
    const actualizado = await servicioService.actualizarServicio(
      Number(idServicio),
      { ...req.body }
    );
    res.status(200).json({
      success: true,
      message: "Servicio actualizado exitosamente.",
      data: actualizado,
    });
  } catch (error) {
    next(error);
  }
};

const cambiarEstadoServicio = async (req, res, next) => {
  try {
    const { idServicio } = req.params;
    const { estado } = req.body;
    const actualizado = await servicioService.cambiarEstadoServicio(
      Number(idServicio),
      estado
    );
    res.status(200).json({
      success: true,
      message: "Estado del servicio cambiado exitosamente.",
      data: actualizado,
    });
  } catch (error) {
    next(error);
  }
};

const eliminarServicioFisico = async (req, res, next) => {
  try {
    const { idServicio } = req.params;
    await servicioService.eliminarServicioFisico(Number(idServicio));
    // Si prefieres devolver mensaje, cambia a 200 y envía JSON.
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearServicio,
  listarServicios,
  obtenerServicioPorId,
  actualizarServicio,
  cambiarEstadoServicio,
  eliminarServicioFisico,
};
