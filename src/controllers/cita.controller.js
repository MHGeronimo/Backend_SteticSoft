//src/controllers/Cita.controllers.js
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
 * Obtiene una lista de todas las citas, con filtros.
 */
const listarCitas = async (req, res, next) => {
  try {
    // ✅ CORRECCIÓN: Se estandariza el filtro para usar idEstado.
    const opcionesDeFiltro = {
        idCliente: req.query.idCliente ? Number(req.query.idCliente) : undefined,
        idUsuario: req.query.idUsuario ? Number(req.query.idUsuario) : undefined,
        idEstado: req.query.idEstado ? Number(req.query.idEstado) : undefined,
        fecha: req.query.fecha || undefined,
    };
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
 * Cambia el estado de proceso de una cita (Pendiente, Completada, etc.).
 */
const cambiarEstadoProcesoCita = async (req, res, next) => {
    try {
        const { idCita } = req.params;
        const { nombreEstado } = req.body; // Se espera el nombre del nuevo estado
        if (!nombreEstado) {
            throw new BadRequestError("El 'nombreEstado' es requerido.");
        }
        const citaActualizada = await citaService.cambiarEstadoPorNombre(idCita, nombreEstado);
        res.status(200).json({
            success: true,
            message: `Estado de la cita cambiado a "${nombreEstado}".`,
            data: citaActualizada
        });
    } catch(error) {
        next(error);
    }
};

/**
 * Anula una cita (cambia su estado a 'Cancelada').
 */
const anularCita = async (req, res, next) => {
  try {
    const { idCita } = req.params;
    const citaAnulada = await citaService.anularCita(Number(idCita));
    res.status(200).json({
      success: true,
      message: "Cita anulada exitosamente.",
      data: citaAnulada,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Habilita una cita (cambia su estado a 'Pendiente').
 */
const habilitarCita = async (req, res, next) => {
  try {
    const { idCita } = req.params;
    const citaHabilitada = await citaService.habilitarCita(Number(idCita));
    res.status(200).json({
      success: true,
      message: "Cita reactivada como 'Pendiente'.",
      data: citaHabilitada,
    });
  } catch (error) {
    next(error);
  }
};

const eliminarCitaFisica = async (req, res, next) => {
    // ... (Tu código existente es correcto)
};
const agregarServiciosACita = async (req, res, next) => {
    // ... (Tu código existente es correcto)
};
const quitarServiciosDeCita = async (req, res, next) => {
    // ... (Tu código existente es correcto)
};

// --- Controladores para obtener datos dinámicos ---

const obtenerDiasDisponiblesPorNovedad = async (req, res, next) => {
  try {
    const { idNovedad } = req.params;
    const { anio, mes } = req.query;
    const dias = await citaService.obtenerDiasDisponiblesPorNovedad(Number(idNovedad), mes, anio);
    res.status(200).json({ success: true, data: dias });
  } catch (error) {
    next(error);
  }
};

const obtenerHorariosDisponiblesPorNovedad = async (req, res, next) => {
  try {
    const { idNovedad } = req.params;
    const { fecha } = req.query;
    const horarios = await citaService.obtenerHorariosDisponiblesPorNovedad(Number(idNovedad), fecha);
    res.status(200).json({ success: true, data: horarios });
  } catch (error) {
    next(error);
  }
};

const buscarClientes = async (req, res, next) => {
  try {
    // ✅ CORRECCIÓN: Se usa 'termino' para coincidir con el validador.
    const { termino } = req.query;
    const clientes = await citaService.buscarClientes(termino);
    res.status(200).json({ success: true, data: clientes });
  } catch (error) {
    next(error);
  }
};

const obtenerEmpleadosPorNovedad = async (req, res, next) => {
  try {
    const { idNovedad } = req.params;
    const empleados = await citaService.obtenerEmpleadosPorNovedad(Number(idNovedad));
    res.status(200).json({ success: true, data: empleados });
  } catch (error) {
    next(error);
  }
};

const obtenerServiciosDisponibles = async (req, res, next) => {
  try {
    const servicios = await citaService.obtenerServiciosDisponibles();
    res.status(200).json({ success: true, data: servicios });
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
  cambiarEstadoProcesoCita,
  obtenerDiasDisponiblesPorNovedad,
  obtenerHorariosDisponiblesPorNovedad,
  buscarClientes,
  obtenerEmpleadosPorNovedad,
  obtenerServiciosDisponibles
};
