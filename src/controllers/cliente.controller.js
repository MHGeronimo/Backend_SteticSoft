// src/controllers/cliente.controller.js 
const clienteService = require("../services/cliente.service.js");
const db = require("../models"); // Importar db para acceder a Sequelize.Op

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
    next(error);
  }
};

/**
 * Obtiene una lista de todos los clientes, con soporte para paginación, búsqueda y filtrado por estado.
 */
const listarClientes = async (req, res, next) => {
  try {
    const { page, limit, search, estado } = req.query; // Extraer parámetros de la URL

    const opcionesDeFiltro = {
      // Configuraciones de paginación
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: page && limit ? (parseInt(page, 10) - 1) * parseInt(limit, 10) : undefined,

      where: {}, // Objeto donde se pueden añadir filtros de Sequelize
    };

    // Añadir filtro por estado si se provee
    if (estado === "true") {
      opcionesDeFiltro.where.estado = true;
    } else if (estado === "false") {
      opcionesDeFiltro.where.estado = false;
    }

    // Añadir lógica de búsqueda si se provee un término 'search'
    if (search) {
      const searchTerm = search.toLowerCase();
      // Usamos el operador OR de Sequelize para buscar en múltiples campos
      opcionesDeFiltro.where[db.Sequelize.Op.or] = [
        { nombre: { [db.Sequelize.Op.like]: `%${searchTerm}%` } },
        { apellido: { [db.Sequelize.Op.like]: `%${searchTerm}%` } },
        { correo: { [db.Sequelize.Op.like]: `%${searchTerm}%` } },
        { telefono: { [db.Sequelize.Op.like]: `%${searchTerm}%` } },
        { numeroDocumento: { [db.Sequelize.Op.like]: `%${searchTerm}%` } },
      ];
    }
    const { totalItems, clientes, currentPage, totalPages } = await clienteService.obtenerTodosLosClientes(
      opcionesDeFiltro
    );

    res.status(200).json({
      success: true,
      message: "Clientes obtenidos exitosamente.",
      data: clientes,
      pagination: {
        totalItems,
        currentPage,
        totalPages,
        itemsPerPage: opcionesDeFiltro.limit,
      },
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
 * Cambia el estado (activo/inactivo) de un cliente.
 */
const cambiarEstadoCliente = async (req, res, next) => {
  try {
    const { idCliente } = req.params;
    const { estado } = req.body; // Se espera un booleano

    const clienteActualizado = await clienteService.cambiarEstadoCliente(
      Number(idCliente),
      estado
    );
    res.status(200).json({
      success: true,
      message: `Estado del cliente ID ${idCliente} cambiado a ${estado} exitosamente.`,
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
    res.status(204).send(); // 204 No Content para eliminación exitosa
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene todos los clientes (sin paginación, para selects, etc).
 */
const obtenerTodosLosClientes = async (req, res, next) => {
  try {
    const clientes = await clienteService.obtenerTodosLosClientes();
    res.status(200).json({
      success: true,
      message: "Todos los clientes obtenidos exitosamente.",
      data: clientes,
    });
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
  cambiarEstadoCliente,
  obtenerTodosLosClientes,
};