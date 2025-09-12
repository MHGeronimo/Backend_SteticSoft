// Configuración específica para producción (Render.com)
module.exports = {
  development: {
    username: process.env.DB_USERNAME || 'steticsoft_user',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'steticsoft',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: false, // Deshabilitar logs en producción
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    logging: false, // Deshabilitar logs en producción
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};
