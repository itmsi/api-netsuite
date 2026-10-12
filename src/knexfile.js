const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

/**
 * Connection pool DB core (pgCore)
 * Prioritas: DB_POOL_MIN_<SUFFIX> / DB_POOL_MAX_<SUFFIX> -> DB_POOL_MIN / DB_POOL_MAX -> default (0 / 10)
 * min 0 + idleTimeout agar koneksi idle dilepas dan tidak menahan slot max_connections Postgres
 */
const toInt = (value, fallback) => {
  const num = parseInt(value, 10)
  return Number.isNaN(num) ? fallback : num
}

const buildPool = (suffix) => ({
  min: toInt(process.env[`DB_POOL_MIN_${suffix}`] ?? process.env.DB_POOL_MIN, 0),
  max: toInt(process.env[`DB_POOL_MAX_${suffix}`] ?? process.env.DB_POOL_MAX, 10),
  idleTimeoutMillis: toInt(process.env.DB_POOL_IDLE_TIMEOUT, 30000),
})

const acquireConnectionTimeout = toInt(process.env.DB_ACQUIRE_TIMEOUT, 60000)

module.exports = {
  development: {
    client: process.env.DB_CLIENT_DEV,
    connection: {
      host: process.env.DB_HOST_DEV,
      port: process.env.DB_PORT_DEV,
      user: process.env.DB_USER_DEV,
      password: process.env.DB_PASS_DEV,
      database: process.env.DB_NAME_DEV,
    },
    pool: buildPool('DEV'),
    acquireConnectionTimeout,
    debug: false,
    migrations: {
      tableName: 'migrations',
      directory: path.join(__dirname, 'repository/postgres/migrations'),
      loadExtensions: ['.js'],
      ignoreMissing: true
    },
    seeds: {
      directory: path.join(__dirname, 'repository/postgres/seeders'),
    }
  },
  production: {
    client: process.env.DB_CLIENT_PROD,
    connection: {
      host: process.env.DB_HOST_PROD,
      port: process.env.DB_PORT_PROD,
      user: process.env.DB_USER_PROD,
      password: process.env.DB_PASS_PROD,
      database: process.env.DB_NAME_PROD,
    },
    pool: buildPool('PROD'),
    acquireConnectionTimeout,
    debug: process.env.NODE_ENV !== 'production',
    migrations: {
      tableName: 'migrations',
      directory: path.join(__dirname, 'repository/postgres/migrations'),
      loadExtensions: ['.js'],
      ignoreMissing: true
    },
    seeds: {
      directory: path.join(__dirname, 'repository/postgres/seeders'),
    }
  },
  staging: {
    client: process.env.DB_CLIENT_TEST,
    connection: {
      host: process.env.DB_HOST_TEST,
      port: process.env.DB_PORT_TEST,
      user: process.env.DB_USER_TEST,
      password: process.env.DB_PASS_TEST,
      database: process.env.DB_NAME_TEST,
    },
    pool: buildPool('TEST'),
    acquireConnectionTimeout,
    debug: true,
    migrations: {
      tableName: 'migrations',
      directory: path.join(__dirname, 'repository/postgres/migrations'),
      loadExtensions: ['.js'],
      ignoreMissing: true
    },
    seeds: {
      directory: path.join(__dirname, 'repository/postgres/seeders'),
    }
  }
}
