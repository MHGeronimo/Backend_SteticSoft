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
        // Para el estado, si es booleano, buscamos por las palabras "activo" o "inactivo"
        // Esto asume que 'estado' es un BOOLEAN en la DB y necesitamos mapearlo para la búsqueda por texto
        // Si tu DB guarda "Activo"/"Inactivo" como strings, esto debería ser más directo.
        // Aquí asumimos BOOLEAN y mapeamos 'true' -> 'activo', 'false' -> 'inactivo'
        // NOTA: La búsqueda por estado en el backend puede ser un poco tricky con `LIKE` si el campo es BOOLEAN.
        // Lo ideal sería un filtro separado para el estado si quieres precisión.
        // Para una búsqueda tipo "fuzzy" por "activo" o "inactivo" en un campo BOOLEAN,
        // tendríamos que hacer un poco más de magia o cargar los datos y filtrarlos después
        // o añadir un campo virtual en el modelo.
        // Por simplicidad y eficiencia, mantengamos la búsqueda de estado manejada por el `if (estado === "true")` de arriba.
        // La búsqueda general (`search`) se enfocará en los campos de texto.
      ];
    }
    // Si quieres que la búsqueda por 'estado' también sea parte del `search` genérico,
    // tendrías que adaptar tu modelo de Cliente para tener un campo "virtual" o una forma
    // de que el "estado" booleano se convierta a "activo"/"inactivo" en la consulta SQL.
    // Por ahora, el filtro de `estado` de `req.query.estado` y el `search` son complementarios.

    // Llamar al servicio con las nuevas opciones de filtro y paginación
    // El servicio `obtenerTodosLosClientes` ya está diseñado para recibir un objeto `where`.
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

module.exports = {
  crearCliente,
  listarClientes,
  obtenerClientePorId,
  actualizarCliente,
  anularCliente,
  habilitarCliente,
  eliminarClienteFisico,
  cambiarEstadoCliente,
};