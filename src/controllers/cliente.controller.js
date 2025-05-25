// src/controllers/cliente.controller.js
const clienteService = require("../services/cliente.service.js"); // Ajusta la ruta si es necesario

/**
 * Crea un nuevo cliente.
 */
const crearCliente = async (req, res, next) => {
  try {
    const nuevoCliente = await clienteService.crearCliente(req.body);
    res.status(201).json({
      success: true,
      message: "Cliente creado exitosamente.",
      data: nuevoCliente,
    });
  } catch (error) {
    next(error); // Pasa el error al manejador global
  }
};

/**
 * Obtiene una lista de todos los clientes.
 * Permite filtrar por query params, ej. ?estado=true
 */
const listarClientes = async (req, res, next) => {
  try {
    const opcionesDeFiltro = {};
    if (req.query.estado === "true") {
      opcionesDeFiltro.estado = true;
    } else if (req.query.estado === "false") {
      opcionesDeFiltro.estado = false;
    }
    // Podrías añadir más filtros aquí si son necesarios (ej. por nombre, documento)

    const clientes = await clienteService.obtenerTodosLosClientes(
      opcionesDeFiltro
    );
    res.status(200).json({
      success: true,
      data: clientes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene un cliente específico por su ID.
 */
const obtenerClientePorId = async (req, res, next) => {
  try {
    const { idCliente } = req.params;
    const cliente = await clienteService.obtenerClientePorId(Number(idCliente));
    // El servicio ya lanza NotFoundError si no se encuentra
    res.status(200).json({
      success: true,
      data: cliente,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza (Edita) un cliente existente por su ID.
 */
const actualizarCliente = async (req, res, next) => {
  try {
    const { idCliente } = req.params;
    const clienteActualizado = await clienteService.actualizarCliente(
      Number(idCliente),
      req.body
    );
    // El servicio ya lanza errores específicos (NotFoundError, ConflictError, BadRequestError)
    res.status(200).json({
      success: true,
      message: "Cliente actualizado exitosamente.",
      data: clienteActualizado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Anula un cliente (borrado lógico, estado = false).
 */
const anularCliente = async (req, res, next) => {
  try {
    const { idCliente } = req.params;
    const clienteAnulado = await clienteService.anularCliente(
      Number(idCliente)
    );
    res.status(200).json({
      success: true,
      message: "Cliente anulado (deshabilitado) exitosamente.",
      data: clienteAnulado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Habilita un cliente (estado = true).
 */
const habilitarCliente = async (req, res, next) => {
  try {
    const { idCliente } = req.params;
    const clienteHabilitado = await clienteService.habilitarCliente(
      Number(idCliente)
    );
    res.status(200).json({
      success: true,
      message: "Cliente habilitado exitosamente.",
      data: clienteHabilitado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina físicamente un cliente por su ID.
 */
const eliminarClienteFisico = async (req, res, next) => {
  try {
    const { idCliente } = req.params;
    await clienteService.eliminarClienteFisico(Number(idCliente));
    res.status(204).send(); // 204 No Content para eliminaciones físicas exitosas
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearCliente,
  listarClientes,
  obtenerClientePorId,
  actualizarCliente,
  anularCliente,
  habilitarCliente,
  eliminarClienteFisico,
};
