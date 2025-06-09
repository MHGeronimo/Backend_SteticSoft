// src/shared/src_api/server.js
require("dotenv").config(); 

const http = require("http");
const app =require("./app.js"); 
const db = require("./models/index.js"); 
const { PORT, NODE_ENV, APP_NAME } = require("./config/env.config.js");

const server = http.createServer(app);

const startServer = async () => {
  try {
    await db.sequelize.authenticate();
    console.log(
      "✅ Conexión a la base de datos (Sequelize) establecida exitosamente."
    );

    // if (NODE_ENV === "development") {
    //   // --- INICIO DE LA MODIFICACIÓN ---
    //   // Descomenta o añade esta línea TEMPORALMENTE.
    //   // alter: true intentará añadir la nueva columna `estado_proceso` sin borrar datos.
    //   await db.sequelize.sync({ alter: true }); 
    //   // --- FIN DE LA MODIFICACIÓN ---
      
    //   console.log(
    //     "🔄 Sincronización de modelos Sequelize ejecutada con { alter: true }."
    //   );
    // }

    server.listen(PORT, () => {
      console.log(
        `🚀 Servidor '${APP_NAME}' corriendo en http://localhost:${PORT}`
      );
      console.log(`🌱 Ambiente: ${NODE_ENV}`);
    });
  } catch (error) {
    console.error(
      "❌ Error crítico al iniciar el servidor o conectar a la base de datos:",
      error
    );
    process.exit(1);
  }
};

startServer();