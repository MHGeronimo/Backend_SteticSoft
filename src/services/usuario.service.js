// src/services/usuario.service.js
const bcrypt = require("bcrypt");
const db = require("../models");
const { Op } = db.Sequelize;
const {
  NotFoundError,
  ConflictError,
  CustomError,
  BadRequestError,
} = require("../errors");

const saltRounds = 10;

/**
 * Helper interno para cambiar el estado de un usuario.
 * @param {number} idUsuario - ID del usuario.
 * @param {boolean} nuevoEstado - El nuevo estado (true para habilitar, false para anular).
 * @returns {Promise<object>} El usuario con el estado cambiado (sin contraseña).
 */
const cambiarEstadoUsuario = async (idUsuario, nuevoEstado) => {
  const usuario = await db.Usuario.findByPk(idUsuario);
  if (!usuario) {
    throw new NotFoundError("Usuario no encontrado para cambiar estado.");
  }
  if (usuario.estado === nuevoEstado) {
    const { contrasena: _, ...usuarioSinCambio } = usuario.toJSON();
    return usuarioSinCambio; // Ya está en el estado deseado
  }
  await usuario.update({ estado: nuevoEstado });
  const { contrasena: _, ...usuarioActualizado } = usuario.toJSON();
  return usuarioActualizado;
};

/**
 * Crea un nuevo usuario y su perfil asociado (Cliente o Empleado) si el rol lo requiere.
 * Todos los datos (para Usuario y para Perfil) deben venir en el objeto 'datosCompletosUsuario'.
 */
