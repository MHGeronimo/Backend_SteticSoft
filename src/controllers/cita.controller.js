//src/controllers/Cita.controllers.js
const citaService = require("../services/cita.service.js");

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

const listarCitas = async (req, res, next) => {
  try {
    const opcionesDeFiltro = {
      idCliente: req.query.idCliente ? Number(req.query.idCliente) : undefined,
      idUsuario: req.query.idUsuario ? Number(req.query.idUsuario) : undefined,
      estado: req.query.estado,
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

const obtenerCitaPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cita = await citaService.obtenerCitaPorId(Number(id));
    res.status(200).json({
      success: true,
      data: cita,
    });
  } catch (error) {
    next(error);
  }
};

const actualizarCita = async (req, res, next) => {
  try {
    const { id } = req.params;
    const citaActualizada = await citaService.actualizarCita(
      Number(id),
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

const cambiarEstadoCita = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const citaActualizada = await citaService.cambiarEstadoCita(
      Number(id),
      estado
    );
    res.status(200).json({
      success: true,
      message: `Estado de la cita cambiado a "${estado}".`,
      data: citaActualizada,
    });
  } catch (error) {
    next(error);
  }
};

const eliminarCitaFisica = async (req, res, next) => {
  try {
    const { id } = req.params;
    await citaService.eliminarCitaFisica(Number(id));
    res.status(200).json({
      success: true,
      message: "Cita eliminada exitosamente.",
    });
  } catch (error) {
    next(error);
  }
};

// --- Controladores para obtener datos dinámicos ---

const obtenerDiasDisponiblesPorNovedad = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { anio, mes } = req.query;
    const dias = await citaService.obtenerDiasDisponiblesPorNovedad(
      Number(id),
      mes,
      anio
    );
    res.status(200).json({ success: true, data: dias });
  } catch (error) {
    next(error);
  }
};

const obtenerHorariosDisponiblesPorNovedad = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fecha } = req.query;
    const horarios = await citaService.obtenerHorariosDisponiblesPorNovedad(
      Number(id),
      fecha
    );
    res.status(200).json({ success: true, data: horarios });
  } catch (error) {
    next(error);
  }
};

const buscarClientes = async (req, res, next) => {
  try {
    const { search } = req.query;
    const clientes = await citaService.buscarClientes(search);
    res.status(200).json({ success: true, data: clientes });
  } catch (error) {
    next(error);
  }
};

const obtenerEmpleadosPorNovedad = async (req, res, next) => {
  try {
    const { id } = req.params;
    const empleados = await citaService.obtenerEmpleadosPorNovedad(Number(id));
    res.status(200).json({ success: true, data: empleados });
  } catch (error) {
    next(error);
  }
};

const obtenerServiciosDisponibles = async (req, res, next) => {
  try {
    const { search } = req.query;
    const servicios = await citaService.obtenerServiciosDisponibles(search);
    res.status(200).json({ success: true, data: servicios });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene los posibles valores para el estado de una cita.
 * Devuelve una lista estática definida en el modelo para poblar selects en el frontend.
 */
const obtenerEstadosCita = (req, res) => {
  // Estos valores vienen directamente de la definición del modelo Cita.model.js
  const estadosPosibles = ["Activa", "En Proceso", "Finalizada", "Cancelada"];
  res.status(200).json({
    success: true,
    data: estadosPosibles,
  });
};



module.exports = {
  crearCita,
  listarCitas,
  obtenerCitaPorId,
  actualizarCita,
  cambiarEstadoCita,
  eliminarCitaFisica,
  obtenerDiasDisponiblesPorNovedad,
  obtenerHorariosDisponiblesPorNovedad,
  buscarClientes,
  obtenerEmpleadosPorNovedad,
  obtenerServiciosDisponibles,
  obtenerEstadosCita,
};
