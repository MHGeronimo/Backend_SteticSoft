const db = require("../models");
const { Op, Sequelize } = require("sequelize");
const Servicio = db.Servicio;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors");

/**
 * Validadores
 */
const validarTexto = (texto, campo) => {
  if (texto === undefined || texto === null) return;

  const limpio = texto.trim();

  if (limpio.length !== texto.length) {
    throw new BadRequestError(
      `${campo} no debe tener espacios al inicio o final.`
    );
  }

  const regex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/;
  if (!regex.test(limpio)) {
    throw new BadRequestError(
      `${campo} contiene caracteres no permitidos.`
    );
  }
};

const validarPrecio = (precio) => {
  if (precio === undefined || precio === null) return;
  if (isNaN(precio) || Number(precio) < 0) {
    throw new BadRequestError("El precio debe ser un número válido y positivo.");
  }
};

/**
 * Crear un nuevo servicio
 */
const crearServicio = async (data) => {
  validarTexto(data.nombre, "Nombre");
  validarPrecio(data.precio);

  const servicio = await Servicio.create(data);
  return servicio;
};

/**
 * Obtener todos los servicios con filtros y búsqueda
 */
const obtenerTodosLosServicios = async ({ busqueda, estado, categoriaServicioId }) => {
  try {
    const where = {};

    // 🔎 Búsqueda por nombre o precio
    if (busqueda) {
      const termino = `%${busqueda.trim()}%`;
      where[Op.or] = [
        { nombre: { [Op.iLike]: termino } },
        // Convertimos precio a texto para poder buscar con LIKE
        Sequelize.where(
          Sequelize.cast(Sequelize.col("precio"), "TEXT"),
          { [Op.iLike]: termino }
        ),
      ];
    }

    // Filtro por estado (true/false)
    if (estado !== undefined) {
      where.estado = estado;
    }

    // Filtro por categoría
    if (categoriaServicioId) {
      where.categoriaServicioId = categoriaServicioId;
    }

    const servicios = await Servicio.findAll({ where });
    return servicios;
  } catch (error) {
    console.error("Error en obtenerTodosLosServicios:", error);
    throw new CustomError("No se pudieron obtener los servicios", 500);
  }
};

/**
 * Obtener un servicio por ID
 */
const obtenerServicioPorId = async (idServicio) => {
  const servicio = await Servicio.findByPk(idServicio);
  if (!servicio) {
    throw new NotFoundError("Servicio no encontrado");
  }
  return servicio;
};

/**
 * Actualizar un servicio
 */
const actualizarServicio = async (idServicio, data) => {
  validarTexto(data.nombre, "Nombre");
  validarPrecio(data.precio);

  const servicio = await Servicio.findByPk(idServicio);
  if (!servicio) {
    throw new NotFoundError("Servicio no encontrado");
  }

  await servicio.update(data);
  return servicio;
};

/**
 * Cambiar estado (activo/inactivo)
 */
const cambiarEstadoServicio = async (idServicio, estado) => {
  const servicio = await Servicio.findByPk(idServicio);
  if (!servicio) {
    throw new NotFoundError("Servicio no encontrado");
  }

  servicio.estado = estado;
  await servicio.save();
  return servicio;
};

/**
 * Eliminar servicio físicamente
 */
const eliminarServicioFisico = async (idServicio) => {
  const servicio = await Servicio.findByPk(idServicio);
  if (!servicio) {
    throw new NotFoundError("Servicio no encontrado");
  }

  await servicio.destroy();
  return true;
};

module.exports = {
  crearServicio,
  obtenerTodosLosServicios,
  obtenerServicioPorId,
  actualizarServicio,
  cambiarEstadoServicio,
  eliminarServicioFisico,
};
