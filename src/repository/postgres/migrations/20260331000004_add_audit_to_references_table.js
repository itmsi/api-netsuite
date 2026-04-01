/**
 * Migration: Add audit columns to references table
 */

exports.up = function(knex) {
  return knex.schema.alterTable('references', (table) => {
    table.uuid('created_by').nullable();
    table.uuid('updated_by').nullable();
    table.uuid('deleted_by').nullable();
    table.timestamp('deleted_at').nullable();
    table.boolean('is_delete').defaultTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('references', (table) => {
    table.dropColumn('created_by');
    table.dropColumn('updated_by');
    table.dropColumn('deleted_by');
    table.dropColumn('deleted_at');
    table.dropColumn('is_delete');
  });
};
