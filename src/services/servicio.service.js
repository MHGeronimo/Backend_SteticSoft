// src/services/servicio.service.js
const db = require("../models");
const { Op, Sequelize } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors");

/**
 * Crear un nuevo servicio.
 */
const fs = require("fs");
const path = require("path");

const crearServicio = async (datosServicio) => {
  const { nombre, precio, idCategoriaServicio, descripcion, imagenUrl } =
    datosServicio;

  // 1. Verificaciones previas
  const servicioExistente = await db.Servicio.findOne({ where: { nombre } });
  if (servicioExistente) {
    if (imagenUrl) {
      // Si ya existe y se subió una imagen, hay que borrarla para no dejar basura.
      const imagePath = path.join(__dirname, "..", "public", imagenUrl);
      fs.unlink(imagePath, (err) => {
        if (err)
          console.error(
            `Error al eliminar imagen huérfana '${imagePath}':`,
            err
          );
      });
    }
    throw new ConflictError(`El servicio con el nombre '${nombre}' ya existe.`);
  }

  const categoriaServicio = await db.CategoriaServicio.findByPk(
    idCategoriaServicio
  );
  if (!categoriaServicio || !categoriaServicio.estado) {
    throw new BadRequestError(
      "La categoría de servicio especificada no existe o no está activa."
    );
  }

  // 2. Construcción del objeto limpio
  try {
    const servicioParaCrear = {
      nombre,
      descripcion: descripcion || null,
      precio: parseFloat(precio),
      idCategoriaServicio,
      imagenUrl: imagenUrl || null, // Guardamos la URL de la imagen
    };

    const nuevoServicio = await db.Servicio.create(servicioParaCrear);
    return nuevoServicio;
  } catch (error) {
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
  const { busqueda, estado, idCategoriaServicio } = opcionesDeFiltro;
  const whereClause = {};

  // Filtro por estado
  if (estado === "true" || estado === "false") {
    whereClause.estado = estado === "true";
  } else if (estado === "Activo") {
    whereClause.estado = true;
  } else if (estado === "Inactivo") {
    whereClause.estado = false;
  }

  // Filtro por categoría
  if (idCategoriaServicio) {
    whereClause.idCategoriaServicio = idCategoriaServicio;
  }

  // Búsqueda por texto en nombre o precio
  if (busqueda) {
    whereClause[Op.or] = [
      { nombre: { [Op.iLike]: `%${busqueda}%` } },
      Sequelize.where(Sequelize.cast(Sequelize.col("precio"), "text"), {
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
          attributes: ["idCategoriaServicio", "nombre", "estado"],
        },
      ],
      order: [["nombre", "ASC"]],
    });
    return servicios;
  } catch (error) {
    console.error("Error al obtener todos los servicios:", error);
    throw new CustomError(`Error al obtener servicios: ${error.message}`, 500);
  }
};

/**
 * Obtener un servicio por ID.
 */
const obtenerServicioPorId = async (idServicio) => {
  const servicio = await db.Servicio.findByPk(idServicio, {
    include: [{ model: db.CategoriaServicio, as: "categoria" }],
  });
  if (!servicio) {
    throw new NotFoundError("Servicio no encontrado.");
  }
  return servicio;
};

/**
 * Actualizar un servicio.
 */
const actualizarServicio = async (idServicio, datosActualizar) => {
  const servicio = await db.Servicio.findByPk(idServicio);
  if (!servicio) {
    // Si el servicio no se encuentra, y se subió una imagen, hay que borrarla.
    if (datosActualizar.imagenUrl) {
      const imagePath = path.join(
        __dirname,
        "..",
        "public",
        datosActualizar.imagenUrl
      );
      fs.unlink(imagePath, (err) => {
        if (err)
          console.error(
            `Error al eliminar imagen para servicio no encontrado '${imagePath}':`,
            err
          );
      });
    }
    throw new NotFoundError("Servicio no encontrado para actualizar.");
  }

  const oldImageUrl = servicio.imagenUrl; // Guardamos la URL de la imagen antigua

  // Validación de nombre duplicado
  if (datosActualizar.nombre) {
    const existeNombre = await db.Servicio.findOne({
      where: {
        nombre: datosActualizar.nombre,
        idServicio: { [Op.ne]: idServicio },
      },
    });
    if (existeNombre) {
      throw new ConflictError("El nombre ya está en uso por otro servicio.");
    }
  }

  // Normalización de precio
  if (datosActualizar.precio !== undefined) {
    datosActualizar.precio = parseFloat(datosActualizar.precio);
  }

  try {
    await servicio.update(datosActualizar);

    // Si se actualizó la imagen (la nueva URL es diferente a la antigua), borramos la antigua.
    if (oldImageUrl && datosActualizar.imagenUrl !== oldImageUrl) {
      const oldImagePath = path.join(__dirname, "..", "public", oldImageUrl);
      fs.unlink(oldImagePath, (err) => {
        if (err)
          console.error(
            `Error al eliminar la imagen antigua '${oldImagePath}':`,
            err
          );
      });
    }

    return await obtenerServicioPorId(idServicio);
  } catch (error) {
    console.error("Error al actualizar el servicio en la BD:", error);
    throw new CustomError(
      `Error en el servidor al actualizar: ${error.message}`,
      500
    );
  }
};

/**
 * Cambiar estado de un servicio.
 */
const cambiarEstadoServicio = async (idServicio, estado) => {
  const servicio = await db.Servicio.findByPk(idServicio);
  if (!servicio) {
    throw new NotFoundError("Servicio no encontrado.");
  }
  await servicio.update({ estado });
  return servicio;
};

/**
 * Eliminar un servicio físicamente.
 */
const eliminarServicioFisico = async (idServicio) => {
  const servicio = await db.Servicio.findByPk(idServicio, {
    include: [
      { model: db.Cita, as: "citas", through: { attributes: [] } },
      { model: db.Venta, as: "ventas", through: { attributes: [] } },
    ],
  });

  if (!servicio) {
    throw new NotFoundError("Servicio no encontrado.");
  }

  // Verificar asociaciones
  const citasAsociadas = await servicio.countCitas();
  if (citasAsociadas > 0) {
    throw new BadRequestError(
      "No se puede eliminar el servicio porque está asociado a una o más citas."
    );
  }

  const imageUrl = servicio.imagenUrl;

  // Si no hay relaciones, eliminar
  await servicio.destroy();

  // Si el servicio tenía una imagen, la eliminamos del sistema de archivos.
  if (imageUrl) {
    const imagePath = path.join(__dirname, "..", "public", imageUrl);
    fs.unlink(imagePath, (err) => {
      if (err) {
        // No bloqueamos la respuesta por esto, pero sí lo registramos.
        console.error(
          `Error al eliminar la imagen '${imagePath}' del servicio eliminado:`,
          err
        );
      }
    });
  }

  return { mensaje: "Servicio eliminado correctamente." };
};

module.exports = {
  crearServicio,
  obtenerTodosLosServicios,
  obtenerServicioPorId,
  actualizarServicio,
  cambiarEstadoServicio,
  eliminarServicioFisico,
};
