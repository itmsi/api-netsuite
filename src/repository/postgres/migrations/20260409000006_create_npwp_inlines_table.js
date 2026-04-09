/**
 * Migration: Create npwp_inlines table
 */

exports.up = function(knex) {
  return knex.schema.createTable('npwp_inlines', (table) => {
    // Primary Key with Integer
    table.increments('id').primary();
    
    // Data fields
    table.string('company_name').nullable();
    table.string('abbreviation').nullable();
    table.string('nomor').nullable();
    table.string('id_type').nullable();
    table.string('country_code').nullable();
    table.string('nitku').nullable();
    
    // Timestamps and Tracking
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.uuid('created_by').nullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('updated_by').nullable();
    table.timestamp('deleted_at').nullable();
    table.uuid('deleted_by').nullable();
    table.boolean('is_delete').defaultTo(false);
    
    // Indexes
    table.index(['is_delete'], 'idx_npwp_inlines_is_delete');
    table.index(['created_at'], 'idx_npwp_inlines_created_at');
    table.index(['nomor'], 'idx_npwp_inlines_nomor');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('npwp_inlines');
};
