// src/services/servicio.service.js
const db = require("../models");
const { Op } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors");
const { deleteImage, getPublicIdFromUrl } = require("../config/cloudinary.config.js");

/**
 * Crea un nuevo servicio. Gestiona la URL de la imagen de Cloudinary.
 * @param {object} datosServicio - Datos del servicio, incluyendo la URL de la imagen si se subió.
 * @returns {Promise<object>} El servicio recién creado.
 */
const crearServicio = async (datosServicio) => {
  const { nombre, precio, idCategoriaServicio, descripcion, imagen } = datosServicio;

  const servicioExistente = await db.Servicio.findOne({ where: { nombre } });
  if (servicioExistente) {
    // Si la creación falla porque el nombre ya existe, y se subió una imagen,
    // debemos eliminarla de Cloudinary para no dejar archivos huérfanos.
    if (imagen) {
      await deleteImage(getPublicIdFromUrl(imagen));
    }
    throw new ConflictError(`El servicio con el nombre '${nombre}' ya existe.`);
  }

  const categoriaServicio = await db.CategoriaServicio.findByPk(idCategoriaServicio);
  if (!categoriaServicio || !categoriaServicio.estado) {
    if (imagen) {
      await deleteImage(getPublicIdFromUrl(imagen));
    }
    throw new BadRequestError("La categoría de servicio no existe o no está activa.");
  }

  try {
    const servicioParaCrear = {
      nombre: nombre.trim(),
      descripcion: descripcion || null,
      precio: parseFloat(precio),
      idCategoriaServicio: parseInt(idCategoriaServicio),
      imagen: imagen || null, // Guarda la URL de Cloudinary
      estado: true
    };
    return await db.Servicio.create(servicioParaCrear);
  } catch (error) {
    console.error("Error al crear el servicio en la base de datos:", error);
    throw new CustomError(`Error en el servidor al crear el servicio: ${error.message}`, 500);
  }
};

/**
 * Obtiene todos los servicios con filtros opcionales.
 * @param {object} opcionesDeFiltro - Opciones para filtrar y buscar.
 * @returns {Promise<Array<object>>} Lista de servicios.
 */
const obtenerTodosLosServicios = async (opcionesDeFiltro = {}) => {
  const { busqueda, estado, idCategoriaServicio } = opcionesDeFiltro;
  const whereClause = {};

  if (estado === "true" || estado === "Activo") {
    whereClause.estado = true;
  } else if (estado === "false" || estado === "Inactivo") {
    whereClause.estado = false;
  }

  if (idCategoriaServicio) {
    // ✅ CORRECCIÓN: Usar el nombre del campo del modelo (camelCase)
    whereClause.idCategoriaServicio = idCategoriaServicio;
  }

  if (busqueda) {
    whereClause[Op.or] = [
      { nombre: { [Op.iLike]: `%${busqueda}%` } },
    ];
  }

  try {
    return await db.Servicio.findAll({
      where: whereClause,
      include: [{
        model: db.CategoriaServicio,
        as: "categoria",
        attributes: ["idCategoriaServicio", "nombre"],
      }],
      order: [["nombre", "ASC"]],
    });
  } catch (error) {
    console.error("Error al obtener todos los servicios:", error);
    throw new CustomError(`Error al obtener servicios: ${error.message}`, 500);
  }
};

/**
 * Obtiene solo los servicios activos.
 * @returns {Promise<Array<object>>}
 */
const obtenerServiciosDisponibles = async () => {
    return await obtenerTodosLosServicios({ estado: "true" });
};

/**
 * Obtiene un servicio por su ID.
 * @param {number} idServicio
 * @returns {Promise<object>} El servicio encontrado.
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
 * Actualiza un servicio. Si se provee una nueva imagen, elimina la anterior de Cloudinary.
 * @param {number} idServicio
 * @param {object} datosActualizar
 * @returns {Promise<object>} El servicio actualizado.
 */
const actualizarServicio = async (idServicio, datosActualizar) => {
    const servicio = await db.Servicio.findByPk(idServicio);
    if (!servicio) {
        if (datosActualizar.imagen) {
            await deleteImage(getPublicIdFromUrl(datosActualizar.imagen));
        }
        throw new NotFoundError("Servicio no encontrado para actualizar.");
    }

    const imagenAntigua = servicio.imagen; // Guardamos la URL de la imagen antigua

    if (datosActualizar.nombre) {
        const existeNombre = await db.Servicio.findOne({
          where: { nombre: datosActualizar.nombre, idServicio: { [Op.ne]: idServicio } },
        });
        if (existeNombre) {
            throw new ConflictError("El nombre ya está en uso por otro servicio.");
        }
    }

    try {
        await servicio.update(datosActualizar);

        // Si se subió una nueva imagen (y es diferente a la anterior), borramos la antigua de Cloudinary.
        if (imagenAntigua && datosActualizar.imagen && datosActualizar.imagen !== imagenAntigua) {
            await deleteImage(getPublicIdFromUrl(imagenAntigua));
        }

        // Si se envió explícitamente la imagen como null, es para eliminarla.
        if (imagenAntigua && datosActualizar.imagen === null) {
            await deleteImage(getPublicIdFromUrl(imagenAntigua));
        }

        return await obtenerServicioPorId(idServicio);
    } catch (error) {
        console.error("Error al actualizar el servicio:", error);
        throw new CustomError(`Error en el servidor al actualizar: ${error.message}`, 500);
    }
};

/**
 * Cambia el estado (activo/inactivo) de un servicio.
 * @param {number} idServicio
 * @param {boolean} estado
 * @returns {Promise<object>}
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
 * Elimina un servicio físicamente y su imagen asociada de Cloudinary.
 * @param {number} idServicio
 * @returns {Promise<object>}
 */
const eliminarServicioFisico = async (idServicio) => {
    const servicio = await db.Servicio.findByPk(idServicio);
    if (!servicio) {
        throw new NotFoundError("Servicio no encontrado.");
    }

    const citasAsociadas = await servicio.countCitas();
    if (citasAsociadas > 0) {
        throw new BadRequestError("No se puede eliminar porque está asociado a citas.");
    }

    const imagenParaEliminar = servicio.imagen;

    await servicio.destroy();

    // Si había una imagen, la eliminamos de Cloudinary después de borrar el registro
    if (imagenParaEliminar) {
        await deleteImage(getPublicIdFromUrl(imagenParaEliminar));
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
  obtenerServiciosDisponibles,
};

