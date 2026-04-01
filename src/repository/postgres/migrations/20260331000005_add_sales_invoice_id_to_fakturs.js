/**
 * Migration: Add sales_invoice_id to fakturs table
 */

exports.up = function(knex) {
  return knex.schema.alterTable('fakturs', (table) => {
    table.integer('sales_invoice_id').nullable();
    
    // Index for faster lookups during sync
    table.index(['sales_invoice_id'], 'idx_fakturs_sales_invoice_id');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('fakturs', (table) => {
    table.dropIndex(['sales_invoice_id'], 'idx_fakturs_sales_invoice_id');
    table.dropColumn('sales_invoice_id');
  });
};
