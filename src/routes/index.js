// src/routes/index.js
const express = require("express");
const router = express.Router();

// Importar las rutas de las entidades
const rolRoutes = require("./rol.routes.js");
const permisoRoutes = require("./permiso.routes.js");
const usuarioRoutes = require("./usuario.routes.js");
const estadoRoutes = require("./estado.routes.js");
const clienteRoutes = require("./cliente.routes.js");
const empleadoRoutes = require("./empleado.routes.js");
const especialidadRoutes = require("./especialidad.routes.js"); // <--- NUEVA LÍNEA
// ... y así para otras entidades

// Montar las rutas de las entidades en el router principal
router.use("/roles", rolRoutes);
router.use("/permisos", permisoRoutes);
router.use("/usuarios", usuarioRoutes);
router.use("/estados", estadoRoutes);
router.use("/clientes", clienteRoutes);
router.use("/empleados", empleadoRoutes);
router.use("/especialidades", especialidadRoutes); // <--- NUEVA LÍNEA
// ...

router.get("/", (req, res) => {
  res.status(200).json({
    message: "API de SteticSoft V1 - Punto de entrada /api funcionando.",
    status: "ok",
  });
});

module.exports = router;
