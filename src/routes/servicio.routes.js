// src/routes/servicio.routes.js
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const servicioController = require("../controllers/servicio.controller.js");
const servicioValidators = require("../validators/servicio.validators.js");

const authMiddleware = require("../middlewares/auth.middleware.js");
const {
  checkPermission,
} = require("../middlewares/authorization.middleware.js");

const PERMISO_MODULO_SERVICIOS = "MODULO_SERVICIOS_GESTIONAR";

// Multer configuration for file uploads
const uploadDir = path.join(__dirname, "..", "..", "uploads", "servicios");

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

router.post(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  upload.single("imagen"), // Multer middleware for single image upload
  servicioValidators.crearServicioValidators,
  servicioController.crearServicio
);

router.get(
  "/",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  servicioController.listarServicios
);

router.get(
  "/:idServicio",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  servicioValidators.idServicioValidator,
  servicioController.obtenerServicioPorId
);

router.put(
  "/:idServicio",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  upload.single("imagen"), // Multer middleware for single image upload
  servicioValidators.actualizarServicioValidators,
  servicioController.actualizarServicio
);

// NUEVA RUTA: Cambiar el estado de un servicio
router.patch(
  "/:idServicio/estado",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  servicioValidators.cambiarEstadoServicioValidators,
  servicioController.cambiarEstadoServicio
);

router.delete(
  "/:idServicio",
  authMiddleware,
  checkPermission(PERMISO_MODULO_SERVICIOS),
  servicioValidators.idServicioValidator,
  servicioController.eliminarServicioFisico
);

module.exports = router;
