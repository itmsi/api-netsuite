/**
 * Migration: Create syncs table
 */

exports.up = function(knex) {
  return knex.schema.createTable('syncs', (table) => {
    // Primary Key with UUID
    table.uuid('sync_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Data fields
    table.string('sync_module', 255).nullable();
    table.string('sync_status').nullable();
    
    // Timestamps and Tracking
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.uuid('created_by').nullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('updated_by').nullable();
    table.timestamp('deleted_at').nullable();
    table.uuid('deleted_by').nullable();
    table.boolean('is_delete').defaultTo(false);
    
    // Indexes
    table.index(['is_delete'], 'idx_syncs_is_delete');
    table.index(['sync_module'], 'idx_syncs_module');
    table.index(['created_at'], 'idx_syncs_created_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('syncs');
};
