// src/controllers/novedades.controller.js
const novedadesService = require("../services/novedades.service.js");

/**
 * Crea una nueva novedad para un empleado.
 */
const crearNovedad = async (req, res, next) => {
  try {
    const nuevaNovedad = await novedadesService.crearNovedad(req.body);
    res.status(201).json({
      success: true,
      message: "Novedad creada exitosamente.",
      data: nuevaNovedad,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene una lista de todas las novedades.
 */
const listarNovedades = async (req, res, next) => {
  try {
    const opcionesDeFiltro = {};
    if (req.query.estado === "true") {
      opcionesDeFiltro.estado = true;
    } else if (req.query.estado === "false") {
      opcionesDeFiltro.estado = false;
    }
    if (req.query.empleadoId) {
      const idEmpleado = Number(req.query.empleadoId);
      if (!isNaN(idEmpleado) && idEmpleado > 0) {
        opcionesDeFiltro.empleadoId = idEmpleado;
      }
    }
    if (req.query.diaSemana !== undefined) {
      const dia = Number(req.query.diaSemana);
      if (!isNaN(dia) && dia >= 0 && dia <= 6) {
        opcionesDeFiltro.diaSemana = dia;
      }
    }
    const novedades = await novedadesService.obtenerTodasLasNovedades(
      opcionesDeFiltro
    );
    res.status(200).json({
      success: true,
      data: novedades,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene una novedad específica por su ID.
 */
const obtenerNovedadPorId = async (req, res, next) => {
  try {
    const { idNovedades } = req.params;
    const novedad = await novedadesService.obtenerNovedadPorId(
      Number(idNovedades)
    );
    res.status(200).json({
      success: true,
      data: novedad,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza una novedad existente por su ID.
 */
const actualizarNovedad = async (req, res, next) => {
  try {
    const { idNovedades } = req.params;
    const { horaInicio, horaFin, estado } = req.body;
    const datosActualizar = { horaInicio, horaFin, estado };

    Object.keys(datosActualizar).forEach(
      (key) => datosActualizar[key] === undefined && delete datosActualizar[key]
    );

    const novedadActualizada = await novedadesService.actualizarNovedad(
      Number(idNovedades),
      datosActualizar
    );
    res.status(200).json({
      success: true,
      message: "Novedad actualizada exitosamente.",
      data: novedadActualizada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cambia el estado (activo/inactivo) de una novedad.
 */
const cambiarEstadoNovedad = async (req, res, next) => {
  try {
    const { idNovedades } = req.params;
    const { estado } = req.body; // Se espera un booleano

    // La función actualizarNovedad del servicio puede manejar el cambio de estado booleano
    // si se le pasa solo el campo estado.
    // O podemos usar la función cambiarEstadoNovedad que creamos en el servicio.
    const novedadActualizada = await novedadesService.cambiarEstadoNovedad(
      Number(idNovedades),
      estado
    );
    res.status(200).json({
      success: true,
      message: `Estado de la novedad ID ${idNovedades} cambiado a ${estado} exitosamente.`,
      data: novedadActualizada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Anula una novedad (estado booleano = false).
 */
const anularNovedad = async (req, res, next) => {
  try {
    const { idNovedades } = req.params;
    const novedadAnulada = await novedadesService.anularNovedad(
      Number(idNovedades)
    );
    res.status(200).json({
      success: true,
      message: "Novedad anulada (deshabilitada) exitosamente.",
      data: novedadAnulada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Habilita una novedad (estado booleano = true).
 */
const habilitarNovedad = async (req, res, next) => {
  try {
    const { idNovedades } = req.params;
    const novedadHabilitada = await novedadesService.habilitarNovedad(
      Number(idNovedades)
    );
    res.status(200).json({
      success: true,
      message: "Novedad habilitada exitosamente.",
      data: novedadHabilitada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina físicamente una novedad por su ID.
 */
const eliminarNovedadFisica = async (req, res, next) => {
  try {
    const { idNovedades } = req.params;
    await novedadesService.eliminarNovedadFisica(Number(idNovedades));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearNovedad,
  listarNovedades,
  obtenerNovedadPorId,
  actualizarNovedad,
  anularNovedad,
  habilitarNovedad,
  eliminarNovedadFisica,
  cambiarEstadoNovedad, // <-- Nueva función exportada
};
