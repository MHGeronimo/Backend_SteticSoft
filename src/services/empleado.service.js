// src/services/empleado.service.js
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
 * Helper interno para cambiar el estado de un empleado (perfil).
 * Considerar si esto también debe afectar el estado del Usuario asociado.
 */
const cambiarEstadoEmpleado = async (idEmpleado, nuevoEstado) => {
  const empleado = await db.Empleado.findByPk(idEmpleado);
  if (!empleado) {
    throw new NotFoundError("Empleado no encontrado para cambiar estado.");
  }
  // Opcional: Sincronizar estado con la cuenta de Usuario si la lógica de negocio lo requiere
  // if (empleado.idUsuario) {
  //   await db.Usuario.update({ estado: nuevoEstado }, { where: { idUsuario: empleado.idUsuario } });
  // }
  if (empleado.estado === nuevoEstado) {
    return empleado; // Ya está en el estado deseado
  }
  await empleado.update({ estado: nuevoEstado });
  return empleado;
};

/**
 * Crea un nuevo perfil de Empleado y su cuenta de Usuario asociada.
 * Espera todos los datos necesarios para ambas entidades.
 */
const crearEmpleado = async (datosCompletosEmpleado) => {
  const {
    // Datos para Usuario y Empleado (compartidos)
    correo,           // Correo para la cuenta de Usuario y el perfil del Empleado
    contrasena,       // Contraseña para la nueva cuenta de Usuario
    nombre,           // Nombre del empleado
    apellido,         // Nuevo campo añadido
    telefono,         // Nuevo campo añadido (reemplaza a celular)
    tipoDocumento,
    numeroDocumento,
    fechaNacimiento,
    estadoEmpleado,   // Estado para el perfil de Empleado (opcional, por defecto true)
  } = datosCompletosEmpleado;

  // Validaciones previas
  if (!correo || !contrasena || !nombre || !apellido || !telefono || !tipoDocumento || !numeroDocumento || !fechaNacimiento) {
    throw new BadRequestError("Faltan campos obligatorios para crear el empleado y su cuenta de usuario.");
  }

  // Verificar unicidad del correo en la tabla Usuario
  let usuarioExistente = await db.Usuario.findOne({ where: { correo } });
  if (usuarioExistente) {
    throw new ConflictError(`El correo electrónico '${correo}' ya está registrado para una cuenta de Usuario.`);
  }

  // Verificar unicidad del correo en la tabla Empleado
  let empleadoExistenteCorreo = await db.Empleado.findOne({ where: { correo } });
  if (empleadoExistenteCorreo) {
    throw new ConflictError(`El correo electrónico '${correo}' ya está registrado para otro perfil de empleado.`);
  }

  // Verificar unicidad del número de documento en la tabla Empleado
  let empleadoExistenteNumeroDoc = await db.Empleado.findOne({ where: { numeroDocumento } });
  if (empleadoExistenteNumeroDoc) {
    throw new ConflictError(`El número de documento '${numeroDocumento}' ya está registrado para otro empleado.`);
  }
  
  const rolEmpleado = await db.Rol.findOne({ where: { nombre: "Empleado" } });
  if (!rolEmpleado) {
    throw new CustomError("El rol 'Empleado' no está configurado en el sistema.", 500);
  }

  const transaction = await db.sequelize.transaction();
  try {
    // 1. Crear el Usuario
    const contrasenaHasheada = await bcrypt.hash(contrasena, saltRounds);
    const nuevoUsuario = await db.Usuario.create({
      correo,
      contrasena: contrasenaHasheada,
      idRol: rolEmpleado.idRol,
      estado: datosCompletosEmpleado.estadoUsuario !== undefined ? datosCompletosEmpleado.estadoUsuario : true,
    }, { transaction });

    // 2. Crear el Empleado, vinculándolo al nuevo Usuario
    const nuevoEmpleado = await db.Empleado.create({
      idUsuario: nuevoUsuario.idUsuario,
      nombre,
      apellido, // Added
      correo,   // Added
      telefono, // Added
      tipoDocumento,
      numeroDocumento,
      fechaNacimiento,
      estado: datosCompletosEmpleado.estadoEmpleado !== undefined ? datosCompletosEmpleado.estadoEmpleado : true,
    }, { transaction });

    await transaction.commit();
    
    // Return the employee with their associated user account
    return db.Empleado.findByPk(nuevoEmpleado.idEmpleado, {
        include: [{ 
            model: db.Usuario, 
            as: "cuentaUsuario", // Alias from Empleado.model.js
            attributes: ["idUsuario", "correo", "estado", "idRol"],
            include: [{ model: db.Rol, as: "rol", attributes: ["nombre"]}] // Alias from Usuario.model.js
        }]
    });

  } catch (error) {
    await transaction.rollback();
    if (error instanceof ConflictError || error instanceof BadRequestError || error instanceof CustomError) {
      throw error;
    }
    if (error.name === "SequelizeUniqueConstraintError") {
      let mensajeConflicto =
        "Uno de los datos proporcionados ya está en uso (correo o número de documento).";
      if (error.fields) {
        if (error.fields.correo && error.fields.correo === correo)
          mensajeConflicto = `El correo electrónico '${correo}' ya está registrado.`;
        if (
          error.fields.numerodocumento &&
          error.fields.numerodocumento === numeroDocumento
        )
          mensajeConflicto = `El número de documento '${numeroDocumento}' ya está registrado.`;
      }
      throw new ConflictError(mensajeConflicto);
    }
    // console.error("Error al crear el empleado y usuario en el servicio:", error.message, error.stack); // Comentado
    throw new CustomError(`Error al crear el empleado: ${error.message}`, 500);
  }
};

