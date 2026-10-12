const knex = require('knex')

const knexfile = require('../knexfile')

const toInt = (value, fallback) => {
  const num = parseInt(value, 10)
  return Number.isNaN(num) ? fallback : num
}

const env = process.env.NODE_ENV || 'development'
const configCore = knexfile[env]

const pgCore = knex(configCore)

const dbNetsuite = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST_NETSUITE || 'localhost',
    port: parseInt(process.env.DB_PORT_NETSUITE) || 9541,
    user: process.env.DB_USER_NETSUITE || 'msiserver',
    password: process.env.DB_PASS_NETSUITE,
    database: process.env.DB_NAME_NETSUITE || 'bridge_sanbox'
  },
  // Satu-satunya pool ke DB Netsuite: semua module wajib memakai instance ini,
  // jangan membuat knex({...}) baru (tiap instance = pool baru = koneksi idle tambahan)
  pool: {
    min: toInt(process.env.DB_POOL_MIN_NETSUITE, 0),
    max: toInt(process.env.DB_POOL_MAX_NETSUITE, 10),
    idleTimeoutMillis: toInt(process.env.DB_POOL_IDLE_TIMEOUT, 30000)
  },
  acquireConnectionTimeout: toInt(process.env.DB_ACQUIRE_TIMEOUT, 60000)
})

module.exports = {
  pgCore,
  dbNetsuite
}
