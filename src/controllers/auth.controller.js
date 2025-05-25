// src/controllers/auth.controller.js
const authService = require("../services/auth.service.js"); // Ajusta la ruta si es necesario

/**
 * Registra un nuevo usuario.
 */
const registrarUsuario = async (req, res, next) => {
  try {
    // req.body debería contener: { nombre?, apellido?, correo, contrasena }
    // El servicio se encarga de asignar el rol por defecto y hashear la contraseña.
    const { usuario, token } = await authService.registrarUsuario(req.body);
    res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente. Por favor, inicia sesión.",
      data: {
        usuario, // Usuario sin contraseña
        token, // Token JWT para inicio de sesión inmediato si se desea, o solo para confirmar registro
      },
    });
  } catch (error) {
    next(error); // Pasa el error al manejador global
  }
};

/**
 * Inicia sesión de un usuario existente.
 */
const loginUsuario = async (req, res, next) => {
  try {
    const { correo, contrasena } = req.body;
    const { usuario, token } = await authService.loginUsuario(
      correo,
      contrasena
    );

    // Opcional: Configurar cookie de sesión si no solo se usa el token Bearer
    // if (req.session) {
    //   req.session.usuario = usuario; // Guardar info del usuario en la sesión del servidor
    //   req.session.token = token; // Podrías guardar el token aquí también si es necesario
    // }

    res.status(200).json({
      success: true,
      message: "Inicio de sesión exitoso.",
      data: {
        usuario, // Usuario sin contraseña, con info de rol
        token, // Token JWT para ser usado por el cliente
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Solicita la recuperación de contraseña para un correo electrónico.
 */
const solicitarRecuperacionContrasena = async (req, res, next) => {
  try {
    const { correo } = req.body;
    await authService.solicitarRecuperacionContrasena(correo);
    // Por seguridad, siempre devolver un mensaje genérico, exista o no el correo.
    res.status(200).json({
      success: true,
      message:
        "Si el correo electrónico está registrado, recibirás instrucciones para restablecer tu contraseña.",
    });
  } catch (error) {
    // Aunque el servicio maneja no revelar si el correo existe,
    // un error inesperado en el servicio sí debe ser manejado.
    next(error);
  }
};

/**
 * Valida un token de recuperación.
 * Útil si el frontend quiere verificar el token antes de mostrar el formulario de nueva contraseña.
 */
const validarTokenRecuperacion = async (req, res, next) => {
  try {
    const { token } = req.body; // O req.query.token o req.params.token según cómo lo envíes
    await authService.validarTokenRecuperacion(token); // El servicio lanza error si no es válido
    res.status(200).json({
      success: true,
      message: "Token de recuperación válido.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resetea la contraseña usando un token de recuperación válido y una nueva contraseña.
 */
const resetearContrasena = async (req, res, next) => {
  try {
    const { token, nuevaContrasena } = req.body;
    await authService.resetearContrasena(token, nuevaContrasena);
    res.status(200).json({
      success: true,
      message:
        "Contraseña actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * (Opcional) Cierra la sesión del usuario.
 * Si usas sesiones de servidor, esto las destruiría.
 * Si solo usas JWT, el "logout" es principalmente del lado del cliente (borrar el token).
 */
const logoutUsuario = (req, res, next) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error al destruir la sesión:", err);
        return next(
          new CustomError("No se pudo cerrar la sesión correctamente.", 500)
        );
      }
      res.clearCookie("connect.sid"); // 'connect.sid' es el nombre por defecto del cookie de sesión de express-session
      // Ajusta si usas un nombre de cookie personalizado.
      res
        .status(200)
        .json({ success: true, message: "Sesión cerrada exitosamente." });
    });
  } else {
    // Si no hay sesión de servidor, el logout es responsabilidad del cliente (borrar token JWT)
    res
      .status(200)
      .json({
        success: true,
        message: "Logout procesado (el cliente debe eliminar el token JWT).",
      });
  }
};

module.exports = {
  registrarUsuario,
  loginUsuario,
  solicitarRecuperacionContrasena,
  validarTokenRecuperacion,
  resetearContrasena,
  logoutUsuario, // Opcional
};
