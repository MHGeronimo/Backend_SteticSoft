// src/routes/auth.routes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller.js");
const authValidators = require("../validators/auth.validators.js");
const authMiddleware = require("../middlewares/auth.middleware.js"); // Podríamos necesitarlo para un endpoint de "verificar token" o "perfil"

// POST /api/auth/registrar - Registrar un nuevo usuario
router.post(
  "/registrar",
  authValidators.registrarUsuarioValidators,
  authController.registrarUsuario
);

// POST /api/auth/login - Iniciar sesión
router.post(
  "/login",
  authValidators.loginValidators,
  authController.loginUsuario
);

// POST /api/auth/solicitar-recuperacion - Solicitar recuperación de contraseña
router.post(
  "/solicitar-recuperacion",
  authValidators.solicitarRecuperacionValidators,
  authController.solicitarRecuperacionContrasena
);

// POST /api/auth/validar-token-recuperacion - Validar un token de recuperación (opcional)
// El frontend podría usar esto para verificar el token antes de mostrar el formulario de nueva contraseña.
router.post(
  "/validar-token-recuperacion",
  // No se necesita un validador específico si solo se envía el token en el cuerpo,
  // pero podrías crear uno si quisieras validar que el token no esté vacío, etc.
  // Por ahora, el servicio authService.validarTokenRecuperacion manejará el token del body.
  authController.validarTokenRecuperacion
);

// POST /api/auth/resetear-contrasena - Resetear la contraseña usando un token
router.post(
  "/resetear-contrasena",
  authValidators.resetearContrasenaValidators,
  authController.resetearContrasena
);

// POST /api/auth/logout - Cerrar sesión (si se maneja sesión en el servidor)
// Para JWT stateless, el logout es principalmente del lado del cliente.
// Este endpoint puede invalidar la sesión del servidor si se usa.
router.post(
  "/logout",
  // authMiddleware, // Opcional: solo usuarios autenticados pueden hacer logout explícito de sesión de servidor
  authController.logoutUsuario
);

// (Opcional) GET /api/auth/perfil - Obtener perfil del usuario autenticado (requiere token)
// Este es un ejemplo de ruta protegida dentro de auth.routes.js
// router.get(
//   '/perfil',
//   authMiddleware, // Requiere autenticación
//   (req, res) => { // Un controlador simple aquí o uno dedicado
//     // req.usuario es establecido por authMiddleware
//     if (req.usuario) {
//       // Podrías querer buscar el usuario de nuevo para obtener la info más fresca sin la contraseña
//       // o simplemente devolver lo que ya tienes en req.usuario si es suficiente.
//       // Por simplicidad, devolvemos lo que hay en req.usuario (que ya excluye la contraseña si authService lo hizo bien)
//       res.json({ success: true, data: req.usuario });
//     } else {
//       res.status(401).json({ success: false, message: 'No autorizado.' });
//     }
//   }
// );

module.exports = router;
