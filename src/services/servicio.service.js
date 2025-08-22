const db = require("../models");
const { Op } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors");

/**
 * Crear un nuevo servicio.
 */
const crearServicio = async (datosServicio) => {
  const {
    nombre,
    precio,
    categoriaServicioId,
    descripcion,
    imagen, // La ruta de la imagen ya viene como string desde el controller
  } = datosServicio;

  // 1. Verificaciones previas
  const servicioExistente = await db.Servicio.findOne({ where: { nombre } });
  if (servicioExistente) {
    throw new ConflictError(`El servicio con el nombre '${nombre}' ya existe.`);
  }

  const categoriaServicio =
    await db.CategoriaServicio.findByPk(categoriaServicioId);
  if (!categoriaServicio || !categoriaServicio.estado) {
    throw new BadRequestError(
      `La categoría de servicio especificada no existe o no está activa.`
    );
  }

  // 2. CORRECCIÓN: Construcción del objeto a crear de forma limpia y directa
  try {
    const servicioParaCrear = {
      nombre: nombre,
      descripcion: descripcion || null,
      precio: parseFloat(precio),
      // Se usa el nombre de campo correcto que espera el modelo de Sequelize
      idCategoriaServicio: categoriaServicioId,
      // El campo 'imagen' se añade solo si existe
      ...(imagen && { imagen: imagen }),
    };

    const nuevoServicio = await db.Servicio.create(servicioParaCrear);
    return nuevoServicio;
  } catch (error) {
    // Manejo de errores de la base de datos
    console.error("Error al crear el servicio en la base de datos:", error);
    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new BadRequestError("La categoría proporcionada no es válida.");
    }
    throw new CustomError(
      `Error en el servidor al crear el servicio: ${error.message}`,
      500
    );
  }
};

/**
 * Obtener todos los servicios con filtros y búsqueda.
 */
const obtenerTodosLosServicios = async (opcionesDeFiltro = {}) => {
  const { busqueda, estado, categoriaServicioId } = opcionesDeFiltro;

  const whereClause = {};

  // Filtro por estado
  if (estado === "true" || estado === "false") {
    whereClause.estado = estado === "true";
  }
  // Filtro por categoría
  if (categoriaServicioId) {
    whereClause.idCategoriaServicio = categoriaServicioId;
  }

  // MODIFICACIÓN: Lógica para la búsqueda por texto en múltiples campos
  if (busqueda) {
    whereClause[Op.or] = [
      { nombre: { [Op.iLike]: `%${busqueda}%` } },
      { descripcion: { [Op.iLike]: `%${busqueda}%` } },
      // Para buscar por precio, hay que convertirlo a texto en la consulta
      db.where(db.cast(db.col("precio"), "text"), {
        [Op.iLike]: `%${busqueda}%`,
      }),
    ];
  }

  try {
    const servicios = await db.Servicio.findAll({
      where: whereClause,
      include: [
        {
          model: db.CategoriaServicio,
          as: "categoria",
          attributes: ["nombre"],
        },
      ],
      order: [["nombre", "ASC"]],
    });
    return servicios; // Devuelve directamente el array de servicios
  } catch (error) {
    console.error("Error al obtener todos los servicios:", error);
    throw new CustomError(`Error al obtener servicios: ${error.message}`, 500);
  }
};

/**
 * Actualiza un servicio existente.
 */
const actualizarServicio = async (idServicio, datosActualizar) => {
  const servicio = await db.Servicio.findByPk(idServicio);
  if (!servicio) {
    throw new NotFoundError("Servicio no encontrado para actualizar.");
  }

  try {
    await servicio.update(datosActualizar);
    return await obtenerServicioPorId(idServicio); // Devuelve el servicio actualizado con sus relaciones
  } catch (error) {
    console.error("Error al actualizar el servicio en la BD:", error);
    throw new CustomError(
      `Error en el servidor al actualizar: ${error.message}`,
      500
    );
  }
};

// --- OTRAS FUNCIONES (obtenerServicioPorId, cambiarEstado, etc.) ---
// Se recomienda revisar y simplificar estas funciones también si es necesario,
// pero las principales que causaban el error ya están corregidas.

const obtenerServicioPorId = async (idServicio) => {
  const servicio = await db.Servicio.findByPk(idServicio, {
    include: [{ model: db.CategoriaServicio, as: "categoria" }],
  });
  if (!servicio) {
    throw new NotFoundError("Servicio no encontrado.");
  }
  return servicio;
};

const cambiarEstadoServicio = async (idServicio, estado) => {
  const servicio = await db.Servicio.findByPk(idServicio);
  if (!servicio) {
    throw new NotFoundError("Servicio no encontrado.");
  }
  await servicio.update({ estado });
  return servicio;
};

const eliminarServicioFisico = async (idServicio) => {
  const servicio = await db.Servicio.findByPk(idServicio);
  if (!servicio) {
    throw new NotFoundError("Servicio no encontrado.");
  }
  // Añadir lógica para verificar si está asociado a ventas/citas si es necesario
  await servicio.destroy();
};

module.exports = {
  crearServicio,
  obtenerTodosLosServicios,
  obtenerServicioPorId,
  actualizarServicio,
  cambiarEstadoServicio,
  eliminarServicioFisico,
};
