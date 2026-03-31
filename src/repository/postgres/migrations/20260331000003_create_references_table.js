/**
 * Migration: Create references table
 */

exports.up = function(knex) {
  return knex.schema.createTable('references', (table) => {
    // Primary Key with UUID
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Data fields
    table.string('type').nullable();
    table.string('code').nullable();
    table.text('description').nullable();
    table.string('code_transaksi').nullable();
    
    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['type'], 'idx_references_type');
    table.index(['code'], 'idx_references_code');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('references');
};
