// src/routes/index.js
const express = require("express");
const router = express.Router();

// Importar las rutas de las entidades
const rolRoutes = require("./rol.routes.js"); // Asegúrate que esta línea esté
// const usuarioRoutes = require('./usuario.routes.js');

// Montar las rutas de las entidades en el router principal
router.use("/roles", rolRoutes); // Y esta línea también
// router.use('/usuarios', usuarioRoutes);

router.get("/", (req, res) => {
  res.status(200).json({
    message:
      "Punto de entrada de la API de SteticSoft V1 Funcionando. Bienvenido!",
    status: "ok",
  });
});

module.exports = router;
