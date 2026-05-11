/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('po_status', function(table) {
    table.increments('id').primary();
    table.string('code').notNullable();
    table.string('name').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.string('created_by');
    table.timestamp('update_at');
    table.string('update_by');
    table.boolean('is_deleted').defaultTo(false);
    table.timestamp('deleted_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('po_status');
};