const crearUsuario = async (datosCompletosUsuario) => {
  // Datos para la tabla Usuario
  const { correo, contrasena, idRol, estado } = datosCompletosUsuario;

  // Datos para el perfil (Cliente o Empleado) - se extraerán del mismo objeto
  const {
    nombre,
    apellido,
    telefono,
    tipoDocumento,
    numeroDocumento,
    fechaNacimiento,
    // 'direccion' // Si decides incluirlo y manejarlo
    // 'celular' // específico para Empleado
  } = datosCompletosUsuario;

  const usuarioExistente = await db.Usuario.findOne({ where: { correo } });
  if (usuarioExistente) {
    throw new ConflictError(
      `El correo electrónico '${correo}' ya está registrado.`
    );
  }

  const rol = await db.Rol.findOne({ where: { idRol, estado: true } });
  if (!rol) {
    throw new BadRequestError(
      `El rol con ID ${idRol} no existe o no está activo.`
    );
  }

  const transaction = await db.sequelize.transaction(); // Iniciar transacción

  try {
    const contrasenaHasheada = await bcrypt.hash(contrasena, saltRounds);

    const nuevoUsuario = await db.Usuario.create({
      correo,
      contrasena: contrasenaHasheada,
      idRol,
      estado: typeof estado === "boolean" ? estado : true,
    }, { transaction });

    // Crear perfil asociado según el rol
    if (rol.nombre === "Cliente") {
      // Validación básica de campos de perfil de cliente (podría estar en validadores)
      if (!nombre || !apellido || !telefono || !tipoDocumento || !numeroDocumento || !fechaNacimiento) {
        await transaction.rollback();
        throw new BadRequestError("Faltan campos obligatorios del perfil de cliente.");
      }
       // Validar si el número de documento del cliente ya existe
      const clienteConDocumento = await db.Cliente.findOne({ where: { numeroDocumento } });
      if (clienteConDocumento) {
        await transaction.rollback();
        throw new ConflictError(`El número de documento '${numeroDocumento}' ya está registrado para un cliente.`);
      }
       // Validar si el correo del cliente ya existe (si Cliente.correo es UNIQUE)
      const clienteConCorreo = await db.Cliente.findOne({ where: { correo } }); // Asumiendo que el correo del cliente es el mismo
      if (clienteConCorreo) {
        await transaction.rollback();
        throw new ConflictError(`El correo '${correo}' ya está registrado para un perfil de cliente.`);
      }

      await db.Cliente.create({
        idUsuario: nuevoUsuario.idUsuario,
        nombre,
        apellido,
        correo, // El correo del cliente es el mismo que el del usuario
        telefono,
        tipoDocumento,
        numeroDocumento,
        fechaNacimiento,
        // direccion: datosCompletosUsuario.direccion, // Si se incluye
        estado: true, // Perfil de cliente activo por defecto
      }, { transaction });

    } else if (rol.nombre === "Empleado") {
      // Lógica similar para crear un Empleado si el rol es "Empleado"
      // Asegúrate que la tabla Empleado tenga idUsuario, los campos necesarios y las asociaciones en los modelos.
      if (!nombre || !tipoDocumento || !numeroDocumento || !fechaNacimiento /* || !datosCompletosUsuario.celular */) {
        // Ajusta los campos requeridos para Empleado
        await transaction.rollback();
        throw new BadRequestError("Faltan campos obligatorios del perfil de empleado.");
      }
      const empleadoConDocumento = await db.Empleado.findOne({ where: { numeroDocumento } });
      if (empleadoConDocumento) {
          await transaction.rollback();
          throw new ConflictError(`El número de documento '${numeroDocumento}' ya está registrado para un empleado.`);
      }
      // Aquí crearías el empleado, asegurándote que el modelo Empleado y la tabla tengan idUsuario
      await db.Empleado.create({
        idUsuario: nuevoUsuario.idUsuario,
        nombre,
        // apellido: datosCompletosUsuario.apellido, // Si Empleado también usa apellido
        tipoDocumento,
        numeroDocumento,
        fechaNacimiento,
        celular: datosCompletosUsuario.celular, // Si es específico de Empleado
        estado: true,
      }, { transaction });
    }

    await transaction.commit(); // Confirmar transacción

    // Devolver el usuario con su perfil para consistencia con obtenerUsuarioPorId y obtenerTodosLosUsuarios
    const usuarioConPerfil = await db.Usuario.findByPk(nuevoUsuario.idUsuario, {
        attributes: ["idUsuario", "correo", "estado", "idRol"],
        include: [
            { model: db.Rol, as: "rol", attributes: ["idRol", "nombre"] },
            { model: db.Cliente, as: "clienteInfo", required: false },
            { model: db.Empleado, as: "empleadoInfo", required: false } // Si está configurado
        ]
    });
    // Sequelize devuelve una instancia del modelo, toJSON() la convierte en un objeto plano.
    return usuarioConPerfil ? usuarioConPerfil.toJSON() : null; 
    
  } catch (error) {
    await transaction.rollback(); // Revertir transacción en caso de error
    if (error instanceof ConflictError || error instanceof BadRequestError) {
        throw error;
    }
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ConflictError(
        "Error de unicidad. El correo o número de documento ya podría estar registrado."
      );
    }
    // console.error("Error al crear el usuario y/o perfil en el servicio:", error.message); // Comentado
    throw new CustomError(`Error al crear el usuario: ${error.message}`, 500);
  }
};

/**
 * Obtener todos los usuarios con su rol y perfil de Cliente/Empleado asociado.
 */
const obtenerTodosLosUsuarios = async (opcionesDeFiltro = {}) => {
  try {
    const usuarios = await db.Usuario.findAll({
      where: opcionesDeFiltro,
      attributes: ["idUsuario", "correo", "estado", "idRol"],
      include: [
        {
          model: db.Rol,
          as: "rol",
          attributes: ["idRol", "nombre"],
        },
        {
          model: db.Cliente,
          as: "clienteInfo",
          attributes: [
            "idCliente",
            "nombre",
            "apellido",
            "telefono",
            "tipoDocumento",
            "numeroDocumento",
            "fechaNacimiento",
          ],
          required: false,
        },
        {
          model: db.Empleado, // Asumiendo que existe y está asociado en Usuario.model.js con alias 'empleadoInfo'
          as: "empleadoInfo",
          attributes: [
            "idEmpleado",
            "nombre", // O los campos relevantes de Empleado
            "celular",
            "tipoDocumento",
            "numeroDocumento",
            "fechaNacimiento",
          ],
          required: false,
        },
      ],
      order: [["idUsuario", "ASC"]],
    });
    return usuarios;
  } catch (error) {
    // console.error("Error al obtener todos los usuarios en el servicio:", error.message); // Comentado
    throw new CustomError(`Error al obtener usuarios: ${error.message}`, 500);
  }
};

