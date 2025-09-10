const multer = require("multer");

// Usamos memoryStorage (archivos en RAM, no en disco)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  if (allowedTypes.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de archivo no permitido. Solo imágenes JPG, PNG, GIF o WEBP."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = {
  uploadProductoImage: upload.single("imagen"),
  uploadServicioImage: upload.single("imagen"),
  uploadPerfilImage: upload.single("imagen"),
};
