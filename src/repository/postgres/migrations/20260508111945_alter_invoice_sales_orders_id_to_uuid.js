/**
 * Migration: Alter invoice_sales_orders table - change id to uuid
 */

exports.up = async function(knex) {
  // Drop the existing integer primary key
  await knex.schema.alterTable('invoice_sales_orders', (table) => {
    table.dropColumn('id');
  });

  // Add the new UUID primary key
  await knex.schema.alterTable('invoice_sales_orders', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
  });
};

exports.down = async function(knex) {
  // Rollback: drop the UUID primary key
  await knex.schema.alterTable('invoice_sales_orders', (table) => {
    table.dropColumn('id');
  });

  // Add back the integer auto-increment primary key
  await knex.schema.alterTable('invoice_sales_orders', (table) => {
    table.increments('id').primary();
  });
};