/**
 * Obtener un usuario por su ID, incluyendo su rol y perfil de Cliente/Empleado.
 */
const obtenerUsuarioPorId = async (idUsuario) => {
  try {
    const usuario = await db.Usuario.findByPk(idUsuario, {
      attributes: ["idUsuario", "correo", "estado", "idRol"],
      include: [
        {
          model: db.Rol,
          as: "rol",
          attributes: ["idRol", "nombre"],
        },
        {
          model: db.Cliente,
          as: "clienteInfo",
          attributes: [
            "idCliente",
            "nombre",
            "apellido",
            "telefono",
            "tipoDocumento",
            "numeroDocumento",
            "fechaNacimiento",
          ],
          required: false,
        },
        {
          model: db.Empleado, // Asumiendo que existe y está asociado en Usuario.model.js con alias 'empleadoInfo'
          as: "empleadoInfo",
          attributes: [
            "idEmpleado",
            "nombre",
            "celular",
            "tipoDocumento",
            "numeroDocumento",
            "fechaNacimiento",
          ],
          required: false,
        },
      ],
    });
    if (!usuario) {
      throw new NotFoundError("Usuario no encontrado.");
    }
    return usuario;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    // console.error(`Error al obtener el usuario con ID ${idUsuario} en el servicio:`, error.message); // Comentado
    throw new CustomError(`Error al obtener el usuario: ${error.message}`, 500);
  }
};

/**
 * Actualizar (Editar) un usuario existente y su perfil asociado.
 */
