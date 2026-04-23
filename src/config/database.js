const knex = require('knex')

const knexfile = require('../knexfile')

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
  }
})

module.exports = {
  pgCore,
  dbNetsuite
}
