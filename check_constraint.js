const knex = require('knex');
const db = knex({
  client: 'pg',
  connection: {
    host: 'localhost',
    port: 9541,
    user: 'msiserver',
    password: 'Rubysa179596!',
    database: 'bridge_sanbox'
  }
});

async function check() {
  try {
    const res = await db.raw(`
      SELECT pg_get_constraintdef(c.oid) AS constraint_def
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE c.conname = 'outbox_events_event_type_check';
    `);
    console.log(res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    db.destroy();
  }
}
check();