const actualizarUsuario = async (idUsuario, datosActualizar) => {
  const transaction = await db.sequelize.transaction();
  try {
    const usuario = await db.Usuario.findByPk(idUsuario, { transaction });
    if (!usuario) {
      await transaction.rollback();
      throw new NotFoundError("Usuario no encontrado para actualizar.");
    }

    // Separar datos para Usuario y para Perfil
    const datosParaUsuario = {};
    const datosParaPerfilCliente = {};
    const datosParaPerfilEmpleado = {}; // Si aplica

    // Campos de la tabla Usuario
    if (datosActualizar.hasOwnProperty('correo')) datosParaUsuario.correo = datosActualizar.correo;
    if (datosActualizar.hasOwnProperty('idRol')) datosParaUsuario.idRol = datosActualizar.idRol;
    if (datosActualizar.hasOwnProperty('estado')) datosParaUsuario.estado = datosActualizar.estado;
    if (datosActualizar.contrasena) datosParaUsuario.contrasena = datosActualizar.contrasena; // Se hasheará más adelante

    // Campos de perfil Cliente (ejemplo)
    if (datosActualizar.hasOwnProperty('nombre')) datosParaPerfilCliente.nombre = datosActualizar.nombre;
    if (datosActualizar.hasOwnProperty('apellido')) datosParaPerfilCliente.apellido = datosActualizar.apellido;
    if (datosActualizar.hasOwnProperty('telefono')) datosParaPerfilCliente.telefono = datosActualizar.telefono;
    if (datosActualizar.hasOwnProperty('tipoDocumento')) datosParaPerfilCliente.tipoDocumento = datosActualizar.tipoDocumento;
    if (datosActualizar.hasOwnProperty('numeroDocumento')) datosParaPerfilCliente.numeroDocumento = datosActualizar.numeroDocumento;
    if (datosActualizar.hasOwnProperty('fechaNacimiento')) datosParaPerfilCliente.fechaNacimiento = datosActualizar.fechaNacimiento;
    // if (datosActualizar.hasOwnProperty('direccion')) datosParaPerfilCliente.direccion = datosActualizar.direccion;

    // Campos de perfil Empleado (ejemplo)
    // if (datosActualizar.hasOwnProperty('celular')) datosParaPerfilEmpleado.celular = datosActualizar.celular;
    // ... otros campos de empleado

    // Validaciones (como en tu código original)
    if (datosParaUsuario.correo && datosParaUsuario.correo !== usuario.correo) {
      const usuarioConMismoCorreo = await db.Usuario.findOne({
        where: { correo: datosParaUsuario.correo, idUsuario: { [Op.ne]: idUsuario } },
        transaction,
      });
      if (usuarioConMismoCorreo) {
        await transaction.rollback();
        throw new ConflictError(`El correo electrónico '${datosParaUsuario.correo}' ya está registrado por otro usuario.`);
      }
    }

    if (datosParaUsuario.contrasena) {
      datosParaUsuario.contrasena = await bcrypt.hash(datosParaUsuario.contrasena, saltRounds);
    }

    if (datosParaUsuario.idRol && datosParaUsuario.idRol !== usuario.idRol) {
      const rolNuevo = await db.Rol.findOne({ where: { idRol: datosParaUsuario.idRol, estado: true }, transaction });
      if (!rolNuevo) {
        await transaction.rollback();
        throw new BadRequestError(`El nuevo rol con ID ${datosParaUsuario.idRol} no existe o no está activo.`);
      }
    }
    
    // Actualizar Usuario
    if (Object.keys(datosParaUsuario).length > 0) {
        await usuario.update(datosParaUsuario, { transaction });
    }

    // Actualizar Perfil Cliente si hay datos y el usuario tiene este perfil
    const rolActual = await db.Rol.findByPk(usuario.idRol, { transaction }); // Obtener el rol actual para saber qué perfil buscar
    if (rolActual && rolActual.nombre === "Cliente" && Object.keys(datosParaPerfilCliente).length > 0) {
      const cliente = await db.Cliente.findOne({ where: { idUsuario }, transaction });
      if (cliente) {
        // Validar unicidad de numeroDocumento del cliente si se está cambiando
        if (datosParaPerfilCliente.numeroDocumento && datosParaPerfilCliente.numeroDocumento !== cliente.numeroDocumento) {
            const otroClienteConDocumento = await db.Cliente.findOne({ 
                where: { numeroDocumento: datosParaPerfilCliente.numeroDocumento, idCliente: { [Op.ne]: cliente.idCliente } }, 
                transaction 
            });
            if (otroClienteConDocumento) {
                await transaction.rollback();
                throw new ConflictError(`El número de documento '${datosParaPerfilCliente.numeroDocumento}' ya está registrado para otro cliente.`);
            }
        }
        await cliente.update(datosParaPerfilCliente, { transaction });
      } else {
        // Opcional: ¿Crear perfil de cliente si no existe pero el rol es Cliente y se envían datos de perfil?
        // Esto dependerá de la lógica de negocio. Por ahora, solo actualizamos si existe.
      }
    }
    // Lógica similar para actualizar Empleado si rolActual.nombre === "Empleado"
    if (rolActual && rolActual.nombre === "Empleado" && Object.keys(datosParaPerfilEmpleado).length > 0) {
        const empleado = await db.Empleado.findOne({ where: { idUsuario }, transaction });
        if (empleado) {
            // Aquí puedes agregar validaciones de unicidad para el Empleado si las necesitas
            // (ej. numeroDocumento si se actualiza)
            await empleado.update(datosParaPerfilEmpleado, { transaction });
        }
    }

    await transaction.commit();

    // Devolver el usuario actualizado con su perfil
    const usuarioActualizadoConPerfil = await db.Usuario.findByPk(idUsuario, {
        attributes: ["idUsuario", "correo", "estado", "idRol"],
        include: [
            { model: db.Rol, as: "rol", attributes: ["idRol", "nombre"] },
            { model: db.Cliente, as: "clienteInfo", required: false },
            { model: db.Empleado, as: "empleadoInfo", required: false }
        ]
    });
    return usuarioActualizadoConPerfil ? usuarioActualizadoConPerfil.toJSON() : null;

  } catch (error) {
    await transaction.rollback(); // Asegurarse de rollback en cualquier error dentro del try
    if ( error instanceof NotFoundError || error instanceof ConflictError || error instanceof BadRequestError) throw error;
    if (error.name === "SequelizeUniqueConstraintError") {
      // Esta validación de correo duplicado ya está arriba, pero puede capturar otras restricciones únicas
      throw new ConflictError(`Error de unicidad. El correo o número de documento ya podría estar registrado.`);
    }
    // console.error(`Error al actualizar el usuario con ID ${idUsuario} en el servicio:`, error.message); // Comentado
    throw new CustomError(`Error al actualizar el usuario: ${error.message}`, 500);
  }
};


