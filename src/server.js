// src/server.js
require("dotenv").config(); // Cargar variables de entorno lo antes posible

const http = require("http");
const app = require("./app"); // Importar la aplicación Express configurada
const db = require("./models"); // Para la conexión Sequelize
const { PORT, NODE_ENV, APP_NAME } = require("./config/env.config"); // Variables de entorno centralizadas

const server = http.createServer(app);

const startServer = async () => {
  try {
    // Verificar conexión a la base de datos con Sequelize
    await db.sequelize.authenticate();
    console.log(
      "✅ Conexión a la base de datos (Sequelize) establecida exitosamente."
    );

    // Sincronizar modelos (SOLO PARA DESARROLLO y con PRECAUCIÓN)
    if (NODE_ENV === "development") {
      // await db.sequelize.sync(); // Crea tablas si no existen, no altera si ya coinciden.
      // await db.sequelize.sync({ alter: true }); // Intenta alterar tablas. ¡Precaución!
      // await db.sequelize.sync({ force: true }); // ¡PELIGRO! Borra y recrea tablas.
      // console.log(
      //   "🔄 Sincronización de modelos Sequelize verificada/ejecutada (modo desarrollo)."
      // );
    }

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
    process.exit(1); // Salir si hay un error crítico al inicio
  }
};

startServer();
