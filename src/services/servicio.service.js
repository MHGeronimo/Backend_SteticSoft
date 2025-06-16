// src/services/servicio.service.js
const db = require("../models");
const { Op } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors");

/**
 * Helper interno para cambiar el estado de un servicio.
 * @param {number} idServicio - ID del servicio.
 * @param {boolean} nuevoEstado - El nuevo estado (true para habilitar, false para anular).
 * @returns {Promise<object>} El servicio con el estado cambiado.
 */
const cambiarEstadoServicio = async (idServicio, nuevoEstado) => {
  const servicio = await db.Servicio.findByPk(idServicio);
  if (!servicio) {
    throw new NotFoundError("Servicio no encontrado para cambiar estado.");
  }
  if (servicio.estado === nuevoEstado) {
    return servicio; // Ya está en el estado deseado
  }
  await servicio.update({ estado: nuevoEstado });
  return servicio;
};

/**
 * Crear un nuevo servicio.
 */
const crearServicio = async (datosServicio) => {
  const {
    nombre,
    descripcion,
    precio,
    duracionEstimada, // Este es el nombre en el DTO/entrada
    estado,
    categoriaServicioId,
    especialidadId,
  } = datosServicio;

  const servicioExistente = await db.Servicio.findOne({ where: { nombre } });
  if (servicioExistente) {
    throw new ConflictError(`El servicio con el nombre '${nombre}' ya existe.`);
  }

  const categoriaServicio = await db.CategoriaServicio.findOne({
    where: { idCategoriaServicio: categoriaServicioId, estado: true },
  });
  if (!categoriaServicio) {
    throw new BadRequestError(
      `La categoría de servicio con ID ${categoriaServicioId} no existe o no está activa.`
    );
  }

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
    const servicioParaCrear = {
      nombre,
      descripcion: descripcion || null,
      precio: parseFloat(precio).toFixed(2),
      duracionEstimadaMin: // Corregido: Mapeo a duracionEstimadaMin del modelo
        datosServicio.duracionEstimada !== undefined ? Number(datosServicio.duracionEstimada) : null,
      estado: typeof datosServicio.estado === "boolean" ? datosServicio.estado : true,
      idCategoriaServicio: datosServicio.idCategoriaServicio, // Aseguramos que usamos el nombre correcto del campo FK
      idEspecialidad: datosServicio.idEspecialidad || null, // Aseguramos que usamos el nombre correcto del campo FK
    };

    if (datosServicio.imagen) {
      servicioParaCrear.imagen = datosServicio.imagen;
    }

    // Corrección de nombres de campos FK que se usan en el modelo y BD.
    // El modelo Servicio usa 'idCategoriaServicio' y 'idEspecialidad'
    // pero datosServicio podría venir con 'categoriaServicioId' y 'especialidadId'
    // Esto ya se maneja arriba al asignar a servicioParaCrear.idCategoriaServicio y servicioParaCrear.idEspecialidad

    // Aseguramos que categoriaServicioId y especialidadId se mapean correctamente a los campos del modelo
    // que son idCategoriaServicio y idEspecialidad respectivamente.
    // La validación de existencia de CategoriaServicio y Especialidad ya usa
    // datosServicio.categoriaServicioId y datosServicio.especialidadId.
    // Lo importante es que el objeto final para .create() use los nombres de campo del modelo.

    // El objeto servicioParaCrear ahora usa idCategoriaServicio y idEspecialidad.
    // Las validaciones previas usan categoriaServicioId y especialidadId.
    // Vamos a unificar esto para claridad, usando los nombres de campo del modelo en el objeto final.
    // La validación de categoriaServicioId se hizo con datosServicio.categoriaServicioId
    // La validación de especialidadId se hizo con datosServicio.especialidadId

    // Re-asignación para asegurar que los campos correctos del modelo son usados
    // y que los valores vienen de los datos de entrada correctos.
    servicioParaCrear.idCategoriaServicio = datosServicio.categoriaServicioId;
    if (datosServicio.especialidadId) {
      servicioParaCrear.idEspecialidad = datosServicio.especialidadId;
    } else {
      delete servicioParaCrear.idEspecialidad; // Si no hay especialidadId, no lo incluimos o lo ponemos null
    }


    const nuevoServicio = await db.Servicio.create(servicioParaCrear);
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
 */
const obtenerTodosLosServicios = async (opcionesDeFiltro = {}) => {
  const whereClause = { ...opcionesDeFiltro };
  try {
    return await db.Servicio.findAll({
      where: whereClause,
      include: [
        {
          model: db.CategoriaServicio,
          as: "categoria", // Corregido: 'categoria' es el alias en Servicio.model.js
          attributes: ["idCategoriaServicio", "nombre"],
        },
        {
          model: db.Especialidad,
          as: "especialidad", // Corregido: 'especialidad' es el alias en Servicio.model.js
          attributes: ["idEspecialidad", "nombre"],
          required: false,
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
 */
const obtenerServicioPorId = async (idServicio) => {
  try {
    const servicio = await db.Servicio.findByPk(idServicio, {
      include: [
        { model: db.CategoriaServicio, as: "categoria" }, // Corregido
        {
          model: db.Especialidad,
          as: "especialidad", // Corregido
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

    if (
      datosActualizar.hasOwnProperty("precio") &&
      datosActualizar.precio !== null
    ) {
      datosActualizar.precio = parseFloat(datosActualizar.precio).toFixed(2);
    }
    if (
      datosActualizar.hasOwnProperty("duracionEstimada") && // Propiedad de entrada
      datosActualizar.duracionEstimada !== null
    ) {
      datosActualizar.duracionEstimadaMin = Number( // Corregido: Mapeo a duracionEstimadaMin del modelo
        datosActualizar.duracionEstimada
      );
      delete datosActualizar.duracionEstimada; // Eliminar la propiedad original para evitar errores
    }

    await servicio.update(datosActualizar);
    return obtenerServicioPorId(servicio.idServicio);
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
    return await cambiarEstadoServicio(idServicio, false);
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
    return await cambiarEstadoServicio(idServicio, true);
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
  cambiarEstadoServicio, // Exportar la nueva función
};