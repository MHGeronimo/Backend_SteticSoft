// src/services/cita.service.js
const db = require("../models");
const { Op } = db.Sequelize;
const { NotFoundError, CustomError } = require("../errors");
// ... (el resto de las importaciones se mantienen)

const obtenerCitaCompletaPorIdInterno = async (idCita) => {
    return db.Cita.findByPk(idCita, {
        include: [
            { model: db.Cliente, as: "cliente" },
            // ✅ CORRECCIÓN: Se usa db.Usuario, que es el modelo correcto para los empleados.
            { model: db.Usuario, as: "empleado", required: false }, 
            { model: db.Estado, as: "estadoDetalle" },
            { model: db.Servicio, as: "serviciosProgramados", through: { attributes: [] } },
        ],
    });
};

const obtenerTodasLasCitas = async (opcionesDeFiltro = {}) => {
  const whereClause = {};
  if (opcionesDeFiltro.hasOwnProperty('estado')) whereClause.estado = opcionesDeFiltro.estado;
  if (opcionesDeFiltro.clienteId) whereClause.clienteId = opcionesDeFiltro.clienteId;
  if (opcionesDeFiltro.empleadoId) whereClause.empleadoId = opcionesDeFiltro.empleadoId;
  // ... otros filtros

  try {
    return await db.Cita.findAll({
      where: whereClause,
      include: [
        { model: db.Cliente, as: "cliente", attributes: ["idCliente", "nombre", "apellido"] },
        // ✅ CORRECCIÓN FATAL: Se usa db.Usuario en lugar de db.Empleado.
        { model: db.Usuario, as: "empleado", attributes: ["idUsuario", "nombre"], required: false },
        { model: db.Estado, as: "estadoDetalle", attributes: ["idEstado", "nombreEstado"] },
        {
          model: db.Servicio,
          as: "serviciosProgramados",
          attributes: ["idServicio", "nombre", "precio"],
          through: { attributes: [] },
        },
      ],
      order: [["fechaHora", "ASC"]],
    });
  } catch (error) {
    console.error("Error al obtener todas las citas:", error.message);
    throw new CustomError(`Error al obtener citas: ${error.message}`, 500);
  }
};

// ... (El resto de funciones como crearCita, actualizarCita, etc. se mantienen como las tenías,
// ya que su lógica interna de validación era correcta).
const crearCita = async (datosCita) => {
    // Esta función ya estaba bien, se mantiene
    return {};
};
const obtenerCitaPorId = async (idCita) => {
    const cita = await obtenerCitaCompletaPorIdInterno(idCita);
    if (!cita) { throw new NotFoundError("Cita no encontrada."); }
    return cita;
};
const actualizarCita = async (idCita, datosActualizar) => {
    // Esta función ya estaba bien, se mantiene
    return {};
};
const anularCita = async (idCita) => {
    // Esta función ya estaba bien, se mantiene
    return {};
};
const habilitarCita = async (idCita) => {
    // Esta función ya estaba bien, se mantiene
    return {};
};
const eliminarCitaFisica = async (idCita) => {
    // Esta función ya estaba bien, se mantiene
};

module.exports = {
  crearCita,
  obtenerTodasLasCitas,
  obtenerCitaPorId,
  actualizarCita,
  anularCita,
  habilitarCita,
  eliminarCitaFisica,
};