/**
 * Get all employees, including their User account information.
 */
const obtenerTodosLosEmpleados = async (opcionesDeFiltro = {}) => {
  try {
    const empleados = await db.Empleado.findAll({
      where: opcionesDeFiltro,
      include: [
        {
          model: db.Usuario,
          as: "cuentaUsuario", // Alias defined in Empleado.model.js
          attributes: ["idUsuario", "correo", "estado", "idRol"],
          include: [{ // Nested to get role name
            model: db.Rol,
            as: "rol", // Alias defined in Usuario.model.js
            attributes: ["nombre"]
          }]
        },
        // You could include other Employee associations here if needed, like Specialties
        // { model: db.Especialidad, as: "especialidades", through: { attributes: [] } /* To avoid bringing the intermediate table */ }
      ],
      order: [["apellido", "ASC"], ["nombre", "ASC"]], // Order by apellido then nombre
    });
    return empleados;
  } catch (error) {
    // console.error("Error al obtener todos los empleados en el servicio:", error.message); // Comentado
    throw new CustomError(`Error al obtener empleados: ${error.message}`, 500);
  }
};

/**
 * Get an employee by their ID, including their User account information.
 */
const obtenerEmpleadoPorId = async (idEmpleado) => {
  try {
    const empleado = await db.Empleado.findByPk(idEmpleado, {
      include: [
        {
          model: db.Usuario,
          as: "cuentaUsuario",
          attributes: ["idUsuario", "correo", "estado", "idRol"],
            include: [{
            model: db.Rol,
            as: "rol",
            attributes: ["nombre"]
          }]
        },
        // { model: db.Especialidad, as: "especialidades" }
      ],
    });
    if (!empleado) {
      throw new NotFoundError("Empleado no encontrado.");
    }
    return empleado;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    // console.error(`Error al obtener el empleado con ID ${idEmpleado} en el servicio:`, error.message); // Comentado
    throw new CustomError(`Error al obtener el empleado: ${error.message}`, 500);
  }
};

/**
 * Update an existing employee and, optionally, their associated User account.
 */
