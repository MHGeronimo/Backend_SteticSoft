// src/config/sequelize.config.js
const { Sequelize } = require("sequelize");
// IMPORTA LAS VARIABLES DE ENTORNO NECESARIAS DESDE env.config.js
const {
  DB_NAME,
  DB_USER,
  DB_PASS,
  DB_HOST,
  DB_PORT,
  DB_DIALECT,
  IS_PRODUCTION,
  NODE_ENV, 
  // DATABASE_URL_PROD, // Si usas una URL de conexión para producción
} = require("./env.config"); // Importar variables de entorno centralizadas

const commonOptions = {
  dialect: DB_DIALECT,
  logging: IS_PRODUCTION ? false : console.log,
  define: {
    timestamps: false,
    freezeTableName: true,
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

let sequelize;

if (IS_PRODUCTION) {
  console.log(
    "🟡 Configurando Sequelize para PostgreSQL (Producción con variables individuales) desde sequelize.config.js"
  );
  if (!DB_NAME || !DB_USER || !DB_PASS || !DB_HOST || !DB_PORT) {
    console.error(
      "❌ Faltan variables de entorno de base de datos para producción en Sequelize."
    );
    process.exit(1);
  }
  sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    port: DB_PORT,
    ...commonOptions,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // ¡REVISAR ESTO CUIDADOSAMENTE PARA PRODUCCIÓN!
      },
    },
  });
} else {
  // Desarrollo o Test
  console.log(
    `🟢 Configurando Sequelize para PostgreSQL (${
      NODE_ENV || "Local"
    }) desde sequelize.config.js`
  ); // Ahora NODE_ENV está definido
  if (!DB_NAME || !DB_USER || !DB_PASS || !DB_HOST || !DB_PORT) {
    console.error(
      `❌ Faltan variables de entorno de base de datos para ${
        NODE_ENV || "desarrollo/test"
      } en Sequelize.`
    );
    process.exit(1);
  }
  sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    port: DB_PORT,
    ...commonOptions,
  });
}

module.exports = sequelize;
