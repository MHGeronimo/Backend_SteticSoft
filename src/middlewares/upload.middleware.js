// src/shared/src_api/middlewares/upload.middleware.js
const multer = require("multer");

// Usamos almacenamiento en memoria para simplicidad.
// La imagen estará disponible en req.file.buffer.
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

module.exports = upload;
