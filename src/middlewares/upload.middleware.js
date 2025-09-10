const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Función para crear una configuración de almacenamiento de Multer para un subdirectorio específico
const createDiskStorage = (subdirectory) => {
  const destinationPath = path.join(__dirname, '..', 'public', 'uploads', subdirectory);

  // Asegurarse de que el directorio de destino exista
  fs.mkdirSync(destinationPath, { recursive: true });

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destinationPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
  });
};

// Filtro de archivos para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  if (allowedTypes.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de archivo no permitido. Solo imágenes JPG, PNG, GIF o WEBP."), false);
  }
};

// Límite de tamaño de archivo
const limits = { fileSize: 5 * 1024 * 1024 }; // 5MB

// Crear una instancia de Multer para cada tipo de subida
const createUploader = (subdirectory) => {
  const storage = createDiskStorage(subdirectory);
  return multer({
    storage,
    fileFilter,
    limits,
  });
};

// Exportar los middlewares de subida específicos
module.exports = {
  uploadProductoImage: createUploader("productos").single("imagen"),
  uploadServicioImage: createUploader("servicios").single("imagen"),
  uploadPerfilImage: createUploader("perfil").single("imagen"),
};
