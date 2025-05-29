// src/services/cliente.service.js
const db = require("../models");
const { Op } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors");

/**
 * Helper interno para cambiar el estado de un cliente.
 * @param {number} idCliente - ID del cliente.
 * @param {boolean} nuevoEstado - El nuevo estado (true para habilitar, false para anular).
 * @returns {Promise<object>} El cliente con el estado cambiado.
 */
const cambiarEstadoCliente = async (idCliente, nuevoEstado) => {
  const cliente = await db.Cliente.findByPk(idCliente);
  if (!cliente) {
    throw new NotFoundError("Cliente no encontrado para cambiar estado.");
  }
  if (cliente.estado === nuevoEstado) {
    return cliente; // Ya está en el estado deseado
  }
  await cliente.update({ estado: nuevoEstado });
  return cliente;
};

/**
 * Crear un nuevo cliente.
 */
const crearCliente = async (datosCliente) => {
  const {
    nombre,
    apellido,
    correo,
    telefono,
    tipoDocumento,
    numeroDocumento,
    fechaNacimiento,
    idUsuario, 
    estado,
  } = datosCliente;

  let clienteExistente = await db.Cliente.findOne({
    where: { numeroDocumento },
  });
  if (clienteExistente) {
    throw new ConflictError(
      `El número de documento '${numeroDocumento}' ya está registrado para otro cliente.`
    );
  }

  if (correo) {
    clienteExistente = await db.Cliente.findOne({ where: { correo } });
    if (clienteExistente) {
      throw new ConflictError(
        `El correo electrónico '${correo}' ya está registrado para otro cliente.`
      );
    }
  }

  if (idUsuario) {
    const usuario = await db.Usuario.findByPk(idUsuario);
    if (!usuario) {
      throw new BadRequestError(`El usuario con ID ${idUsuario} no existe.`);
    }
    const otroClienteConEsteUsuario = await db.Cliente.findOne({
      where: { idUsuario },
    });
    if (otroClienteConEsteUsuario) {
      throw new ConflictError(
        `El usuario con ID ${idUsuario} ya está asociado a otro cliente.`
      );
    }
  }

  try {
    const nuevoCliente = await db.Cliente.create({
      nombre,
      apellido,
      correo: correo || null,
      telefono: telefono || null,
      tipoDocumento,
      numeroDocumento,
      fechaNacimiento,
      idUsuario: idUsuario || null,
      estado: typeof estado === "boolean" ? estado : true,
    });
    return nuevoCliente;
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      const constraintField =
        error.errors && error.errors[0]
          ? error.errors[0].path
          : "un campo único";
      throw new ConflictError(
        `Ya existe un cliente con el mismo valor para '${constraintField}'.`
      );
    }
    console.error(
      "Error al crear el cliente en el servicio:",
      error.message,
      error.stack
    );
    throw new CustomError(`Error al crear el cliente: ${error.message}`, 500);
  }
};

/**
 * Obtener todos los clientes.
 */
const obtenerTodosLosClientes = async (opcionesDeFiltro = {}) => {
  try {
    const clientes = await db.Cliente.findAll({
      where: opcionesDeFiltro,
      include: [
        {
          model: db.Usuario,
          as: "usuarioCuenta",
          attributes: ["idUsuario", "correo", "estado"],
        },
      ],
      order: [
        ["apellido", "ASC"],
        ["nombre", "ASC"],
      ],
    });
    return clientes;
  } catch (error) {
    console.error(
      "Error al obtener todos los clientes en el servicio:",
      error.message
    );
    throw new CustomError(`Error al obtener clientes: ${error.message}`, 500);
  }
};

/**
 * Obtener un cliente por su ID.
 */
