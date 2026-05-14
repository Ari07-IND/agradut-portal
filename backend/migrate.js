const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    const schemaSql = fs.readFileSync('./schema.sql', 'utf8');
    console.log('Running schema.sql against your Neon database...');
    await pool.query(schemaSql);
    console.log('✅ Success! All database tables created successfully.');
  } catch (err) {
    console.error('❌ Error creating tables:', err.message);
  } finally {
    pool.end();
  }
}

runMigration();
