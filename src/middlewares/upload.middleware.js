// src/middlewares/upload.middleware.js (o shared/src_api/middlewares/upload.middleware.js)

const multer = require("multer");
const path = require("path");
const fs = require("fs");

/**
 * Función fábrica que crea una instancia de Multer configurada para una entidad específica.
 * @param {string} entityName - El nombre de la entidad (ej. 'productos', 'servicios'), que se usará para crear la carpeta.
 * @returns {multer} - Una instancia de Multer lista para ser usada como middleware.
 */
const createUploader = (entityName) => {
  // 🚨 Forzar a que siempre use la carpeta del backend real: src/public/uploads
  const uploadPath = path.join(
    __dirname,
    "..",   // desde src/middlewares → vuelve a src/
    "public",
    "uploads",
    entityName
  );

  // Se asegura de que el directorio de destino exista. Si no, lo crea recursivamente.
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  // Configuración de almacenamiento: define dónde y cómo se guardarán los archivos.
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // Genera un nombre de archivo único para evitar colisiones.
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const extension = path.extname(file.originalname);
      cb(null, `${entityName}-${uniqueSuffix}${extension}`);
    },
  });

  // Filtro de archivos: define qué tipos de archivos son aceptados.
  const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    if (allowedTypes.test(file.mimetype)) {
      cb(null, true); // Aceptar el archivo
    } else {
      cb(
        new Error("Tipo de archivo no permitido. Solo se aceptan imágenes."),
        false
      ); // Rechazar el archivo
    }
  };

  // Retorna la instancia de Multer con toda la configuración.
  return multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB por archivo
  });
};

// Se exportan middlewares específicos para cada caso de uso.
module.exports = {
  uploadServicioImage: createUploader("servicios").single("imagen"),
  uploadProductoImage: createUploader("productos").single("imagen"),
  uploadPerfilImage: createUploader("perfiles").single("foto_perfil"),
};
