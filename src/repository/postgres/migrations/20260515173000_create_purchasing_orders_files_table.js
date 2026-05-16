/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('purchasing_orders_files', function (table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('po_id').notNullable();
    table.string('file_name').notNullable();
    table.string('storage_provider').notNullable().defaultTo('nextcloud');
    table.string('storage_path').notNullable();
    table.string('share_url').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('purchasing_orders_files');
};
