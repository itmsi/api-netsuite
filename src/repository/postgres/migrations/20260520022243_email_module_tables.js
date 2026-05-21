/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Email Templates Table
  await knex.schema.createTable('email_templates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('code').notNullable().unique();
    table.string('name').notNullable();
    table.string('subject').notNullable();
    table.text('html_content').notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 2. Email Queue Table
  await knex.schema.createTable('email_queue', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('template_id').references('id').inTable('email_templates').onDelete('SET NULL');
    table.string('to_email').notNullable();
    table.string('cc_email');
    table.string('subject');
    table.jsonb('payload').notNullable();
    table.jsonb('attachments');
    table.string('status').defaultTo('PENDING'); // PENDING, PROCESSING, COMPLETED, FAILED
    table.integer('retry_count').defaultTo(0);
    table.text('error_message');
    table.timestamp('scheduled_at').defaultTo(knex.fn.now());
    table.timestamp('processed_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 3. Email Logs Table
  await knex.schema.createTable('email_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('queue_id').references('id').inTable('email_queue').onDelete('CASCADE');
    table.string('provider_used').notNullable(); // mailtrap, zoho, gmail, etc
    table.string('message_id');
    table.string('status').notNullable(); // SUCCESS, FAILED
    table.text('response_details');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('email_logs');
  await knex.schema.dropTableIfExists('email_queue');
  await knex.schema.dropTableIfExists('email_templates');
};
