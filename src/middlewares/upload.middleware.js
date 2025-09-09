// src/middlewares/upload.middleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const createUploader = (entityName) => {
  // 🚨 Forzar a que siempre guarde en src/public/uploads/[entityName]
  const uploadPath = path.join(process.cwd(), "src", "public", "uploads", entityName);

  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const extension = path.extname(file.originalname);
      cb(null, `${entityName}-${uniqueSuffix}${extension}`);
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
