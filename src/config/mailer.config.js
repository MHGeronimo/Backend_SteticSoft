// src/config/mailer.config.js
const nodemailer = require("nodemailer");
const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_SECURE,
  EMAIL_USER,
  EMAIL_PASS,
  IS_DEVELOPMENT,
} = require("./env.config");

if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn(
    "⚠️ Advertencia: Credenciales de email (EMAIL_USER, EMAIL_PASS) no configuradas. El envío de correos podría fallar."
  );
}

const mailerConfig = {
  host: EMAIL_HOST || "smtp.gmail.com",
  port: EMAIL_PORT || 587,
  secure: EMAIL_SECURE || false, // true para 465, false para otros (STARTTLS)
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS, // Para Gmail, usar contraseña de aplicación si 2FA está activado
  },
  // Desactivar la verificación TLS en desarrollo si usas un servidor SMTP local con certificado autofirmado
  // NUNCA USAR rejectUnauthorized: false en producción con Gmail u otros servicios públicos.
  ...(IS_DEVELOPMENT &&
    EMAIL_HOST !== "smtp.gmail.com" && {
      tls: { rejectUnauthorized: false },
    }),
  connectionTimeout: 10000, // 10 segundos
  greetingTimeout: 10000,
  socketTimeout: 10000,
};

const transporter = nodemailer.createTransport(mailerConfig);

// Verificar la conexión del transporter (opcional, pero útil)
transporter.verify((error, success) => {
  if (error) {
    console.error(
      "❌ Error al verificar la configuración del transporter de Nodemailer:",
      error.message
    );
    console.warn("⚠️ El servicio de correo podría no estar operativo.");
  } else {
    console.log(
      "📨 Servidor de correo (Nodemailer) listo para enviar mensajes."
    );
  }
});

module.exports = transporter;
