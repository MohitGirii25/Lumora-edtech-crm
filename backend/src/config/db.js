const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  throw new Error('DATABASE_URL is missing. Add it to backend/.env as DATABASE_URL=postgresql://...');
}

let connectionUrl;
try {
  connectionUrl = new URL(connectionString);
} catch {
  throw new Error('DATABASE_URL is not a valid PostgreSQL connection URL. Copy the URI from Supabase > Connect.');
}
if (!['postgres:', 'postgresql:'].includes(connectionUrl.protocol)) {
  throw new Error('DATABASE_URL must use the postgres:// or postgresql:// protocol.');
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
  max: 10
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.code || 'unknown error');
});

module.exports = pool;