const actualizarEmpleado = async (idEmpleado, datosActualizar) => {
  const transaction = await db.sequelize.transaction();
  try {
    const empleado = await db.Empleado.findByPk(idEmpleado, { transaction });
    if (!empleado) {
      await transaction.rollback();
      throw new NotFoundError("Empleado no encontrado para actualizar.");
    }

    const datosParaEmpleado = {};
    const datosParaUsuario = {};

    // Direct Employee profile fields
    if (datosActualizar.hasOwnProperty('nombre')) datosParaEmpleado.nombre = datosActualizar.nombre;
    if (datosActualizar.hasOwnProperty('apellido')) datosParaEmpleado.apellido = datosActualizar.apellido; // Added
    if (datosActualizar.hasOwnProperty('telefono')) datosParaEmpleado.telefono = datosActualizar.telefono; // Added
    if (datosActualizar.hasOwnProperty('tipoDocumento')) datosParaEmpleado.tipoDocumento = datosActualizar.tipoDocumento;
    if (datosActualizar.hasOwnProperty('numeroDocumento')) datosParaEmpleado.numeroDocumento = datosActualizar.numeroDocumento;
    if (datosActualizar.hasOwnProperty('fechaNacimiento')) datosParaEmpleado.fechaNacimiento = datosActualizar.fechaNacimiento;
    if (datosActualizar.hasOwnProperty('estadoEmpleado')) datosParaEmpleado.estado = datosActualizar.estadoEmpleado;

    // Fields that might affect the User table
    if (datosActualizar.hasOwnProperty('correo')) {
      datosParaEmpleado.correo = datosActualizar.correo; // Update email in Employee profile
      datosParaUsuario.correo = datosActualizar.correo; // Mark to update email in User
    }
    if (datosActualizar.hasOwnProperty('estadoUsuario')) datosParaUsuario.estado = datosActualizar.estadoUsuario;
    // Password or role changes are not handled directly here. These would be separate operations.


    // Uniqueness validations for Employee
    if (datosParaEmpleado.numeroDocumento && datosParaEmpleado.numeroDocumento !== empleado.numeroDocumento) {
      const otroEmpleadoConDocumento = await db.Empleado.findOne({ where: { numeroDocumento: datosParaEmpleado.numeroDocumento, idEmpleado: { [Op.ne]: idEmpleado } }, transaction });
      if (otroEmpleadoConDocumento) {
        await transaction.rollback();
        throw new ConflictError(`El número de documento '${datosParaEmpleado.numeroDocumento}' ya está registrado para otro empleado.`);
      }
    }
    if (datosParaEmpleado.correo && datosParaEmpleado.correo !== empleado.correo) {
      const otroEmpleadoConCorreo = await db.Empleado.findOne({ where: { correo: datosParaEmpleado.correo, idEmpleado: { [Op.ne]: idEmpleado } }, transaction });
      if (otroEmpleadoConCorreo) {
        await transaction.rollback();
        throw new ConflictError(`El correo electrónico '${datosParaEmpleado.correo}' ya está registrado para otro perfil de empleado.`);
      }
    }
    
    // Update Employee if there are data for it
    if (Object.keys(datosParaEmpleado).length > 0) {
      await empleado.update(datosParaEmpleado, { transaction });
    }

    // Update associated User if there are data for it and idUsuario exists
    if (empleado.idUsuario && Object.keys(datosParaUsuario).length > 0) {
      const usuario = await db.Usuario.findByPk(empleado.idUsuario, { transaction });
      if (usuario) {
        // Validate email uniqueness in User if it's being changed
        if (datosParaUsuario.correo && datosParaUsuario.correo !== usuario.correo) {
          const otroUsuarioConCorreo = await db.Usuario.findOne({
            where: { correo: datosParaUsuario.correo, idUsuario: { [Op.ne]: empleado.idUsuario } },
          });
          if (otroUsuarioConCorreo) {
            await transaction.rollback();
            throw new ConflictError(`El correo electrónico '${datosParaUsuario.correo}' ya está en uso por otra cuenta de usuario.`);
          }
        }
        await usuario.update(datosParaUsuario, { transaction });
      }
    }

    await transaction.commit();
    return obtenerEmpleadoPorId(empleado.idEmpleado); // Returns the updated employee with their user
  } catch (error) {
    await transaction.rollback();
    if (error instanceof NotFoundError || error instanceof ConflictError || error instanceof BadRequestError || error instanceof CustomError) throw error;
    if (error.name === "SequelizeUniqueConstraintError") {
      const constraintField = error.errors && error.errors[0] ? error.errors[0].path : "a unique field";
      throw new ConflictError(`Uniqueness error. A record with the same value for '${constraintField}' already exists.`);
    }
    // console.error(`Error al actualizar el empleado con ID ${idEmpleado} en el servicio:`, error.message, error.stack); // Commented
    throw new CustomError(`Error al actualizar el empleado: ${error.message}`, 500);
  }
};

