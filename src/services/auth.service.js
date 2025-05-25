// src/services/auth.service.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto"); // Para generar tokens de recuperación seguros
const db = require("../models");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
  CustomError,
  ConflictError,
} = require("../errors");
const { JWT_SECRET, EMAIL_FROM } = require("../config/env.config"); // Asumiendo que EMAIL_FROM está en tu env.config
const mailerService = require("./mailer.service.js"); // Tu servicio de correo
const usuarioService = require("./usuario.service.js"); // Para reutilizar la creación de usuario si es necesario

const JWT_EXPIRATION = "1d"; // Duración del token JWT (ej. 1 día)
const TOKEN_RECUPERACION_EXPIRATION_MINUTES = 60; // Duración del token de recuperación en minutos

/**
 * Registra un nuevo usuario.
 * Asume que el rol por defecto es 'Cliente' si no se especifica otro.
 * @param {object} datosRegistro - { nombre?, apellido?, correo, contrasena }
 * @returns {Promise<object>} El usuario creado (sin contraseña) y el token JWT.
 */
const registrarUsuario = async (datosRegistro) => {
  const { nombre, apellido, correo, contrasena } = datosRegistro;

  // Verificar si el correo ya existe (el validador también lo hace)
  const usuarioExistente = await db.Usuario.findOne({ where: { correo } });
  if (usuarioExistente) {
    throw new ConflictError(
      `El correo electrónico '${correo}' ya está registrado.`
    );
  }

  // Obtener el rol de 'Cliente' por defecto
  const rolCliente = await db.Rol.findOne({ where: { nombre: "Cliente" } });
  if (!rolCliente) {
    console.error(
      "Error crítico: El rol 'Cliente' no se encuentra en la base de datos."
    );
    throw new CustomError(
      "No se pudo completar el registro debido a un error de configuración.",
      500
    );
  }

  try {
    // Reutilizar la lógica de crearUsuario del servicio de usuario, pero adaptada para registro
    // o crear directamente aquí si el flujo es muy diferente.
    // Por ahora, creamos directamente aquí para especificar el rol.
    const contrasenaHasheada = await bcrypt.hash(contrasena, 10); // saltRounds = 10

    const nuevoUsuario = await db.Usuario.create({
      correo,
      contrasena: contrasenaHasheada,
      idRol: rolCliente.idRol, // Asignar rol de Cliente por defecto
      estado: true, // Los usuarios registrados se activan por defecto
    });

    // Opcional: Crear registro en la tabla Cliente si es necesario para el auto-registro
    // Esto dependerá de si quieres que el registro también cree una entrada en la tabla Cliente.
    // Si es así, necesitarías más campos en datosRegistro (tipodocumento, numerodocumento, etc.)
    // y manejarlo dentro de una transacción. Por ahora, solo creamos el Usuario.
    // Ejemplo conceptual si se crea Cliente también:
    // if (nuevoUsuario && datosRegistro.tipoDocumento && datosRegistro.numeroDocumento && datosRegistro.fechaNacimiento) {
    //   await db.Cliente.create({
    //     idUsuario: nuevoUsuario.idUsuario,
    //     nombre: datosRegistro.nombre || 'N/A',
    //     apellido: datosRegistro.apellido || 'N/A',
    //     correo: nuevoUsuario.correo, // Puede ser el mismo o uno diferente para el perfil Cliente
    //     tipoDocumento: datosRegistro.tipoDocumento,
    //     numeroDocumento: datosRegistro.numeroDocumento,
    //     fechaNacimiento: datosRegistro.fechaNacimiento,
    //     estado: true
    //   });
    // }

    // Generar token JWT para el nuevo usuario
    const payload = {
      idUsuario: nuevoUsuario.idUsuario,
      idRol: nuevoUsuario.idRol,
      rolNombre: rolCliente.nombre, // Nombre del rol
      correo: nuevoUsuario.correo,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

    const { contrasena: _, ...usuarioSinContrasena } = nuevoUsuario.toJSON();

    try {
      const htmlBienvenida = `<h1>¡Bienvenido a SteticSoft, ${
        datosRegistro.nombre || nuevoUsuario.correo
      }!</h1><p>Gracias por registrarte. Esperamos verte pronto.</p>`; // Podrías tener un template más elaborado
      await mailerService({
        to: nuevoUsuario.correo,
        subject: "¡Bienvenido a SteticSoft!",
        html: htmlBienvenida,
      });
    } catch (emailError) {
      console.error(
        `Error al enviar correo de bienvenida a ${nuevoUsuario.correo}:`,
        emailError
      );
      // No relanzar el error para no afectar el flujo de registro si el envío de correo falla
    }

    return { usuario: usuarioSinContrasena, token };
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ConflictError(
        `El correo electrónico '${correo}' ya está registrado.`
      );
    }
    console.error(
      "Error al registrar el usuario en el servicio:",
      error.message,
      error.stack
    );
    throw new CustomError(`Error durante el registro: ${error.message}`, 500);
  }
};

