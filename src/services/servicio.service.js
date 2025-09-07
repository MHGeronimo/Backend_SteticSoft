// src/services/servicio.service.js
const db = require("../models");
const { Op, Sequelize } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors");
const fs = require("fs");
const path = require("path");

// ... (las funciones crearServicio, obtenerServicioPorId, etc., se mantienen como estaban)

const crearServicio = async (datosServicio) => {
  const { nombre, precio, idCategoriaServicio, descripcion, imagenUrl } = datosServicio;
  const servicioExistente = await db.Servicio.findOne({ where: { nombre } });
  if (servicioExistente) {
    if (imagenUrl) {
      const imagePath = path.join(__dirname, "..", "public", imagenUrl);
      fs.unlink(imagePath, (err) => { if (err) console.error(`Error al eliminar imagen huérfana:`, err); });
    }
    throw new ConflictError(`El servicio con el nombre '${nombre}' ya existe.`);
  }
  const categoriaServicio = await db.CategoriaServicio.findByPk(idCategoriaServicio);
  if (!categoriaServicio || !categoriaServicio.estado) {
    throw new BadRequestError("La categoría de servicio no existe o no está activa.");
  }
  try {
    const servicioParaCrear = {
      nombre,
      descripcion: descripcion || null,
      precio: parseFloat(precio),
      idCategoriaServicio,
      imagenUrl: imagenUrl || null,
    };
    return await db.Servicio.create(servicioParaCrear);
  } catch (error) {
    console.error("Error al crear el servicio:", error);
    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new BadRequestError("La categoría proporcionada no es válida.");
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
    whereClause.idCategoriaServicio = idCategoriaServicio;
  }

  if (busqueda) {
    whereClause[Op.or] = [
      { nombre: { [Op.iLike]: `%${busqueda}%` } },
      Sequelize.where(Sequelize.cast(Sequelize.col("precio"), "text"), {
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

/**
 * ✅ NUEVA FUNCIÓN: Obtiene solo los servicios activos (estado=true).
 * Reutiliza la función existente para mantener el código limpio.
 */
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
        if (datosActualizar.imagenUrl) {
            const imagePath = path.join(__dirname, "..", "public", datosActualizar.imagenUrl);
            fs.unlink(imagePath, (err) => { if (err) console.error(`Error al eliminar imagen:`, err); });
        }
        throw new NotFoundError("Servicio no encontrado para actualizar.");
    }
    const oldImageUrl = servicio.imagenUrl;
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
        if (oldImageUrl && datosActualizar.imagenUrl !== oldImageUrl) {
            const oldImagePath = path.join(__dirname, "..", "public", oldImageUrl);
            fs.unlink(oldImagePath, (err) => { if (err) console.error(`Error al eliminar imagen antigua:`, err); });
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
    const imageUrl = servicio.imagenUrl;
    await servicio.destroy();
    if (imageUrl) {
        const imagePath = path.join(__dirname, "..", "public", imageUrl);
        fs.unlink(imagePath, (err) => { if (err) console.error(`Error al eliminar imagen:`, err); });
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
  obtenerServiciosDisponibles, // ✅ Exportar la nueva función
};
