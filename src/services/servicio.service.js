// src/services/servicio.service.js
const db = require("../models");
const { Op } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors"); // Ajusta la ruta

/**
 * Crear un nuevo servicio.
 * @param {object} datosServicio - Datos del servicio.
 * @returns {Promise<object>} El servicio creado.
 */
const crearServicio = async (datosServicio) => {
  const {
    nombre,
    descripcion,
    precio,
    duracionEstimada, // Esperando camelCase
    estado,
    categoriaServicioId, // Esperando camelCase
    especialidadId, // Esperando camelCase
  } = datosServicio;

  // Validación de unicidad de nombre (el validador ya lo hace, pero es bueno como doble check)
  const servicioExistente = await db.Servicio.findOne({ where: { nombre } });
  if (servicioExistente) {
    throw new ConflictError(`El servicio con el nombre '${nombre}' ya existe.`);
  }

  // Verificar que la categoría de servicio exista y esté activa
  const categoriaServicio = await db.CategoriaServicio.findOne({
    where: { idCategoriaServicio: categoriaServicioId, estado: true },
  });
  if (!categoriaServicio) {
    throw new BadRequestError(
      `La categoría de servicio con ID ${categoriaServicioId} no existe o no está activa.`
    );
  }

  // Verificar que la especialidad exista y esté activa (si se proporciona)
  if (especialidadId) {
    const especialidad = await db.Especialidad.findOne({
      where: { idEspecialidad: especialidadId, estado: true },
    });
    if (!especialidad) {
      throw new BadRequestError(
        `La especialidad con ID ${especialidadId} no existe o no está activa.`
      );
    }
  }

  try {
    const nuevoServicio = await db.Servicio.create({
      nombre,
      descripcion: descripcion || null,
      precio: parseFloat(precio).toFixed(2), // Asegurar formato decimal
      duracionEstimada:
        duracionEstimada !== undefined ? Number(duracionEstimada) : null, // Guardar null si no se provee
      estado: typeof estado === "boolean" ? estado : true,
      categoriaServicioId, // Atributo camelCase del modelo
      especialidadId: especialidadId || null, // Atributo camelCase del modelo
    });
    return nuevoServicio;
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ConflictError(
        `El servicio con el nombre '${nombre}' ya existe.`
      );
    }
    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new BadRequestError(
        "La categoría o especialidad proporcionada no es válida."
      );
    }
    console.error(
      "Error al crear el servicio en el servicio:",
      error.message,
      error.stack
    );
    throw new CustomError(`Error al crear el servicio: ${error.message}`, 500);
  }
};

/**
 * Obtener todos los servicios.
 * @param {object} [opcionesDeFiltro={}] - Opciones para filtrar (ej. { estado: true, categoriaServicioId: 1 }).
 * @returns {Promise<Array<object>>} Lista de servicios.
 */
const obtenerTodosLosServicios = async (opcionesDeFiltro = {}) => {
  const whereClause = { ...opcionesDeFiltro };
  // El filtro por categoriaServicioId y especialidadId se pasa directamente en opcionesDeFiltro

  try {
    return await db.Servicio.findAll({
      where: whereClause,
      include: [
        {
          model: db.CategoriaServicio,
          as: "categoriaServicio", // Asegúrate que este alias coincida con tu asociación
          attributes: ["idCategoriaServicio", "nombre"],
        },
        {
          model: db.Especialidad,
          as: "especialidadRequerida", // Asegúrate que este alias coincida con tu asociación
          attributes: ["idEspecialidad", "nombre"],
          required: false, // Un servicio puede no tener especialidad (LEFT JOIN)
        },
      ],
      order: [["nombre", "ASC"]],
    });
  } catch (error) {
    console.error(
      "Error al obtener todos los servicios en el servicio:",
      error.message
    );
    throw new CustomError(`Error al obtener servicios: ${error.message}`, 500);
  }
};

