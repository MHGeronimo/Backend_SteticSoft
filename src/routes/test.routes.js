const express = require("express");
const fs = require("fs");
const path = require("path");
const { uploadProductoImage } = require("../middlewares/upload.middleware");

const router = express.Router();

// 📌 Ruta para subir archivo de prueba
router.post("/test-upload", uploadProductoImage, (req, res) => {
  console.log("📤 Archivo recibido en test-upload:", req.file);

  if (!req.file) {
    return res.status(400).json({ success: false, message: "No se recibió archivo" });
  }

  // Verificar si el archivo realmente existe en el disco
  const filePath = path.join(__dirname, "..", "public", "uploads", "productos", req.file.filename);
  const exists = fs.existsSync(filePath);

  return res.json({
    success: true,
    filename: req.file.filename,
    savedPath: filePath,
    existsOnDisk: exists,
  });
});

module.exports = router;
