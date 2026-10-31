const pool = require('../config/db');
const bcrypt = require('bcrypt');

async function ensureAdminTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(254) NOT NULL UNIQUE,
      password_hash VARCHAR(100) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function findAdminByEmail(email) {
  const { rows } = await pool.query(
    'SELECT id, name, email, password_hash FROM admins WHERE LOWER(email) = $1 LIMIT 1',
    [email.toLowerCase()]
  );
  return rows[0];
}

async function createAdminIfMissing({ name, email, password }) {
  const existing = await findAdminByEmail(email.trim());
  if (existing) return null;
  const passwordHash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    `INSERT INTO admins (name, email, password_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO NOTHING
     RETURNING id, name, email`,
    [name.trim(), email.trim().toLowerCase(), passwordHash]
  );
  return rows[0] || null;
}

module.exports = { ensureAdminTable, findAdminByEmail, createAdminIfMissing };
