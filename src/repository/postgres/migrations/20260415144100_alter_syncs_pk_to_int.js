/**
 * Migration: Alter syncs table - change sync_id from UUID to int auto increment
 * and update created_by, updated_by, deleted_by from uuid to varchar
 */

exports.up = async function(knex) {
  // Drop table and recreate with new schema (simplest approach for type change on PK)
  await knex.schema.dropTable('syncs');

  await knex.schema.createTable('syncs', (table) => {
    // Primary Key - int auto increment
    table.increments('sync_id').primary();

    // Data fields
    table.string('sync_module', 255).nullable();
    table.string('sync_status').nullable();

    // Timestamps and Tracking
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.string('created_by', 255).nullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.string('updated_by', 255).nullable();
    table.timestamp('deleted_at').nullable();
    table.string('deleted_by', 255).nullable();
    table.boolean('is_delete').defaultTo(false);

    // Indexes
    table.index(['is_delete'], 'idx_syncs_is_delete');
    table.index(['sync_module'], 'idx_syncs_module');
    table.index(['created_at'], 'idx_syncs_created_at');
  });
};

exports.down = async function(knex) {
  // Rollback: drop int table and recreate with UUID
  await knex.schema.dropTable('syncs');

  await knex.schema.createTable('syncs', (table) => {
    table.uuid('sync_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.string('sync_module', 255).nullable();
    table.string('sync_status').nullable();

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.uuid('created_by').nullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('updated_by').nullable();
    table.timestamp('deleted_at').nullable();
    table.uuid('deleted_by').nullable();
    table.boolean('is_delete').defaultTo(false);

    table.index(['is_delete'], 'idx_syncs_is_delete');
    table.index(['sync_module'], 'idx_syncs_module');
    table.index(['created_at'], 'idx_syncs_created_at');
  });
};
