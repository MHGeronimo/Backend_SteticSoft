// src/middlewares/errorHandler.middleware.js
const { IS_DEVELOPMENT } = require("../config/env.config"); // Para mostrar más detalles en desarrollo
const CustomError = require("../errors/CustomError"); // Importa tu clase base de error personalizado

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error("❌ ERROR CAPTURADO POR EL MANEJADOR GLOBAL:");
  // Loguear solo el mensaje en producción si no es un error operacional conocido
  if (IS_DEVELOPMENT || err.isOperational) {
    // err.isOperational es una propiedad que puedes añadir a tus CustomError
    console.error("Mensaje:", err.message);
  }
  if (IS_DEVELOPMENT) {
    console.error("Stack:", err.stack);
    // console.error("Error completo:", err); // Puede ser muy verboso
  }

  // Si es una instancia de nuestros errores personalizados
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      success: false, // 'success' ya está en CustomError, pero lo aseguramos
      message: err.message,
      errors: err.errors && err.errors.length > 0 ? err.errors : undefined,
    });
  }

  // Errores específicos de Sequelize
  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({
      success: false,
      message: "Error de validación de datos.",
      errors: err.errors
        ? err.errors.map((e) => ({
            field: e.path,
            message: e.message,
            value: e.value,
          }))
        : [{ msg: err.message }],
    });
  }
  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({
      // 409 Conflict
      success: false,
      message:
        "Error de restricción única: ya existe un registro con alguno de los valores proporcionados.",
      errors: err.errors
        ? err.errors.map((e) => ({
            field: e.path,
            message: `El valor '${e.value}' para '${e.path}' ya existe.`,
          }))
        : [{ msg: err.message }],
    });
  }
  if (err.name === "SequelizeForeignKeyConstraintError") {
    return res.status(409).json({
      // 409 Conflict
      success: false,
      message:
        "Error de referencia: no se puede realizar la operación debido a registros relacionados.",
      // Puedes añadir más detalles si es seguro y útil
    });
  }
  if (err.name === "SequelizeDatabaseError") {
    // Errores más genéricos de la BD
    console.error(
      "Error de base de datos Sequelize:",
      err.original?.message || err.message
    );
    return res.status(500).json({
      success: false,
      message: IS_DEVELOPMENT
        ? `Error de base de datos: ${err.original?.message || err.message}`
        : "Error interno del servidor al procesar la solicitud.",
    });
  }

  // Errores de JWT que podrían no haber sido transformados por authMiddleware
  if (err.name === "TokenExpiredError") {
    return res
      .status(401)
      .json({ success: false, message: "Token ha expirado." });
  }
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ success: false, message: "Token inválido." });
  }
  if (err.name === "NotBeforeError") {
    return res
      .status(401)
      .json({ success: false, message: "Token aún no activo." });
  }

  // Error por defecto para cualquier otra cosa no capturada específicamente
  const statusCode =
    typeof err.status === "number"
      ? err.status
      : typeof err.statusCode === "number"
      ? err.statusCode
      : 500;

  res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500 && !IS_DEVELOPMENT
        ? "Error interno del servidor."
        : err.message || "Ocurrió un error inesperado.",
    ...(IS_DEVELOPMENT &&
      statusCode === 500 && { error_type: err.name, stack_trace: err.stack }),
  });
};

module.exports = errorHandler;