/**
 * Disable an employee (logical deletion, sets status = false in Employee).
 */
const anularEmpleado = async (idEmpleado) => {
  try {
    // Consider whether disabling an employee should also deactivate their User account.
    // const empleado = await db.Empleado.findByPk(idEmpleado);
    // if (empleado && empleado.idUsuario) {
    //   await db.Usuario.update({ estado: false }, { where: { idUsuario: empleado.idUsuario }});
    // }
    return await cambiarEstadoEmpleado(idEmpleado, false);
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    // console.error(`Error al anular el empleado con ID ${idEmpleado} en el servicio:`, error.message); // Commented
    throw new CustomError(`Error al anular el empleado: ${error.message}`, 500);
  }
};

/**
 * Enable an employee (changes status = true in Employee).
 */
const habilitarEmpleado = async (idEmpleado) => {
  try {
    // Consider whether enabling an employee should also activate their User account.
    // const empleado = await db.Empleado.findByPk(idEmpleado);
    // if (empleado && empleado.idUsuario) {
    //   await db.Usuario.update({ estado: true }, { where: { idUsuario: empleado.idUsuario }});
    // }
    return await cambiarEstadoEmpleado(idEmpleado, true);
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    // console.error(`Error al habilitar el empleado con ID ${idEmpleado} en el servicio:`, error.message); // Commented
    throw new CustomError(`Error al habilitar el empleado: ${error.message}`, 500);
  }
};

/**
 * Physically delete an employee from the database.
 * The FK in Empleado.idUsuario has ON DELETE SET NULL, so the User is not deleted.
 */
const eliminarEmpleadoFisico = async (idEmpleado) => {
  try {
    const empleado = await db.Empleado.findByPk(idEmpleado);
    if (!empleado) {
      throw new NotFoundError("Empleado no encontrado para eliminar físicamente.");
    }
    // Optional: If deleting an employee also means deleting their user account.
    // if (empleado.idUsuario) {
    //   await db.Usuario.destroy({ where: { idUsuario: empleado.idUsuario }});
    // }
    const filasEliminadas = await db.Empleado.destroy({ where: { idEmpleado } });
    return filasEliminadas > 0;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ConflictError("Cannot delete employee due to existing references (e.g., Appointments, Supplies). Consider disabling them instead.");
    }
    // console.error(`Error al eliminar físicamente el empleado con ID ${idEmpleado} en el servicio:`, error.message); // Commented
    throw new CustomError(`Error al eliminar físicamente el empleado: ${error.message}`, 500);
  }
};

/**
 * Get all ACTIVE employees, including their User account information.
 * This is useful for populating dropdowns where only active employees should be listed.
 */
const obtenerEmpleadosActivos = async () => {
  try {
    const empleados = await db.Empleado.findAll({
      where: { estado: true }, // Filter for active employees
      include: [
        {
          model: db.Usuario,
          as: "cuentaUsuario",
          attributes: ["idUsuario", "correo", "estado", "idRol"],
          where: { estado: true }, // Also ensure the user account is active
          include: [{
            model: db.Rol,
            as: "rol",
            attributes: ["nombre"]
          }]
        }
      ],
      order: [["apellido", "ASC"], ["nombre", "ASC"]],
    });
    return empleados;
  } catch (error) {
    throw new CustomError(`Error al obtener empleados activos: ${error.message}`, 500);
  }
};

module.exports = {
  crearEmpleado,
  obtenerTodosLosEmpleados,
  obtenerEmpleadoPorId,
  actualizarEmpleado,
  anularEmpleado,
  habilitarEmpleado,
  eliminarEmpleadoFisico,
  cambiarEstadoEmpleado,
  obtenerEmpleadosActivos,
};