// src/controllers/especialidad.controller.js
const especialidadService = require("../services/especialidad.service.js");

const crearEspecialidad = async (req, res, next) => {
  try {
    const nuevaEspecialidad = await especialidadService.crearEspecialidad(
      req.body
    );
    res.status(201).json({
      success: true,
      message: "Especialidad creada exitosamente.",
      data: nuevaEspecialidad,
    });
  } catch (error) {
    next(error);
  }
};

const listarEspecialidades = async (req, res, next) => {
  try {
    const opcionesDeFiltro = {};
    if (req.query.estado === "true") {
      opcionesDeFiltro.estado = true;
    } else if (req.query.estado === "false") {
      opcionesDeFiltro.estado = false;
    }
    const especialidades =
      await especialidadService.obtenerTodasLasEspecialidades(opcionesDeFiltro);
    res.status(200).json({
      success: true,
      data: especialidades,
    });
  } catch (error) {
    next(error);
  }
};

const obtenerEspecialidadPorId = async (req, res, next) => {
  try {
    const { idEspecialidad } = req.params;
    const especialidad = await especialidadService.obtenerEspecialidadPorId(
      Number(idEspecialidad)
    );
    res.status(200).json({
      success: true,
      data: especialidad,
    });
  } catch (error) {
    next(error);
  }
};

const actualizarEspecialidad = async (req, res, next) => {
  try {
    const { idEspecialidad } = req.params;
    const especialidadActualizada =
      await especialidadService.actualizarEspecialidad(
        Number(idEspecialidad),
        req.body
      );
    res.status(200).json({
      success: true,
      message: "Especialidad actualizada exitosamente.",
      data: especialidadActualizada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cambia el estado (activo/inactivo) de una especialidad.
 */
const cambiarEstadoEspecialidad = async (req, res, next) => {
  try {
    const { idEspecialidad } = req.params;
    const { estado } = req.body; // Se espera un booleano

    const especialidadActualizada =
      await especialidadService.cambiarEstadoEspecialidad(
        Number(idEspecialidad),
        estado
      );
    res.status(200).json({
      success: true,
      message: `Estado de la especialidad ID ${idEspecialidad} cambiado a ${estado} exitosamente.`,
      data: especialidadActualizada,
    });
  } catch (error) {
    next(error);
  }
};

const anularEspecialidad = async (req, res, next) => {
  try {
    const { idEspecialidad } = req.params;
    const especialidadAnulada = await especialidadService.anularEspecialidad(
      Number(idEspecialidad)
    );
    res.status(200).json({
      success: true,
      message: "Especialidad anulada (deshabilitada) exitosamente.",
      data: especialidadAnulada,
    });
  } catch (error) {
    next(error);
  }
};

const habilitarEspecialidad = async (req, res, next) => {
  try {
    const { idEspecialidad } = req.params;
    const especialidadHabilitada =
      await especialidadService.habilitarEspecialidad(Number(idEspecialidad));
    res.status(200).json({
      success: true,
      message: "Especialidad habilitada exitosamente.",
      data: especialidadHabilitada,
    });
  } catch (error) {
    next(error);
  }
};

const eliminarEspecialidadFisica = async (req, res, next) => {
  try {
    const { idEspecialidad } = req.params;
    await especialidadService.eliminarEspecialidadFisica(
      Number(idEspecialidad)
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearEspecialidad,
  listarEspecialidades,
  obtenerEspecialidadPorId,
  actualizarEspecialidad,
  anularEspecialidad,
  habilitarEspecialidad,
  eliminarEspecialidadFisica,
  cambiarEstadoEspecialidad, // <-- Nueva función exportada
};
