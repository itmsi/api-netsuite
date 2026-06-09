/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // We use process.env to dynamically connect to the gate_sso db from the netsuite db
  const host = process.env.DB_HOST_DEV || 'localhost';
  const port = process.env.DB_PORT_DEV || '9541';
  const dbName = process.env.DB_NAME_DEV || 'gate_sso';
  const dbUser = process.env.DB_USER_DEV || 'msiserver';
  const dbPass = process.env.DB_PASS_DEV || 'Rubysa179596!';

  // 1. Create extension for Foreign Data Wrapper
  await knex.raw('CREATE EXTENSION IF NOT EXISTS postgres_fdw;');

  // 2. Create the remote server
  await knex.raw(`
    CREATE SERVER IF NOT EXISTS gate_sso_server
    FOREIGN DATA WRAPPER postgres_fdw
    OPTIONS (host '${host}', port '${port}', dbname '${dbName}');
  `);

  // 3. Create user mapping for the current user
  await knex.raw(`
    CREATE USER MAPPING IF NOT EXISTS FOR CURRENT_USER
    SERVER gate_sso_server
    OPTIONS (user '${dbUser}', password '${dbPass}');
  `);

  // 4. Create the foreign table
  await knex.raw(`
    CREATE FOREIGN TABLE IF NOT EXISTS gate_sso_employees (
      employee_id uuid,
      employee_name varchar(255),
      employee_email varchar(255)
    )
    SERVER gate_sso_server
    OPTIONS (schema_name 'public', table_name 'employees');
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw('DROP FOREIGN TABLE IF EXISTS gate_sso_employees;');
  await knex.raw('DROP USER MAPPING IF EXISTS FOR CURRENT_USER SERVER gate_sso_server;');
  await knex.raw('DROP SERVER IF EXISTS gate_sso_server CASCADE;');
  // Note: we don't drop the extension as it might be used by other foreign tables
};