const obtenerClientePorId = async (idCliente) => {
  try {
    const cliente = await db.Cliente.findByPk(idCliente, {
      include: [
        {
          model: db.Usuario,
          as: "usuarioCuenta",
          attributes: ["idUsuario", "correo", "estado"],
        },
      ],
    });
    if (!cliente) {
      throw new NotFoundError("Cliente no encontrado.");
    }
    return cliente;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al obtener el cliente con ID ${idCliente} en el servicio:`,
      error.message
    );
    throw new CustomError(`Error al obtener el cliente: ${error.message}`, 500);
  }
};

/**
 * Actualizar un cliente existente.
 */
const actualizarCliente = async (idCliente, datosActualizar) => {
  try {
    const cliente = await db.Cliente.findByPk(idCliente);
    if (!cliente) {
      throw new NotFoundError("Cliente no encontrado para actualizar.");
    }

    if (
      datosActualizar.numeroDocumento &&
      datosActualizar.numeroDocumento !== cliente.numeroDocumento
    ) {
      const otroClienteConDocumento = await db.Cliente.findOne({
        where: {
          numeroDocumento: datosActualizar.numeroDocumento,
          idCliente: { [Op.ne]: idCliente },
        },
      });
      if (otroClienteConDocumento) {
        throw new ConflictError(
          `El número de documento '${datosActualizar.numeroDocumento}' ya está registrado para otro cliente.`
        );
      }
    }

    if (datosActualizar.correo && datosActualizar.correo !== cliente.correo) {
      const otroClienteConCorreo = await db.Cliente.findOne({
        where: {
          correo: datosActualizar.correo,
          idCliente: { [Op.ne]: idCliente },
        },
      });
      if (otroClienteConCorreo) {
        throw new ConflictError(
          `El correo electrónico '${datosActualizar.correo}' ya está registrado para otro cliente.`
        );
      }
    }

    if (datosActualizar.hasOwnProperty("idUsuario")) {
      if (
        datosActualizar.idUsuario !== null &&
        datosActualizar.idUsuario !== undefined
      ) {
        if (datosActualizar.idUsuario !== cliente.idUsuario) {
          const usuario = await db.Usuario.findByPk(datosActualizar.idUsuario);
          if (!usuario) {
            throw new BadRequestError(
              `El usuario con ID ${datosActualizar.idUsuario} no existe.`
            );
          }
          const otroClienteConEsteUsuario = await db.Cliente.findOne({
            where: {
              idUsuario: datosActualizar.idUsuario,
              idCliente: { [Op.ne]: idCliente },
            },
          });
          if (otroClienteConEsteUsuario) {
            throw new ConflictError(
              `El usuario con ID ${datosActualizar.idUsuario} ya está asociado a otro cliente.`
            );
          }
        }
      }
    }

    await cliente.update(datosActualizar);
    return obtenerClientePorId(cliente.idCliente);
  } catch (error) {
    if (
      error instanceof NotFoundError ||
      error instanceof ConflictError ||
      error instanceof BadRequestError
    )
      throw error;
    if (error.name === "SequelizeUniqueConstraintError") {
      const constraintField =
        error.errors && error.errors[0]
          ? error.errors[0].path
          : "un campo único";
      throw new ConflictError(
        `Ya existe un cliente con el mismo valor para '${constraintField}'.`
      );
    }
    console.error(
      `Error al actualizar el cliente con ID ${idCliente} en el servicio:`,
      error.message,
      error.stack
    );
    throw new CustomError(
      `Error al actualizar el cliente: ${error.message}`,
      500
    );
  }
};

/**
 * Anular un cliente (borrado lógico, establece estado = false).
 */
const anularCliente = async (idCliente) => {
  try {
    return await cambiarEstadoCliente(idCliente, false);
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al anular el cliente con ID ${idCliente} en el servicio:`,
      error.message
    );
    throw new CustomError(`Error al anular el cliente: ${error.message}`, 500);
  }
};

/**
 * Habilitar un cliente (cambia estado = true).
 */
const habilitarCliente = async (idCliente) => {
  try {
    return await cambiarEstadoCliente(idCliente, true);
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error(
      `Error al habilitar el cliente con ID ${idCliente} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al habilitar el cliente: ${error.message}`,
      500
    );
  }
};

/**
 * Eliminar un cliente físicamente de la base de datos.
 */
const eliminarClienteFisico = async (idCliente) => {
  try {
    const cliente = await db.Cliente.findByPk(idCliente);
    if (!cliente) {
      throw new NotFoundError(
        "Cliente no encontrado para eliminar físicamente."
      );
    }

    const filasEliminadas = await db.Cliente.destroy({
      where: { idCliente },
    });
    return filasEliminadas;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ConflictError(
        "No se puede eliminar el cliente porque está siendo referenciado de una manera que impide su borrado. Verifique las dependencias (ej. Ventas, Citas)."
      );
    }
    console.error(
      `Error al eliminar físicamente el cliente con ID ${idCliente} en el servicio:`,
      error.message
    );
    throw new CustomError(
      `Error al eliminar físicamente el cliente: ${error.message}`,
      500
    );
  }
};

module.exports = {
  crearCliente,
  obtenerTodosLosClientes,
  obtenerClientePorId,
  actualizarCliente,
  anularCliente,
  habilitarCliente,
  eliminarClienteFisico,
  cambiarEstadoCliente, // Exportar la nueva función
};