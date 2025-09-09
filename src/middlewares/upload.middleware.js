const multer = require("multer");
const path = require("path");
const fs = require("fs");

const createUploader = (entityName) => {
  // 🚨 CORRECCIÓN: Usar la carpeta 'public' en la raíz del proyecto
  const uploadPath = path.join(process.cwd(), "public", "uploads", entityName);

  // Crear la carpeta si no existe
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log(`📂 Carpeta creada: ${uploadPath}`);
  } else {
    console.log(`📂 Carpeta ya existe: ${uploadPath}`);
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      console.log(`➡️ Guardando archivo en: ${uploadPath}`);
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const extension = path.extname(file.originalname);
      const filename = `${entityName}-${uniqueSuffix}${extension}`;
      console.log(`📝 Nombre final del archivo: ${filename}`);
      cb(null, filename);
    },
  });

  const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    if (allowedTypes.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de archivo no permitido. Solo se aceptan imágenes."), false);
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
  });
};

module.exports = {
  uploadServicioImage: createUploader("servicios").single("imagen"),
  uploadProductoImage: createUploader("productos").single("imagen"),
  uploadPerfilImage: createUploader("perfiles").single("foto_perfil"),
};