// src/config/sequelize.config.js
const { Sequelize } = require("sequelize");
const {
  DB_NAME,
  DB_USER,
  DB_PASS,
  DB_HOST,
  DB_PORT,
  DB_DIALECT,
  IS_PRODUCTION,
  DATABASE_URL,
  NODE_ENV,
} = require("./env.config"); //

const commonOptions = {
  dialect: DB_DIALECT || "postgres",
  logging: console.log,
  define: {
    timestamps: false,
    freezeTableName: true,
  },
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
};

let sequelize;

if (IS_PRODUCTION && DATABASE_URL) {
  console.log(
    "🟢 Configurando Sequelize para PostgreSQL (Producción con DATABASE_URL) desde sequelize.config.js"
  );
  sequelize = new Sequelize(DATABASE_URL, {
    ...commonOptions,
    dialectOptions: {
      ssl: {
        // SE ELIMINÓ 'require: true' de aquí
        rejectUnauthorized: false, // Crucial para los certificados autofirmados de Render
      },
    },
  });
} else if (IS_PRODUCTION) {
  // Fallback si DATABASE_URL no está pero es producción
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
        // SE ELIMINÓ 'require: true' de aquí también por consistencia
        rejectUnauthorized: false, // Crucial para los certificados autofirmados de Render
      },
    },
  });
} else {
  // Desarrollo o Prueba
  console.log(
    `🟢 Configurando Sequelize para PostgreSQL (${
      NODE_ENV || "Local"
    }) desde sequelize.config.js`
  );
  if (!DB_NAME || !DB_USER || !DB_PASS || !DB_HOST || !DB_PORT) {
    console.error(
      `❌ Faltan variables de entorno de base de datos para ${
        NODE_ENV || "desarrollo/prueba"
      } en Sequelize.`
    );
    process.exit(1);
  }
  sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    port: DB_PORT,
    ...commonOptions,
    // No se necesitan opciones SSL para el desarrollo local típico sin SSL
  });
}

module.exports = sequelize;
