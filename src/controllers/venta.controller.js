// src/controllers/venta.controller.js
const ventaService = require("../services/venta.service.js");

/**
 * Crea una nueva venta.
 */
const crearVenta = async (req, res, next) => {
  try {
    const nuevaVenta = await ventaService.crearVenta(req.body);
    res.status(201).json({
      success: true,
      message: "Venta creada exitosamente.",
      data: nuevaVenta,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene una lista de todas las ventas.
 */
const listarVentas = async (req, res, next) => {
  try {
    const opcionesDeFiltro = {};
    if (req.query.estado === "true") {
      opcionesDeFiltro.estado = true;
    } else if (req.query.estado === "false") {
      opcionesDeFiltro.estado = false;
    }
    if (req.query.clienteId) {
      const idCliente = Number(req.query.clienteId);
      if (!isNaN(idCliente) && idCliente > 0) {
        opcionesDeFiltro.clienteId = idCliente;
      }
    }
    if (req.query.dashboardId) {
      const idDashboard = Number(req.query.dashboardId);
      if (!isNaN(idDashboard) && idDashboard > 0) {
        opcionesDeFiltro.dashboardId = idDashboard;
      }
    }
    if (req.query.estadoVentaId) {
      const idEstadoVenta = Number(req.query.estadoVentaId);
      if (!isNaN(idEstadoVenta) && idEstadoVenta > 0) {
        opcionesDeFiltro.estadoVentaId = idEstadoVenta;
      }
    }
    const ventas = await ventaService.obtenerTodasLasVentas(opcionesDeFiltro);
    res.status(200).json({
      success: true,
      data: ventas,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene una venta específica por su ID.
 */
const obtenerVentaPorId = async (req, res, next) => {
  try {
    const { idVenta } = req.params;
    const venta = await ventaService.obtenerVentaPorId(Number(idVenta));
    res.status(200).json({
      success: true,
      data: venta,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza el estado del PROCESO de una venta y/o su estado booleano (activo/inactivo).
 */
const actualizarEstadoVenta = async (req, res, next) => {
  try {
    const { idVenta } = req.params;
    const ventaActualizada = await ventaService.actualizarEstadoProcesoVenta(
      Number(idVenta),
      req.body // Puede contener estadoVentaId y/o estado (booleano)
    );
    res.status(200).json({
      success: true,
      message: "Estado de la venta actualizado exitosamente.",
      data: ventaActualizada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cambia el estado booleano general (activo/inactivo) de una venta.
 * Esta función llamará a la lógica de servicio que también maneja el inventario.
 */
const cambiarEstadoGeneralVenta = async (req, res, next) => {
  try {
    const { idVenta } = req.params;
    const { estado } = req.body; // Se espera un booleano para el estado general

    // Se usa actualizarEstadoProcesoVenta, ya que maneja ambos tipos de estado y el inventario.
    // Aquí solo nos interesa cambiar el estado booleano general.
    const ventaActualizada = await ventaService.actualizarEstadoProcesoVenta(
      Number(idVenta),
      { estado } // Solo pasamos el campo 'estado' booleano
    );
    res.status(200).json({
      success: true,
      message: `Estado general de la venta ID ${idVenta} cambiado a ${estado} exitosamente. Inventario ajustado si aplica.`,
      data: ventaActualizada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Anula una venta (estado booleano = false y ajusta inventario).
 */
const anularVenta = async (req, res, next) => {
  try {
    const { idVenta } = req.params;
    const ventaAnulada = await ventaService.anularVenta(Number(idVenta)); // Llama a la función de servicio específica
    res.status(200).json({
      success: true,
      message:
        "Venta anulada exitosamente. El inventario ha sido ajustado si aplica.",
      data: ventaAnulada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Habilita una venta (estado booleano = true y ajusta inventario).
 */
const habilitarVenta = async (req, res, next) => {
  try {
    const { idVenta } = req.params;
    const ventaHabilitada = await ventaService.habilitarVenta(Number(idVenta)); // Llama a la función de servicio específica
    res.status(200).json({
      success: true,
      message:
        "Venta habilitada exitosamente. El inventario ha sido ajustado si aplica.",
      data: ventaHabilitada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina físicamente una venta por su ID.
 */
const eliminarVentaFisica = async (req, res, next) => {
  try {
    const { idVenta } = req.params;
    await ventaService.eliminarVentaFisica(Number(idVenta));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearVenta,
  listarVentas,
  obtenerVentaPorId,
  actualizarEstadoVenta, // Para actualizar estado de proceso y/o general
  anularVenta,
  habilitarVenta,
  eliminarVentaFisica,
  cambiarEstadoGeneralVenta, // <-- Nueva función exportada para cambiar solo el estado booleano
};
