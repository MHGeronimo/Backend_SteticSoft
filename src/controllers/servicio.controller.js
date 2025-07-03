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
  // 1. Verificaciones previas
  const { nombre, categoriaServicioId } = datosServicio;

  const servicioExistente = await db.Servicio.findOne({ where: { nombre } });
  if (servicioExistente) {
    throw new ConflictError(`El servicio con el nombre '${nombre}' ya existe.`);
  }

  const categoriaServicio = await db.CategoriaServicio.findByPk(categoriaServicioId);
  if (!categoriaServicio || !categoriaServicio.estado) {
    throw new BadRequestError(`La categoría de servicio especificada no existe o no está activa.`);
  }

  // 2. Construcción del objeto a crear de forma limpia
  try {
    const servicioParaCrear = {
      nombre: datosServicio.nombre,
      descripcion: datosServicio.descripcion || null,
      precio: parseFloat(datosServicio.precio),
      // Mapeo directo del nombre del frontend al nombre del modelo/BD
      duracionEstimadaMin: datosServicio.duracionEstimada ? Number(datosServicio.duracionEstimada) : null,
      // Se usa el nombre de campo correcto que espera el modelo de Sequelize
      idCategoriaServicio: datosServicio.categoriaServicioId,
      // El campo 'imagen' se añade solo si existe en los datos de entrada
      ...(datosServicio.imagen && { imagen: datosServicio.imagen }),
    };

    const nuevoServicio = await db.Servicio.create(servicioParaCrear);
    return nuevoServicio;

  } catch (error) {
    console.error("Error al crear el servicio en la base de datos:", error);
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      throw new BadRequestError("La categoría proporcionada no es válida.");
    }
    throw new CustomError(`Error en el servidor al crear el servicio: ${error.message}`, 500);
  }
};

/**
 * Obtener todos los servicios con filtros y búsqueda.
 */
const obtenerTodosLosServicios = async (opcionesDeFiltro = {}) => {
  const { busqueda, estado, categoriaServicioId } = opcionesDeFiltro;
  
  const whereClause = {};

  if (estado === 'true' || estado === 'false') {
    whereClause.estado = estado === 'true';
  }
  if (categoriaServicioId) {
    whereClause.idCategoriaServicio = categoriaServicioId;
  }
  if (busqueda) {
    whereClause[Op.or] = [
      { nombre: { [Op.iLike]: `%${busqueda}%` } },
      { descripcion: { [Op.iLike]: `%${busqueda}%` } },
      db.where(db.cast(db.col('precio'), 'text'), { [Op.iLike]: `%${busqueda}%` })
    ];
  }

  try {
    const servicios = await db.Servicio.findAll({
      where: whereClause,
      include: [{ model: db.CategoriaServicio, as: "categoria", attributes: ["nombre"] }],
      order: [["nombre", "ASC"]],
    });
    // El servicio devuelve directamente los datos. El controlador se encarga de la respuesta JSON.
    return servicios;
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

  // Mapea correctamente 'duracionEstimada' a 'duracionEstimadaMin'
  if (datosActualizar.hasOwnProperty('duracionEstimada')) {
    datosActualizar.duracionEstimadaMin = datosActualizar.duracionEstimada ? Number(datosActualizar.duracionEstimada) : null;
    delete datosActualizar.duracionEstimada; // Elimina el campo original para no confundir a Sequelize
  }

  try {
    await servicio.update(datosActualizar);
    return await obtenerServicioPorId(idServicio);
  } catch (error) {
    console.error("Error al actualizar el servicio en la BD:", error);
    throw new CustomError(`Error en el servidor al actualizar: ${error.message}`, 500);
  }
};

const obtenerServicioPorId = async (idServicio) => {
  const servicio = await db.Servicio.findByPk(idServicio, {
    include: [{ model: db.CategoriaServicio, as: "categoria" }],
  });
  if (!servicio) throw new NotFoundError("Servicio no encontrado.");
  return servicio;
};

const cambiarEstadoServicio = async (idServicio, estado) => {
    const servicio = await db.Servicio.findByPk(idServicio);
    if (!servicio) throw new NotFoundError("Servicio no encontrado.");
    await servicio.update({ estado });
    return servicio;
};

const eliminarServicioFisico = async (idServicio) => {
    const servicio = await db.Servicio.findByPk(idServicio);
    if (!servicio) throw new NotFoundError("Servicio no encontrado.");
    await servicio.destroy();
};

module.exports = {
  crearServicio,
  obtenerTodosLosServicios,
  obtenerServicioPorId,
  actualizarServicio,
  cambiarEstadoServicio,
  eliminarServicioFisico
};
