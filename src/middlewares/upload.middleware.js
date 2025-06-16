// src/middlewares/upload.middleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createUploader = (entityName) => {
  const uploadPath = path.join(__dirname, `../../public/uploads/${entityName}s`);

  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      cb(null, `${entityName}-${uniqueSuffix}${extension}`);
    }
  });

  const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    if (allowedTypes.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se aceptan imágenes.'), false);
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
  });
};

module.exports = {
  uploadServicioImage: createUploader('servicio').single('imagen'),
  uploadProductoImage: createUploader('producto').single('imagen'),
  uploadPerfilImage: createUploader('perfil').single('foto_perfil')
};
