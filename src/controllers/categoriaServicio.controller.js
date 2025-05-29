// src/controllers/categoriaServicio.controller.js
const categoriaServicioService = require("../services/categoriaServicio.service.js");

const crearCategoriaServicio = async (req, res, next) => {
  try {
    const nuevaCategoria =
      await categoriaServicioService.crearCategoriaServicio(req.body);
    res.status(201).json({
      success: true,
      message: "Categoría de servicio creada exitosamente.",
      data: nuevaCategoria,
    });
  } catch (error) {
    next(error);
  }
};

const listarCategoriasServicio = async (req, res, next) => {
  try {
    const opcionesDeFiltro = {};
    if (req.query.estado === "true") {
      opcionesDeFiltro.estado = true;
    } else if (req.query.estado === "false") {
      opcionesDeFiltro.estado = false;
    }
    const categorias =
      await categoriaServicioService.obtenerTodasLasCategoriasServicio(
        opcionesDeFiltro
      );
    res.status(200).json({
      success: true,
      data: categorias,
    });
  } catch (error) {
    next(error);
  }
};

const obtenerCategoriaServicioPorId = async (req, res, next) => {
  try {
    const { idCategoriaServicio } = req.params;
    const categoria =
      await categoriaServicioService.obtenerCategoriaServicioPorId(
        Number(idCategoriaServicio)
      );
    res.status(200).json({
      success: true,
      data: categoria,
    });
  } catch (error) {
    next(error);
  }
};

const actualizarCategoriaServicio = async (req, res, next) => {
  try {
    const { idCategoriaServicio } = req.params;
    const categoriaActualizada =
      await categoriaServicioService.actualizarCategoriaServicio(
        Number(idCategoriaServicio),
        req.body
      );
    res.status(200).json({
      success: true,
      message: "Categoría de servicio actualizada exitosamente.",
      data: categoriaActualizada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cambia el estado (activo/inactivo) de una categoría de servicio.
 */
const cambiarEstadoCategoriaServicio = async (req, res, next) => {
  try {
    const { idCategoriaServicio } = req.params;
    const { estado } = req.body; // Se espera un booleano

    const categoriaActualizada =
      await categoriaServicioService.cambiarEstadoCategoriaServicio(
        Number(idCategoriaServicio),
        estado
      );
    res.status(200).json({
      success: true,
      message: `Estado de la categoría de servicio ID ${idCategoriaServicio} cambiado a ${estado} exitosamente.`,
      data: categoriaActualizada,
    });
  } catch (error) {
    next(error);
  }
};

const anularCategoriaServicio = async (req, res, next) => {
  try {
    const { idCategoriaServicio } = req.params;
    const categoriaAnulada =
      await categoriaServicioService.anularCategoriaServicio(
        Number(idCategoriaServicio)
      );
    res.status(200).json({
      success: true,
      message: "Categoría de servicio anulada (deshabilitada) exitosamente.",
      data: categoriaAnulada,
    });
  } catch (error) {
    next(error);
  }
};

const habilitarCategoriaServicio = async (req, res, next) => {
  try {
    const { idCategoriaServicio } = req.params;
    const categoriaHabilitada =
      await categoriaServicioService.habilitarCategoriaServicio(
        Number(idCategoriaServicio)
      );
    res.status(200).json({
      success: true,
      message: "Categoría de servicio habilitada exitosamente.",
      data: categoriaHabilitada,
    });
  } catch (error) {
    next(error);
  }
};

const eliminarCategoriaServicioFisica = async (req, res, next) => {
  try {
    const { idCategoriaServicio } = req.params;
    await categoriaServicioService.eliminarCategoriaServicioFisica(
      Number(idCategoriaServicio)
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearCategoriaServicio,
  listarCategoriasServicio,
  obtenerCategoriaServicioPorId,
  actualizarCategoriaServicio,
  anularCategoriaServicio,
  habilitarCategoriaServicio,
  eliminarCategoriaServicioFisica,
  cambiarEstadoCategoriaServicio, // <-- Nueva función exportada
};
