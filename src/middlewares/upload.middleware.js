// src/middlewares/upload.middleware.js

const multer = require("multer");

/**
 * Configuración de Multer para almacenar archivos en memoria.
 * Esto es necesario para luego poder enviar el buffer a Cloudinary.
 */
const storage = multer.memoryStorage();

// Filtro de archivos: define qué tipos de archivos son aceptados.
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  if (allowedTypes.test(file.mimetype)) {
    cb(null, true); // Aceptar el archivo
  } else {
    // Rechazar el archivo con un error específico
    cb(new Error("Tipo de archivo no permitido. Solo se aceptan imágenes."), false);
  }
};

// Se crea la instancia de Multer con la configuración de memoria y el filtro.
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB por archivo
});

// Se exportan middlewares específicos para cada caso de uso.
// .single('imagen') indica que se esperará un solo archivo en el campo 'imagen' del FormData.
module.exports = {
  uploadServicioImage: upload.single("imagen"),
  uploadProductoImage: upload.single("imagen"),
  // Puedes añadir más si los necesitas
};
