// src/routes/index.js
const express = require("express");
const router = express.Router(); // Paso 1: Crear una instancia del Router de Express

// (Aquí es donde más adelante importarás y usarás tus otras rutas, como rol.routes.js)
// Ejemplo:
// const rolRoutes = require('./rol.routes.js');
// router.use('/roles', rolRoutes);

// Ruta de prueba para verificar que este router funciona
router.get("/", (req, res) => {
  res.status(200).json({
    message: "Punto de entrada de /api funcionando correctamente!",
    status: "ok",
  });
});

// Paso 2: Exportar la instancia del router
module.exports = router;