/**
 * Obtener un servicio por su ID.
 * @param {number} idServicio - ID del servicio.
 * @returns {Promise<object|null>} El servicio encontrado o null si no existe.
 */
const obtenerServicioPorId = async (idServicio) => {
  try {
    const servicio = await db.Servicio.findByPk(idServicio, {
      include: [
        { model: db.CategoriaServicio, as: "categoriaServicio" },
        {
          model: db.Especialidad,
          as: "especialidadRequerida",
          required: false,
        },
      ],
    });
    if (!servicio) {
      throw new NotFoundError("Servicio no encontrado.");
    }
    return servicio;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al obtener el servicio con ID ${idServicio} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al obtener el servicio: ${error.message}`,
      500
    );
  }
};

/**
 * Actualizar un servicio existente.
 * @param {number} idServicio - ID del servicio a actualizar.
 * @param {object} datosActualizar - Datos para actualizar.
 * @returns {Promise<object>} El servicio actualizado.
 */
const actualizarServicio = async (idServicio, datosActualizar) => {
  try {
    const servicio = await db.Servicio.findByPk(idServicio);
    if (!servicio) {
      throw new NotFoundError("Servicio no encontrado para actualizar.");
    }

    const { nombre, categoriaServicioId, especialidadId } = datosActualizar;

    if (nombre && nombre !== servicio.nombre) {
      const servicioConMismoNombre = await db.Servicio.findOne({
        where: {
          nombre: nombre,
          idServicio: { [Op.ne]: idServicio },
        },
      });
      if (servicioConMismoNombre) {
        throw new ConflictError(
          `Ya existe otro servicio con el nombre '${nombre}'.`
        );
      }
    }

    if (
      categoriaServicioId &&
      categoriaServicioId !== servicio.categoriaServicioId
    ) {
      const categoria = await db.CategoriaServicio.findOne({
        where: { idCategoriaServicio: categoriaServicioId, estado: true },
      });
      if (!categoria) {
        throw new BadRequestError(
          `La nueva categoría de servicio con ID ${categoriaServicioId} no existe o no está activa.`
        );
      }
    }

    if (datosActualizar.hasOwnProperty("especialidadId")) {
      // Permite desasociar enviando null
      if (
        datosActualizar.especialidadId !== null &&
        datosActualizar.especialidadId !== undefined
      ) {
        const especialidad = await db.Especialidad.findOne({
          where: {
            idEspecialidad: datosActualizar.especialidadId,
            estado: true,
          },
        });
        if (!especialidad) {
          throw new BadRequestError(
            `La nueva especialidad con ID ${datosActualizar.especialidadId} no existe o no está activa.`
          );
        }
      }
    }

    // Si se envía precio o duracionEstimada, asegurar que sean números
    if (
      datosActualizar.hasOwnProperty("precio") &&
      datosActualizar.precio !== null
    ) {
      datosActualizar.precio = parseFloat(datosActualizar.precio).toFixed(2);
    }
    if (
      datosActualizar.hasOwnProperty("duracionEstimada") &&
      datosActualizar.duracionEstimada !== null
    ) {
      datosActualizar.duracionEstimada = Number(
        datosActualizar.duracionEstimada
      );
    }

    await servicio.update(datosActualizar);
    return obtenerServicioPorId(servicio.idServicio); // Recargar para obtener las asociaciones actualizadas
  } catch (error) {
    if (
      error instanceof NotFoundError ||
      error instanceof ConflictError ||
      error instanceof BadRequestError
    )
      throw error;
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ConflictError(
        `Ya existe otro servicio con el nombre '${datosActualizar.nombre}'.`
      );
    }
    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new BadRequestError(
        "La categoría o especialidad proporcionada para actualizar no es válida."
      );
    }
    console.error(
      `Error al actualizar el servicio con ID ${idServicio} en el servicio:`,
      error.message,
      error.stack
    );
    throw new CustomError(
      `Error al actualizar el servicio: ${error.message}`,
      500
    );
  }
};

/**
 * Anular un servicio (estado = false).
 */
const anularServicio = async (idServicio) => {
  try {
    const servicio = await db.Servicio.findByPk(idServicio);
    if (!servicio) {
      throw new NotFoundError("Servicio no encontrado para anular.");
    }
    if (!servicio.estado) {
      return servicio; // Ya está anulado
    }
    await servicio.update({ estado: false });
    return servicio;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al anular el servicio con ID ${idServicio} en el servicio:`,
      error.message
    );
    throw new CustomError(`Error al anular el servicio: ${error.message}`, 500);
  }
};

