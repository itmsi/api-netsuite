const knex = require('knex')

const knexfile = require('../knexfile')
const { Logger } = require('../utils/logger')

const toInt = (value, fallback) => {
  const num = parseInt(value, 10)
  return Number.isNaN(num) ? fallback : num
}

// Query di atas threshold ini dicatat sebagai [SLOW_QUERY] (ms)
const SLOW_QUERY_MS = toInt(process.env.DB_SLOW_QUERY_MS, 500)
const MAX_SQL_LENGTH = 300
const MAX_BINDING_LENGTH = 200

// Binding bisa berisi data besar (mis. payload / Base64) -> dipotong agar log tetap ringkas
const formatBindings = (bindings) =>
  (bindings || []).map((value) =>
    typeof value === 'string' && value.length > MAX_BINDING_LENGTH
      ? `${value.slice(0, MAX_BINDING_LENGTH)}...[${value.length} chars]`
      : value
  )

/**
 * Pasang logger slow query & query error pada instance knex.
 * Event knex berlaku global untuk semua query yang memakai instance tersebut.
 * @param {string} dbName - label DB di log ('core' / 'netsuite')
 */
const attachQueryLogger = (instance, dbName) => {
  const startTimes = new Map()

  const takeDuration = (query) => {
    const start = startTimes.get(query.__knexQueryUid)
    startTimes.delete(query.__knexQueryUid)
    return start ? Date.now() - start : null
  }

  instance.on('query', (query) => {
    startTimes.set(query.__knexQueryUid, Date.now())
  })

  instance.on('query-response', (_response, query) => {
    const ms = takeDuration(query)
    if (ms !== null && ms > SLOW_QUERY_MS) {
      Logger.warn('[SLOW_QUERY]', {
        db: dbName,
        ms,
        sql: String(query.sql || '').slice(0, MAX_SQL_LENGTH),
        bindings: formatBindings(query.bindings)
      })
    }
  })

  instance.on('query-error', (error, query) => {
    const ms = takeDuration(query)
    Logger.error('[QUERY_ERROR]', {
      db: dbName,
      ms,
      sql: String(query.sql || '').slice(0, MAX_SQL_LENGTH),
      bindings: formatBindings(query.bindings),
      message: error.message,
      code: error.code
    })
  })

  return instance
}

const env = process.env.NODE_ENV || 'development'
const configCore = knexfile[env]

const pgCore = attachQueryLogger(knex(configCore), 'core')

const dbNetsuite = attachQueryLogger(knex({
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
}), 'netsuite')

module.exports = {
  pgCore,
  dbNetsuite
}