/**
 * Anular un usuario (borrado lógico, establece estado = false).
 */
const anularUsuario = async (idUsuario) => {
  try {
    return await cambiarEstadoUsuario(idUsuario, false);
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    // console.error(`Error al anular el usuario con ID ${idUsuario} en el servicio:`, error.message); // Comentado
    throw new CustomError(`Error al anular el usuario: ${error.message}`, 500);
  }
};

/**
 * Habilitar un usuario (cambia estado = true).
 */
const habilitarUsuario = async (idUsuario) => {
  try {
    return await cambiarEstadoUsuario(idUsuario, true);
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    // console.error(`Error al habilitar el usuario con ID ${idUsuario} en el servicio:`, error.message); // Comentado
    throw new CustomError(`Error al habilitar el usuario: ${error.message}`, 500);
  }
};

/**
 * Eliminar un usuario físicamente de la base de datos.
 */
const eliminarUsuarioFisico = async (idUsuario) => {
    const transaction = await db.sequelize.transaction(); // Iniciar transacción
    try {
        const usuario = await db.Usuario.findByPk(idUsuario, { transaction });
        if (!usuario) {
            await transaction.rollback();
            throw new NotFoundError("Usuario no encontrado para eliminar físicamente.");
        }

        // Verificar si el usuario está asociado a un perfil de cliente (onDelete: 'RESTRICT')
        const clienteAsociado = await db.Cliente.findOne({ where: { idUsuario: usuario.idUsuario }, transaction });
        if (clienteAsociado) {
            await transaction.rollback();
            throw new ConflictError("No se puede eliminar el usuario porque está asociado a un perfil de cliente.");
        }

        // Verificar si el usuario está asociado a un perfil de empleado (onDelete: 'RESTRICT')
        const empleadoAsociado = await db.Empleado.findOne({ where: { idUsuario: usuario.idUsuario }, transaction });
        if (empleadoAsociado) {
            await transaction.rollback();
            throw new ConflictError("No se puede eliminar el usuario porque está asociado a un perfil de empleado.");
        }

        // Si no hay restricciones, proceder con la eliminación del usuario
        const filasEliminadas = await db.Usuario.destroy({
            where: { idUsuario },
            transaction,
        });
        await transaction.commit();
        return filasEliminadas > 0;
    } catch (error) {
        await transaction.rollback();
        if (error instanceof NotFoundError || error instanceof ConflictError) {
            throw error;
        }
        // Capturar cualquier SequelizeForeignKeyConstraintError que pueda haber fallado en las comprobaciones previas
        if (error.name === "SequelizeForeignKeyConstraintError") {
            throw new ConflictError(
                "No se puede eliminar el usuario debido a una restricción de clave foránea. Asegúrate de que no haya dependencias como tokens de recuperación o perfiles asociados."
            );
        }
        console.error(`Error al eliminar físicamente el usuario con ID ${idUsuario}:`, error.message);
        throw new CustomError(`Error al eliminar físicamente el usuario: ${error.message}`, 500);
    }
};

module.exports = {
  crearUsuario,
  obtenerTodosLosUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  anularUsuario,
  habilitarUsuario,
  eliminarUsuarioFisico,
  cambiarEstadoUsuario,
};