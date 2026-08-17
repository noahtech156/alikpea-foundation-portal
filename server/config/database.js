const { Sequelize } = require('sequelize');
const path = require('path');

const envDialect = (
  process.env.DB_DIALECT || 'mysql'
).toLowerCase();

const dbName = process.env.DB_NAME || 'defaultdb';
const dbUser = process.env.DB_USER || 'avnadmin';
const dbPassword = process.env.DB_PASSWORD || '';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = Number(process.env.DB_PORT || 3306);

let sequelize;

if (envDialect === 'mysql') {
  sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: 'mysql',
    logging: false,

    // Aiven requires SSL
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },

    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',

    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../database.sqlite'),
    logging: false
  });
}

async function ensureDatabaseExists() {
  // Aiven already provides the database,
  // so we don't need to create it ourselves.
  if (envDialect !== 'mysql') return;

  try {
    await sequelize.authenticate();
    console.log('✅ Connected to MySQL database');
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    throw error;
  }
}

module.exports = {
  sequelize,
  ensureDatabaseExists
};
