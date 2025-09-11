// src/services/servicio.service.js
const db = require("../models");
const { Op, Sequelize } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors");

// ✅ MEJORA: Importar los helpers de Cloudinary para poder eliminar imágenes.
const { deleteImage, getPublicIdFromUrl } = require("../config/cloudinary.config.js");


const crearServicio = async (datosServicio) => {
  const { nombre, precio, idCategoriaServicio, descripcion, imagen } = datosServicio;
  
  const servicioExistente = await db.Servicio.findOne({ where: { nombre } });
  if (servicioExistente) {
    // Si la creación falla porque el nombre ya existe, y se subió una imagen,
    // debemos eliminarla de Cloudinary para no dejar archivos huérfanos.
    if (imagen) {
      const publicId = getPublicIdFromUrl(imagen);
      if (publicId) await deleteImage(publicId);
    }
    throw new ConflictError(`El servicio con el nombre '${nombre}' ya existe.`);
  }

  const categoriaServicio = await db.CategoriaServicio.findByPk(idCategoriaServicio);
  if (!categoriaServicio || !categoriaServicio.estado) {
    if (imagen) {
      const publicId = getPublicIdFromUrl(imagen);
      if (publicId) await deleteImage(publicId);
    }
    throw new BadRequestError("La categoría de servicio no existe o no está activa.");
  }

  try {
    const servicioParaCrear = {
      nombre: nombre.trim(),
      descripcion: descripcion || null,
      precio: parseFloat(precio).toFixed(2),
      idCategoriaServicio: parseInt(idCategoriaServicio),
      imagen: imagen, // Se guarda la URL segura de Cloudinary
      estado: true
    };

    return await db.Servicio.create(servicioParaCrear);
  } catch (error) {
    console.error("Error al crear el servicio:", error);
    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new BadRequestError("La categoría proporcionada no es válida.");
    }
    if (error.name === "SequelizeValidationError") {
      throw new BadRequestError("Datos de servicio inválidos.");
    }
    throw new CustomError(`Error en el servidor al crear el servicio: ${error.message}`, 500);
  }
};

const obtenerTodosLosServicios = async (opcionesDeFiltro = {}) => {
  const { busqueda, estado, idCategoriaServicio } = opcionesDeFiltro;
  const whereClause = {};

  if (estado === "true" || estado === "false") {
    whereClause.estado = estado === "true";
  } else if (estado === "Activo") {
    whereClause.estado = true;
  } else if (estado === "Inactivo") {
    whereClause.estado = false;
  }

  if (idCategoriaServicio) {
    // Corregido para usar el nombre de campo del modelo (camelCase)
    whereClause.idCategoriaServicio = idCategoriaServicio;
  }

  if (busqueda) {
    whereClause[Op.or] = [
      { nombre: { [Op.iLike]: `%${busqueda}%` } },
      Sequelize.where(Sequelize.cast(Sequelize.col("Servicio.precio"), "text"), {
        [Op.iLike]: `%${busqueda}%`,
      }),
    ];
  }

  try {
    return await db.Servicio.findAll({
      where: whereClause,
      include: [{
        model: db.CategoriaServicio,
        as: "categoria",
        attributes: ["idCategoriaServicio", "nombre", "estado"],
      }],
      order: [["nombre", "ASC"]],
    });
  } catch (error) {
    console.error("Error al obtener todos los servicios:", error);
    throw new CustomError(`Error al obtener servicios: ${error.message}`, 500);
  }
};

const obtenerServiciosDisponibles = async () => {
    return await obtenerTodosLosServicios({ estado: "true" });
};

const obtenerServicioPorId = async (idServicio) => {
    const servicio = await db.Servicio.findByPk(idServicio, {
        include: [{ model: db.CategoriaServicio, as: "categoria" }],
    });
    if (!servicio) {
        throw new NotFoundError("Servicio no encontrado.");
    }
    return servicio;
};

const actualizarServicio = async (idServicio, datosActualizar) => {
    const servicio = await db.Servicio.findByPk(idServicio);
    if (!servicio) {
        // Si el servicio no existe pero se subió una imagen, la eliminamos.
        if (datosActualizar.imagen) {
            const publicId = getPublicIdFromUrl(datosActualizar.imagen);
            if (publicId) await deleteImage(publicId);
        }
        throw new NotFoundError("Servicio no encontrado para actualizar.");
    }

    // Guardamos la URL de la imagen antigua ANTES de actualizar
    const imagenAntigua = servicio.imagen;

    if (datosActualizar.nombre) {
        const existeNombre = await db.Servicio.findOne({
            where: { nombre: datosActualizar.nombre, idServicio: { [Op.ne]: idServicio } },
        });
        if (existeNombre) {
            throw new ConflictError("El nombre ya está en uso por otro servicio.");
        }
    }
    if (datosActualizar.precio !== undefined) {
        datosActualizar.precio = parseFloat(datosActualizar.precio);
    }
    try {
        await servicio.update(datosActualizar);

        // ✅ MEJORA: Si se subió una nueva imagen y es diferente a la anterior,
        // eliminamos la antigua de Cloudinary.
        if (imagenAntigua && datosActualizar.imagen && imagenAntigua !== datosActualizar.imagen) {
            const publicIdAntiguo = getPublicIdFromUrl(imagenAntigua);
            if (publicIdAntiguo) {
                await deleteImage(publicIdAntiguo);
            }
        }

        return await obtenerServicioPorId(idServicio);
    } catch (error) {
        console.error("Error al actualizar el servicio:", error);
        throw new CustomError(`Error en el servidor al actualizar: ${error.message}`, 500);
    }
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
    const citasAsociadas = await servicio.countCitas();
    if (citasAsociadas > 0) {
        throw new BadRequestError("No se puede eliminar porque está asociado a citas.");
    }

    // ✅ MEJORA: Antes de eliminar de la BD, si hay una imagen, la eliminamos de Cloudinary.
    if (servicio.imagen) {
        const publicId = getPublicIdFromUrl(servicio.imagen);
        if (publicId) {
            await deleteImage(publicId);
        }
    }

    await servicio.destroy();
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

