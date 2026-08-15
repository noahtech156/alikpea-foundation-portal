const { Sequelize } = require('sequelize');
const path = require('path');

const envDialect = (process.env.DB_DIALECT || (process.env.NODE_ENV === 'production' ? 'sqlite' : 'mysql')).toLowerCase();
const dbName = 'railway';
const dbUser = 'root';
const dbPassword = '';
const dbHost = 'mysql.railway.internal';
const dbPort = 3306;

let sequelize;

if (envDialect === 'mysql') {
  sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: 'mysql',
    logging: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
    // Sequelize coerces a falsy password (e.g. '') to `null` internally
    // (see lib/sequelize.js: `config.password || this.options.password || null`),
    // which causes mysql2 to omit the password entirely and MySQL then
    // rejects the connection with "using password: NO". Explicitly set the
    // password via dialectOptions so mysql2 always receives an empty string.
    dialectOptions: {
      password: dbPassword
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
  if (envDialect !== 'mysql') return;

  const adminConnection = new Sequelize('mysql', dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: 'mysql',
    logging: false,
    pool: { max: 1, min: 0, acquire: 30000, idle: 10000 },
    dialectOptions: {
      password: dbPassword
    }
  });

  try {
    await adminConnection.authenticate();
    await adminConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Ensured MySQL database exists: ${dbName}`);
  } finally {
    await adminConnection.close();
  }
}

module.exports = { sequelize, ensureDatabaseExists };
