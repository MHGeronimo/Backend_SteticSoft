// src/controllers/abastecimiento.controller.js
const abastecimientoService = require("../services/abastecimiento.service.js"); // Ajusta la ruta si es necesario

/**
 * Crea un nuevo registro de abastecimiento.
 */
const crearAbastecimiento = async (req, res, next) => {
  try {
    const nuevoAbastecimiento = await abastecimientoService.crearAbastecimiento(
      req.body
    );
    res.status(201).json({
      success: true,
      message:
        "Registro de abastecimiento creado exitosamente. Inventario actualizado.",
      data: nuevoAbastecimiento,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene una lista de todos los registros de abastecimiento.
 * Permite filtrar por query params, ej. ?productoId=1&estado=true
 */
const listarAbastecimientos = async (req, res, next) => {
  try {
    const opcionesDeFiltro = {};
    if (req.query.productoId) {
      const idProducto = Number(req.query.productoId);
      if (!isNaN(idProducto) && idProducto > 0) {
        opcionesDeFiltro.productoId = idProducto;
      }
    }
    if (req.query.empleadoAsignado) {
      const idEmpleado = Number(req.query.empleadoAsignado);
      if (!isNaN(idEmpleado) && idEmpleado > 0) {
        opcionesDeFiltro.empleadoAsignado = idEmpleado;
      }
    }
    if (req.query.estado === "true") {
      // Filtro para el nuevo campo estado
      opcionesDeFiltro.estado = true;
    } else if (req.query.estado === "false") {
      opcionesDeFiltro.estado = false;
    }
    // Podrías añadir filtro por estaAgotado, rango de fechas, etc.

    const abastecimientos =
      await abastecimientoService.obtenerTodosLosAbastecimientos(
        opcionesDeFiltro
      );
    res.status(200).json({
      success: true,
      data: abastecimientos,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene un registro de abastecimiento específico por su ID.
 */
const obtenerAbastecimientoPorId = async (req, res, next) => {
  try {
    const { idAbastecimiento } = req.params;
    const abastecimiento =
      await abastecimientoService.obtenerAbastecimientoPorId(
        Number(idAbastecimiento)
      );
    res.status(200).json({
      success: true,
      data: abastecimiento,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza un registro de abastecimiento existente por su ID.
 * (Principalmente para campos como empleadoAsignado, estaAgotado, etc.)
 */
const actualizarAbastecimiento = async (req, res, next) => {
  try {
    const { idAbastecimiento } = req.params;
    const abastecimientoActualizado =
      await abastecimientoService.actualizarAbastecimiento(
        Number(idAbastecimiento),
        req.body
      );
    res.status(200).json({
      success: true,
      message: "Registro de abastecimiento actualizado exitosamente.",
      data: abastecimientoActualizado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Anula un registro de abastecimiento (estado booleano = false y ajusta inventario).
 */
const anularAbastecimiento = async (req, res, next) => {
  try {
    const { idAbastecimiento } = req.params;
    const abastecimientoAnulado =
      await abastecimientoService.anularAbastecimiento(
        Number(idAbastecimiento)
      );
    res.status(200).json({
      success: true,
      message:
        "Abastecimiento anulado exitosamente. El inventario ha sido ajustado.",
      data: abastecimientoAnulado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Habilita un registro de abastecimiento (estado booleano = true y ajusta inventario).
 */
const habilitarAbastecimiento = async (req, res, next) => {
  try {
    const { idAbastecimiento } = req.params;
    const abastecimientoHabilitado =
      await abastecimientoService.habilitarAbastecimiento(
        Number(idAbastecimiento)
      );
    res.status(200).json({
      success: true,
      message:
        "Abastecimiento habilitado exitosamente. El inventario ha sido ajustado.",
      data: abastecimientoHabilitado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina físicamente un registro de abastecimiento por su ID.
 * ¡ADVERTENCIA: Esto también ajusta el inventario si el registro estaba activo!
 */
const eliminarAbastecimientoFisico = async (req, res, next) => {
  try {
    const { idAbastecimiento } = req.params;
    await abastecimientoService.eliminarAbastecimientoFisico(
      Number(idAbastecimiento)
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearAbastecimiento,
  listarAbastecimientos,
  obtenerAbastecimientoPorId,
  actualizarAbastecimiento,
  anularAbastecimiento, // NUEVA FUNCIÓN
  habilitarAbastecimiento, // NUEVA FUNCIÓN
  eliminarAbastecimientoFisico,
};
