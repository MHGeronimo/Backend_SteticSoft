// src/controllers/novedades.controller.js
const novedadesService = require("../services/novedades.service.js");

/**
 * Crea una nueva novedad y la asigna a uno o varios empleados.
 */
const crearNovedad = async (req, res, next) => {
  try {
    // Separamos los IDs de los empleados del resto de los datos de la novedad
    const { empleadosIds, ...datosNovedad } = req.body;

    const nuevaNovedad = await novedadesService.crearNovedad(datosNovedad, empleadosIds);
    res.status(201).json({
      success: true,
      message: "Novedad creada y asignada exitosamente.",
      data: nuevaNovedad,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene una lista de todas las novedades, con opción de filtrar por estado o empleado.
 */
const listarNovedades = async (req, res, next) => {
  try {
    const opcionesDeFiltro = {
      estado: req.query.estado,
      empleadoId: req.query.empleadoId,
    };

    const novedades = await novedadesService.obtenerTodasLasNovedades(opcionesDeFiltro);
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
    // CORREGIDO: Parámetro en singular
    const { idNovedad } = req.params;
    const novedad = await novedadesService.obtenerNovedadPorId(Number(idNovedad));
    res.status(200).json({
      success: true,
      data: novedad,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza una novedad existente y/o sus empleados asignados.
 */
const actualizarNovedad = async (req, res, next) => {
  try {
    // CORREGIDO: Parámetro en singular
    const { idNovedad } = req.params;
    // Separamos los IDs de los empleados de los datos a actualizar
    const { empleadosIds, ...datosActualizar } = req.body;

    const novedadActualizada = await novedadesService.actualizarNovedad(
      Number(idNovedad),
      datosActualizar,
      empleadosIds // Se pasan los empleados para actualizar la tabla de unión
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
    // CORREGIDO: Parámetro en singular
    const { idNovedad } = req.params;
    const { estado } = req.body;

    const novedadActualizada = await novedadesService.cambiarEstadoNovedad(
      Number(idNovedad),
      estado
    );
    res.status(200).json({
      success: true,
      message: `Estado de la novedad cambiado exitosamente.`,
      data: novedadActualizada,
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
    // CORREGIDO: Parámetro en singular
    const { idNovedad } = req.params;
    await novedadesService.eliminarNovedadFisica(Number(idNovedad));
    // Se envía 204 No Content, que es el estándar para eliminaciones exitosas.
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
  cambiarEstadoNovedad,
  eliminarNovedadFisica,
};