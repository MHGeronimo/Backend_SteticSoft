// src/routes/index.js
const express = require("express");
const router = express.Router();

// Importar las rutas de las entidades
const rolRoutes = require("./rol.routes.js");
const permisoRoutes = require("./permiso.routes.js"); // <--- NUEVA LÍNEA
// const usuarioRoutes = require('./usuario.routes.js');
// ... y así para otras entidades

// Montar las rutas de las entidades en el router principal
router.use("/roles", rolRoutes);
router.use("/permisos", permisoRoutes); // <--- NUEVA LÍNEA
// router.use('/usuarios', usuarioRoutes);
// ...

router.get("/", (req, res) => {
  res.status(200).json({
    message: "API de SteticSoft V1 - Punto de entrada /api funcionando.",
    status: "ok",
  });
});

module.exports = router;
