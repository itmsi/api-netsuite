/**
 * Migration to alter invoice_sales_orders id column to uuid
 */

exports.up = async function(knex) {
  // Drop the current default (sequence)
  await knex.raw('ALTER TABLE "invoice_sales_orders" ALTER COLUMN "id" DROP DEFAULT');
  
  // Alter column type to UUID and set default to uuid_generate_v4()
  await knex.raw('ALTER TABLE "invoice_sales_orders" ALTER COLUMN "id" TYPE uuid USING (uuid_generate_v4())');
  await knex.raw('ALTER TABLE "invoice_sales_orders" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()');
};

exports.down = async function(knex) {
  // Revert back to integer
  await knex.raw('ALTER TABLE "invoice_sales_orders" ALTER COLUMN "id" DROP DEFAULT');
  
  // Cast back to integer (will fail if there are actual UUIDs, but handles empty/mock data)
  await knex.raw('ALTER TABLE "invoice_sales_orders" ALTER COLUMN "id" TYPE integer USING 1');
  
  // Create sequence if it doesn't exist and set as default
  await knex.raw('CREATE SEQUENCE IF NOT EXISTS invoice_sales_orders_id_seq');
  await knex.raw('ALTER TABLE "invoice_sales_orders" ALTER COLUMN "id" SET DEFAULT nextval(\'invoice_sales_orders_id_seq\'::regclass)');
};
