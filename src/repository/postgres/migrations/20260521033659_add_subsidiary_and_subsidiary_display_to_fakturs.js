/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('fakturs', function(table) {
    table.string('subsidiary').nullable();
    table.string('subsidiary_display').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('fakturs', function(table) {
    table.dropColumn('subsidiary');
    table.dropColumn('subsidiary_display');
  });
};
