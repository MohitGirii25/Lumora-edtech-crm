
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '.env')
});

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 20000,
  max: 1
});

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');

    const result = await pool.query('SELECT NOW()');

    console.log('Database connected successfully!');
    console.log('Database time:', result.rows[0].now);

  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.error('Error code:', error.code || 'N/A');
  } finally {
    await pool.end();
  }
}

testConnection();
