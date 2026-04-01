const knex = require('knex');
const path = require('path');
const fs = require('fs');
const knexfile = require('../knexfile');

const env = process.env.NODE_ENV || 'development';
const config = knexfile[env];

if (!config) {
  console.error(`Error: Configuration for environment "${env}" not found in knexfile.js`);
  process.exit(1);
}

const db = knex(config);

async function cleanup() {
  try {
    const migrationsDir = config.migrations.directory;
    const tableName = config.migrations.tableName || 'migrations';
    
    console.log(`[${env}] Checking "${tableName}" table for missing files in: ${migrationsDir}`);
    
    // Check if table exists
    const tableExists = await db.schema.hasTable(tableName);
    if (!tableExists) {
      console.log(`Table "${tableName}" does not exist. No cleanup needed.`);
      process.exit(0);
    }

    // Get all records from migrations table
    const records = await db(tableName).select('name');
    console.log(`Found ${records.length} migration records in database.`);
    
    const missing = records.filter(r => {
      const filePath = path.join(migrationsDir, r.name);
      const exists = fs.existsSync(filePath);
      return !exists;
    });
    
    if (missing.length > 0) {
      console.log(`Found ${missing.length} missing migration files locally. Deleting from database...`);
      const namesToDelete = missing.map(m => m.name);
      
      // Delete in chunks if too many
      const chunkSize = 50;
      for (let i = 0; i < namesToDelete.length; i += chunkSize) {
        const chunk = namesToDelete.slice(i, i + chunkSize);
        await db(tableName).whereIn('name', chunk).del();
      }
      
      console.log(`Successfully deleted ${missing.length} records.`);
    } else {
      console.log('No missing migration files found. Database is consistent with filesystem.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Migration cleanup failed:', err);
    process.exit(1);
  }
}

cleanup();
