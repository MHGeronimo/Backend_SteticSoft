// src/controllers/cita.controller.js
const citaService = require("../services/cita.service.js"); // Ajusta la ruta si es necesario

/**
 * Crea una nueva cita.
 */
const crearCita = async (req, res, next) => {
  try {
    // req.body: { fechaHora, clienteId, empleadoId?, estadoCitaId, servicios: [idServicio1], estado? }
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
 * Permite filtrar por query params, ej. ?estado=true&clienteId=1&empleadoId=1&fecha=YYYY-MM-DD
 */
const listarCitas = async (req, res, next) => {
  try {
    const opcionesDeFiltro = {};
    if (req.query.estado === "true") {
      // Estado booleano del registro Cita
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
      // Estado del proceso de la cita
      const idEstadoCita = Number(req.query.estadoCitaId);
      if (!isNaN(idEstadoCita) && idEstadoCita > 0)
        opcionesDeFiltro.estadoCitaId = idEstadoCita;
    }
    if (req.query.fecha) {
      // Para filtrar por una fecha específica
      opcionesDeFiltro.fecha = req.query.fecha; // El servicio se encargará de la lógica de rango del día
    }
    // Podrías añadir filtros por rango de fechas (fechaDesde, fechaHasta)

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
 * Actualiza campos principales de una cita existente (ej. fechaHora, empleado, estado del proceso).
 * No actualiza la lista de servicios de la cita aquí.
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

// --- Controladores para Servicios dentro de una Cita ---

/**
 * Agrega servicios a una cita existente.
 * Espera un cuerpo: { "idServicios": [1, 2, 3] }
 */
const agregarServiciosACita = async (req, res, next) => {
  try {
    const { idCita } = req.params;
    const { idServicios } = req.body; // Array de IDs de servicio

    if (!Array.isArray(idServicios) || idServicios.length === 0) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Se requiere un array 'idServicios' con al menos un ID de servicio.",
        });
    }
    // La validación más detallada de los IDs (si son números, si existen) está en el servicio y validadores.

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
 * Espera un cuerpo: { "idServicios": [1, 2, 3] }
 */
const quitarServiciosDeCita = async (req, res, next) => {
  try {
    const { idCita } = req.params;
    const { idServicios } = req.body; // Array de IDs de servicio a quitar

    if (!Array.isArray(idServicios) || idServicios.length === 0) {
      return res
        .status(400)
        .json({
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
};