/**
 * Inicia sesión de un usuario.
 * @param {string} correo - Correo del usuario.
 * @param {string} contrasena - Contraseña del usuario.
 * @returns {Promise<object>} Objeto con el usuario (sin contraseña) y el token JWT.
 */
const loginUsuario = async (correo, contrasena) => {
  const usuario = await db.Usuario.findOne({
    where: { correo, estado: true }, // Solo usuarios activos pueden iniciar sesión
    include: [{ model: db.Rol, as: "rol", attributes: ["idRol", "nombre"] }],
  });

  if (!usuario) {
    throw new UnauthorizedError(
      "Credenciales inválidas (correo no encontrado o usuario inactivo)."
    );
  }

  const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
  if (!contrasenaValida) {
    throw new UnauthorizedError(
      "Credenciales inválidas (contraseña incorrecta)."
    );
  }

  // Generar token JWT
  const payload = {
    idUsuario: usuario.idUsuario,
    idRol: usuario.idRol,
    rolNombre: usuario.rol ? usuario.rol.nombre : null,
    correo: usuario.correo,
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

  const { contrasena: _, ...usuarioSinContrasena } = usuario.toJSON();

  return { usuario: usuarioSinContrasena, token };
};

/**
 * Solicita la recuperación de contraseña para un usuario.
 * Genera un token, lo guarda y envía un correo.
 * @param {string} correo - Correo del usuario que solicita la recuperación.
 * @returns {Promise<void>}
 */
const solicitarRecuperacionContrasena = async (correo) => {
  const usuario = await db.Usuario.findOne({ where: { correo, estado: true } });
  if (!usuario) {
    // No revelar si el correo existe o no por seguridad.
    // Simplemente indicamos que si el correo existe, se enviarán instrucciones.
    console.warn(
      `Intento de recuperación para correo no existente o inactivo: ${correo}`
    );
    // No lanzar error aquí para no dar pistas sobre qué correos existen.
    return; // Terminar silenciosamente
  }

  // Generar un token de recuperación seguro y único
  const tokenRecuperacion = crypto.randomBytes(32).toString("hex");
  const fechaExpiracion = new Date(
    Date.now() + TOKEN_RECUPERACION_EXPIRATION_MINUTES * 60 * 1000
  ); // Ej. 60 minutos

  // Guardar el token en la base de datos
  // Invalidar tokens anteriores para este usuario si es necesario (opcional)
  await db.TokenRecuperacion.destroy({
    where: { idUsuario: usuario.idUsuario },
  }); // Opcional: invalidar tokens antiguos
  await db.TokenRecuperacion.create({
    idUsuario: usuario.idUsuario,
    token: tokenRecuperacion,
    fechaExpiracion,
  });

  // Enviar correo electrónico con el token o un enlace
  // El enlace debería apuntar a una página en tu frontend donde el usuario pueda ingresar el token y la nueva contraseña.
  // Ejemplo de enlace: http://tufrontend.com/resetear-contrasena?token=<tokenRecuperacion>
  const enlaceRecuperacion = `http://localhost:3001/reset-password?token=${tokenRecuperacion}`; // ¡Ajusta la URL de tu frontend!

  const htmlCorreo = `
    <p>Hola ${usuario.correo},</p>
    <p>Has solicitado restablecer tu contraseña para SteticSoft.</p>
    <p>Por favor, haz clic en el siguiente enlace o cópialo en tu navegador para continuar:</p>
    <p><a href="${enlaceRecuperacion}">${enlaceRecuperacion}</a></p>
    <p>Este enlace expirará en ${TOKEN_RECUPERACION_EXPIRATION_MINUTES} minutos.</p>
    <p>Si no solicitaste esto, por favor ignora este correo.</p>
    <p>Saludos,<br>El equipo de SteticSoft</p>
  `;

  try {
    await mailerService({
      // Usando el mailer.service.js que refactorizamos
      to: usuario.correo,
      subject: "Recuperación de Contraseña - SteticSoft",
      html: htmlCorreo,
    });
    console.log(`Correo de recuperación enviado a ${usuario.correo}`);
  } catch (error) {
    console.error(
      `Error al enviar correo de recuperación a ${usuario.correo}:`,
      error
    );
    // Considerar cómo manejar este error (ej. reintentar, loguear críticamente)
    // No relanzar el error al usuario para no bloquear el flujo si el correo existe pero el envío falla
  }
};

/**
 * Valida un token de recuperación.
 * @param {string} token - El token a validar.
 * @returns {Promise<object>} El registro de TokenRecuperacion si es válido.
 * @throws {BadRequestError} Si el token es inválido o ha expirado.
 */
const validarTokenRecuperacion = async (token) => {
  if (!token) {
    throw new BadRequestError(
      "Token de recuperación no proporcionado o inválido."
    );
  }
  const tokenData = await db.TokenRecuperacion.findOne({
    where: {
      token: token,
      fechaExpiracion: {
        [Op.gt]: new Date(), // Mayor que la fecha/hora actual
      },
    },
  });

  if (!tokenData) {
    throw new BadRequestError("Token de recuperación inválido o expirado.");
  }
  return tokenData;
};

/**
 * Resetea la contraseña de un usuario usando un token de recuperación válido.
 * @param {string} token - El token de recuperación.
 * @param {string} nuevaContrasena - La nueva contraseña (sin hashear).
 * @returns {Promise<void>}
 */
const resetearContrasena = async (token, nuevaContrasena) => {
  const tokenDataValido = await validarTokenRecuperacion(token); // Reutiliza la validación

  // Si validarTokenRecuperacion lanza error, se detiene aquí. Si no, tokenDataValido contiene los datos.

  const usuario = await db.Usuario.findByPk(tokenDataValido.idUsuario);
  if (!usuario || !usuario.estado) {
    // Doble check
    throw new NotFoundError(
      "Usuario asociado al token no encontrado o inactivo."
    );
  }

  const contrasenaHasheada = await bcrypt.hash(nuevaContrasena, saltRounds);

  const transaction = await db.sequelize.transaction();
  try {
    await usuario.update({ contrasena: contrasenaHasheada }, { transaction });

    // Eliminar el token de recuperación después de usarlo
    await db.TokenRecuperacion.destroy({
      where: { id: tokenDataValido.id },
      transaction,
    });

    await transaction.commit();
    console.log(`Contraseña reseteada para usuario ID: ${usuario.idUsuario}`);

    // Opcional: Enviar correo de confirmación de cambio de contraseña
    const htmlConfirmacion = `<p>Hola ${usuario.correo},</p><p>Tu contraseña ha sido actualizada exitosamente.</p><p>Si no realizaste este cambio, por favor contacta a soporte.</p>`;
    try {
      await mailerService({
        to: usuario.correo,
        subject: "Confirmación de Cambio de Contraseña - SteticSoft",
        html: htmlConfirmacion,
      });
    } catch (emailError) {
      console.error(
        `Error al enviar correo de confirmación de cambio de contraseña a ${usuario.correo}:`,
        emailError
      );
    }
  } catch (error) {
    await transaction.rollback();
    console.error(
      `Error al resetear la contraseña para usuario ID ${usuario.idUsuario}:`,
      error.message,
      error.stack
    );
    throw new CustomError(
      `Error al resetear la contraseña: ${error.message}`,
      500
    );
  }
};

module.exports = {
  registrarUsuario,
  loginUsuario,
  solicitarRecuperacionContrasena,
  validarTokenRecuperacion, // Podría ser útil si el frontend quiere verificar el token antes de mostrar el form de nueva contraseña
  resetearContrasena,
};
