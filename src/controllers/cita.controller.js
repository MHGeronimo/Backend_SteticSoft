// src/controllers/cita.controller.js
const citaService = require("../services/cita.service.js");

/**
 * Crea una nueva cita.
 */
const crearCita = async (req, res, next) => {
  try {
    const nuevaCita = await citaService.crearCita(req.body);
    res.status(201).json({
      success: true,
      message: "Cita creada exitosamente.",
      data: nuevaCita,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene una lista de todas las citas.
 */
const listarCitas = async (req, res, next) => {
  try {
    const opcionesDeFiltro = {};
    if (req.query.estado === "true") {
      opcionesDeFiltro.estado = true;
    } else if (req.query.estado === "false") {
      opcionesDeFiltro.estado = false;
    }
    if (req.query.clienteId) {
      const idCliente = Number(req.query.clienteId);
      if (!isNaN(idCliente) && idCliente > 0)
        opcionesDeFiltro.clienteId = idCliente;
    }
    if (req.query.empleadoId) {
      const idEmpleado = Number(req.query.empleadoId);
      if (!isNaN(idEmpleado) && idEmpleado > 0)
        opcionesDeFiltro.empleadoId = idEmpleado;
    }
    if (req.query.estadoCitaId) {
      const idEstadoCita = Number(req.query.estadoCitaId);
      if (!isNaN(idEstadoCita) && idEstadoCita > 0)
        opcionesDeFiltro.estadoCitaId = idEstadoCita;
    }
    if (req.query.fecha) {
      opcionesDeFiltro.fecha = req.query.fecha;
    }
    const citas = await citaService.obtenerTodasLasCitas(opcionesDeFiltro);
    res.status(200).json({
      success: true,
      data: citas,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene una cita específica por su ID.
 */
const obtenerCitaPorId = async (req, res, next) => {
  try {
    const { idCita } = req.params;
    const cita = await citaService.obtenerCitaPorId(Number(idCita));
    res.status(200).json({
      success: true,
      data: cita,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza campos principales de una cita existente.
 */
const actualizarCita = async (req, res, next) => {
  try {
    const { idCita } = req.params;
    const citaActualizada = await citaService.actualizarCita(
      Number(idCita),
      req.body
    );
    res.status(200).json({
      success: true,
      message: "Cita actualizada exitosamente.",
      data: citaActualizada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cambia el estado (activo/inactivo) de una cita.
 * Llama a la función de servicio que maneja la lógica específica de Cita (incluyendo correos).
 */
const cambiarEstadoCita = async (req, res, next) => {
  try {
    const { idCita } = req.params;
    const { estado } = req.body; // Se espera un booleano

    // Determinar la acción para el correo basado en el nuevo estado
    const accionCorreo = estado ? "reactivada" : "cancelada";

    const citaActualizada = await citaService.cambiarEstadoCita(
      // Usar la función de servicio refactorizada
      Number(idCita),
      estado,
      accionCorreo
    );
    res.status(200).json({
      success: true,
      message: `Estado de la cita ID ${idCita} cambiado a ${estado} exitosamente.`,
      data: citaActualizada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Anula una cita (estado booleano = false).
 */
const anularCita = async (req, res, next) => {
  try {
    const { idCita } = req.params;
    const citaAnulada = await citaService.anularCita(Number(idCita));
    res.status(200).json({
      success: true,
      message: "Cita anulada (deshabilitada) exitosamente.",
      data: citaAnulada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Habilita una cita (estado booleano = true).
 */
const habilitarCita = async (req, res, next) => {
  try {
    const { idCita } = req.params;
    const citaHabilitada = await citaService.habilitarCita(Number(idCita));
    res.status(200).json({
      success: true,
      message: "Cita habilitada exitosamente.",
      data: citaHabilitada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina físicamente una cita por su ID.
 */
const eliminarCitaFisica = async (req, res, next) => {
  try {
    const { idCita } = req.params;
    await citaService.eliminarCitaFisica(Number(idCita));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * Agrega servicios a una cita existente.
 */
const agregarServiciosACita = async (req, res, next) => {
  try {
    const { idCita } = req.params;
    const { idServicios } = req.body;

    if (!Array.isArray(idServicios) || idServicios.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Se requiere un array 'idServicios' con al menos un ID de servicio.",
      });
    }
    const citaActualizada = await citaService.agregarServiciosACita(
      Number(idCita),
      idServicios
    );
    res.status(200).json({
      success: true,
      message: `Servicios agregados a la cita ID ${idCita}.`,
      data: citaActualizada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Quita servicios de una cita existente.
 */
const quitarServiciosDeCita = async (req, res, next) => {
  try {
    const { idCita } = req.params;
    const { idServicios } = req.body;

    if (!Array.isArray(idServicios) || idServicios.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Se requiere un array 'idServicios' con al menos un ID de servicio.",
      });
    }

    const citaActualizada = await citaService.quitarServiciosDeCita(
      Number(idCita),
      idServicios
    );
    res.status(200).json({
      success: true,
      message: `Servicios quitados de la cita ID ${idCita}.`,
      data: citaActualizada,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearCita,
  listarCitas,
  obtenerCitaPorId,
  actualizarCita,
  anularCita,
  habilitarCita,
  eliminarCitaFisica,
  agregarServiciosACita,
  quitarServiciosDeCita,
  cambiarEstadoCita, // <-- Nueva función exportada
};
