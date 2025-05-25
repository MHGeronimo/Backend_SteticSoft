// src/controllers/novedades.controller.js
const novedadesService = require("../services/novedades.service.js"); // Ajusta la ruta si es necesario

/**
 * Crea una nueva novedad para un empleado.
 */
const crearNovedad = async (req, res, next) => {
  try {
    // El cuerpo de la solicitud (req.body) debería contener:
    // { empleadoId, diaSemana, horaInicio, horaFin, estado? }
    const nuevaNovedad = await novedadesService.crearNovedad(req.body);
    res.status(201).json({
      success: true,
      message: "Novedad creada exitosamente.",
      data: nuevaNovedad,
    });
  } catch (error) {
    next(error); // Pasa el error al manejador global
  }
};

/**
 * Obtiene una lista de todas las novedades.
 * Permite filtrar por query params, ej. ?estado=true&empleadoId=1&diaSemana=1
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
      // diaSemana puede ser 0
      const dia = Number(req.query.diaSemana);
      if (!isNaN(dia) && dia >= 0 && dia <= 6) {
        opcionesDeFiltro.diaSemana = dia;
      }
    }
    // Podrías añadir más filtros aquí si son necesarios

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
    // El servicio ya lanza NotFoundError si no se encuentra
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
 * (Principalmente para horaInicio, horaFin, estado).
 */
const actualizarNovedad = async (req, res, next) => {
  try {
    const { idNovedades } = req.params;
    // No se permite actualizar empleadoId ni diaSemana aquí para mantener la unicidad.
    // Si se necesita cambiar eso, se debería borrar y crear una nueva.
    const { horaInicio, horaFin, estado } = req.body;
    const datosActualizar = { horaInicio, horaFin, estado };

    // Filtrar propiedades undefined para que no se intenten actualizar a null innecesariamente
    Object.keys(datosActualizar).forEach(
      (key) => datosActualizar[key] === undefined && delete datosActualizar[key]
    );

    const novedadActualizada = await novedadesService.actualizarNovedad(
      Number(idNovedades),
      datosActualizar
    );
    // El servicio ya lanza errores específicos (NotFoundError, BadRequestError)
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
    // El servicio lanza NotFoundError
    res.status(204).send(); // 204 No Content para eliminaciones físicas exitosas
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
};