/**
 * Habilitar un servicio (estado = true).
 */
const habilitarServicio = async (idServicio) => {
  try {
    const servicio = await db.Servicio.findByPk(idServicio);
    if (!servicio) {
      throw new NotFoundError("Servicio no encontrado para habilitar.");
    }
    if (servicio.estado) {
      return servicio; // Ya está habilitado
    }
    await servicio.update({ estado: true });
    return servicio;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al habilitar el servicio con ID ${idServicio} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al habilitar el servicio: ${error.message}`,
      500
    );
  }
};

/**
 * Eliminar un servicio físicamente.
 * DDL: Categoria_servicio_idCategoriaServicio ON DELETE RESTRICT
 * DDL: Especialidad_idEspecialidad ON DELETE SET NULL
 * DDL: ServicioXCita.Servicio_idServicio ON DELETE CASCADE
 * DDL: VentaXServicio.Servicio_idServicio ON DELETE RESTRICT
 */
const eliminarServicioFisico = async (idServicio) => {
  const transaction = await db.sequelize.transaction();
  try {
    const servicio = await db.Servicio.findByPk(idServicio, { transaction });
    if (!servicio) {
      await transaction.rollback();
      throw new NotFoundError(
        "Servicio no encontrado para eliminar físicamente."
      );
    }

    // Verificar si está en VentaXServicio antes de borrar (debido a ON DELETE RESTRICT)
    const ventasConEsteServicio = await db.VentaXServicio.count({
      where: { servicioId: idServicio },
      transaction,
    });
    if (ventasConEsteServicio > 0) {
      await transaction.rollback();
      throw new ConflictError(
        `No se puede eliminar el servicio '${servicio.nombre}' porque está asociado a ${ventasConEsteServicio} venta(s).`
      );
    }

    // Los registros en ServicioXCita se eliminarán en cascada por la BD.
    // La FK a CategoriaServicio tiene ON DELETE RESTRICT, la BD lo impedirá si hay un servicio asociado.
    // Esta verificación es una capa adicional, pero la BD es la última palabra.
    // Sin embargo, al eliminar el servicio, la FK de CategoriaServicio no es problema, es al revés:
    // no se puede borrar una CategoriaServicio si tiene Servicios.

    const filasEliminadas = await db.Servicio.destroy({
      where: { idServicio },
      transaction,
    });
    await transaction.commit();
    return filasEliminadas;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError || error instanceof ConflictError)
      throw error;
    if (error.name === "SequelizeForeignKeyConstraintError") {
      // Este error podría surgir por la FK de CategoriaServicio si intentáramos borrar la categoría
      // o por VentaXServicio si la verificación previa falló.
      throw new ConflictError(
        "No se puede eliminar el servicio porque está siendo referenciado y protegido por una restricción de clave foránea."
      );
    }
    console.error(
      `Error al eliminar físicamente el servicio con ID ${idServicio} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al eliminar físicamente el servicio: ${error.message}`,
      500
    );
  }
};

module.exports = {
  crearServicio,
  obtenerTodosLosServicios,
  obtenerServicioPorId,
  actualizarServicio,
  anularServicio,
  habilitarServicio,
  eliminarServicioFisico,
};
