// src/config/sequelize.config.js
const { Sequelize } = require("sequelize");
const {
  // Variables individuales (fallback o para pg.Pool si no usa DATABASE_URL)
  DB_NAME,
  DB_USER,
  DB_PASS,
  DB_HOST,
  DB_PORT,
  DB_DIALECT,
  // Variables de entorno y para producción
  IS_PRODUCTION,
  DATABASE_URL, 
  DB_SSL_REQUIRED,
  DB_REJECT_UNAUTHORIZED,
  NODE_ENV,
} = require("./env.config");

const commonOptions = {
  dialect: DB_DIALECT || "postgres",
  logging: IS_PRODUCTION ? false : console.log,
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
    // Usar DATABASE_URL directamente
    ...commonOptions,
    dialectOptions: {
      ssl: {
        // Render requiere SSL
        require: true,
        // Para Render, rejectUnauthorized: false es comúnmente necesario
        // si no estás proporcionando el certificado CA de Render.
        rejectUnauthorized:
          DB_REJECT_UNAUTHORIZED !== undefined ? DB_REJECT_UNAUTHORIZED : false,
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
        require: DB_SSL_REQUIRED !== undefined ? DB_SSL_REQUIRED : true,
        rejectUnauthorized:
          DB_REJECT_UNAUTHORIZED !== undefined ? DB_REJECT_UNAUTHORIZED : false,
      },
    },
  });
} else {
  // Desarrollo o Test
  console.log(
    `🟢 Configurando Sequelize para PostgreSQL (${
      NODE_ENV || "Local"
    }) desde sequelize.config.js`
  );
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
    // No se necesita SSL para localhost usualmente
  });
}

module.exports = sequelize;
