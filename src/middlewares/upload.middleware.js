const multer = require("multer");
const path = require("path");
const fs = require("fs");

const createUploader = (entityName) => {
   // Construir la ruta de forma robusta usando __dirname para evitar problemas en distintos entornos
  const uploadPath = path.join(process.cwd(), "public", "uploads", entityName);

  console.log(`🔧 Configurando uploader para: ${entityName}`);
  console.log(`📁 Ruta de destino: ${uploadPath}`);

  // Crear la carpeta si no existe
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log(`📂 Carpeta creada: ${uploadPath}`);
  } else {
    console.log(`📂 Carpeta ya existe: ${uploadPath}`);
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      console.log(`➡️ Multer intentando guardar en: ${uploadPath}`);
      console.log(`📄 Archivo recibido: ${file.originalname}`);
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
    console.log(`🔍 Verificando tipo de archivo: ${file.mimetype}`);
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    if (allowedTypes.test(file.mimetype)) {
      console.log(`✅ Tipo de archivo permitido: ${file.mimetype}`);
      cb(null, true);
    } else {
      console.log(`❌ Tipo de archivo NO permitido: ${file.mimetype}`);
      cb(new Error("Tipo de archivo no permitido. Solo se aceptan imágenes."), false);
    }
  };

  const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  return upload.single("imagen");
};

module.exports = {
  uploadServicioImage: createUploader("servicios"),
  uploadProductoImage: createUploader("productos"), 
  uploadPerfilImage: createUploader("perfiles"),
};