const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createUploader = (entityName) => {
  // CORRECCIÓN: La ruta ahora apunta a una carpeta 'public' que crearemos dentro de 'src_api'.
  // Esto hace más fácil servir los archivos estáticamente.
  // La ruta resuelta será algo como: .../src_api/public/uploads/productos
  const uploadPath = path.join(__dirname, '..', 'public', 'uploads', entityName);

  // Asegurarse de que el directorio de subida exista
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // Se mantiene la lógica para nombres de archivo únicos. ¡Está perfecta!
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      cb(null, `${entityName}-${uniqueSuffix}${extension}`);
    }
  });

  const fileFilter = (req, file, cb) => {
    // Se mantiene el filtro de imágenes. ¡Excelente!
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
    limits: { fileSize: 5 * 1024 * 1024 } // Límite de 5MB
  });
};

// Se mantienen tus exportaciones. ¡Están correctas!
module.exports = {
  uploadServicioImage: createUploader('servicios').single('imagen'),
  uploadProductoImage: createUploader('productos').single('imagen'),
  uploadPerfilImage: createUploader('perfiles').single('foto_perfil')
};