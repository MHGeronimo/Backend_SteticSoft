// src/services/cliente.service.js
const db = require("../models");
const { Op } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors"); // Ajusta la ruta

/**
 * Crear un nuevo cliente.
 * @param {object} datosCliente - Datos del cliente.
 * @returns {Promise<object>} El cliente creado.
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
    idUsuario, // Puede ser null o undefined
    estado,
  } = datosCliente;

  // Validación de unicidad de numeroDocumento (el validador ya lo hace, pero es bueno tenerlo en el servicio como doble check o por si se llama al servicio desde otro lugar)
  let clienteExistente = await db.Cliente.findOne({
    where: { numeroDocumento },
  });
  if (clienteExistente) {
    throw new ConflictError(
      `El número de documento '${numeroDocumento}' ya está registrado para otro cliente.`
    );
  }

  // Validación de unicidad de correo del cliente (si se proporciona)
  if (correo) {
    clienteExistente = await db.Cliente.findOne({ where: { correo } });
    if (clienteExistente) {
      throw new ConflictError(
        `El correo electrónico '${correo}' ya está registrado para otro cliente.`
      );
    }
  }

  // Validación de idUsuario (si se proporciona)
  if (idUsuario) {
    const usuario = await db.Usuario.findByPk(idUsuario);
    if (!usuario) {
      throw new BadRequestError(`El usuario con ID ${idUsuario} no existe.`);
    }
    // Verificar que este idUsuario no esté ya asignado a otro cliente
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
      correo: correo || null, // Guardar null si no se proporciona
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
      // Esto podría ser por numeroDocumento o correo si la validación previa falló por alguna razón (ej. condición de carrera)
      // O por idUsuario si no se verificó antes (aunque lo hicimos).
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
 * @param {object} [opcionesDeFiltro={}] - Opciones para filtrar (ej. { estado: true }).
 * @returns {Promise<Array<object>>} Lista de clientes.
 */
const obtenerTodosLosClientes = async (opcionesDeFiltro = {}) => {
  try {
    const clientes = await db.Cliente.findAll({
      where: opcionesDeFiltro,
      include: [
        {
          // Incluir información del usuario asociado, si existe
          model: db.Usuario,
          as: "usuarioCuenta", // Asegúrate que este alias coincida con tu asociación
          attributes: ["idUsuario", "correo", "estado"], // Solo los atributos necesarios
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
 * @param {number} idCliente - ID del cliente.
 * @returns {Promise<object|null>} El cliente encontrado o null si no existe.
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
 * @param {number} idCliente - ID del cliente a actualizar.
 * @param {object} datosActualizar - Datos para actualizar.
 * @returns {Promise<object>} El cliente actualizado.
 */
const actualizarCliente = async (idCliente, datosActualizar) => {
  try {
    const cliente = await db.Cliente.findByPk(idCliente);
    if (!cliente) {
      throw new NotFoundError("Cliente no encontrado para actualizar.");
    }

    // Validar unicidad de numeroDocumento si se está cambiando
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

    // Validar unicidad de correo si se está cambiando y se proporciona
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

    // Validar idUsuario si se está cambiando
    if (datosActualizar.hasOwnProperty("idUsuario")) {
      // Se quiere actualizar idUsuario (puede ser a null o un nuevo ID)
      if (
        datosActualizar.idUsuario !== null &&
        datosActualizar.idUsuario !== undefined
      ) {
        // Si se asigna un nuevo usuario
        if (datosActualizar.idUsuario !== cliente.idUsuario) {
          // Solo si es diferente al actual
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
      } else {
        // Se quiere desvincular (idUsuario = null)
        // No se necesita validación extra aquí si se permite desvincular
      }
    }

    await cliente.update(datosActualizar);
    // Recargar para obtener la información del usuario asociado si cambió idUsuario
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
    const cliente = await db.Cliente.findByPk(idCliente);
    if (!cliente) {
      throw new NotFoundError("Cliente no encontrado para anular.");
    }
    if (!cliente.estado) {
      return cliente; // Ya está anulado
    }
    await cliente.update({ estado: false });
    return cliente;
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
    const cliente = await db.Cliente.findByPk(idCliente);
    if (!cliente) {
      throw new NotFoundError("Cliente no encontrado para habilitar.");
    }
    if (cliente.estado) {
      return cliente; // Ya está habilitado
    }
    await cliente.update({ estado: true });
    return cliente;
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
 * ¡ADVERTENCIA: Esta acción es destructiva! Considerar las implicaciones.
 * (Ej. Ventas o Citas asociadas. El DDL tiene ON DELETE SET NULL para Cliente_idCliente en Venta,
 * y ON DELETE CASCADE para Cliente_idCliente en Cita)
 */
const eliminarClienteFisico = async (idCliente) => {
  try {
    const cliente = await db.Cliente.findByPk(idCliente);
    if (!cliente) {
      throw new NotFoundError(
        "Cliente no encontrado para eliminar físicamente."
      );
    }

    // Si el cliente está asociado a un usuario, la FK en Cliente.idUsuario es UNIQUE y tiene ON DELETE SET NULL.
    // La eliminación del cliente NO borra el usuario.
    // Si se borra un Cliente, las Citas asociadas se borrarán (ON DELETE CASCADE).
    // Si se borra un Cliente, el Cliente_idCliente en Ventas se pondrá a NULL (ON DELETE SET NULL).

    const filasEliminadas = await db.Cliente.destroy({
      where: { idCliente },
    });
    return filasEliminadas;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    // Un SequelizeForeignKeyConstraintError podría ocurrir si alguna otra tabla no contemplada
    // tiene una referencia a Cliente con ON DELETE RESTRICT.
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
};
