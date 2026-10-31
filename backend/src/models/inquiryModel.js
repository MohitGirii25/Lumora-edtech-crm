const pool = require('../config/db');

async function ensureInquiryTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id BIGSERIAL PRIMARY KEY,
      full_name VARCHAR(160) NOT NULL,
      email VARCHAR(254) NOT NULL,
      phone VARCHAR(24) NOT NULL,
      user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('PARENT','STUDENT','SCHOOL')),
      category VARCHAR(24) NOT NULL CHECK (category IN ('SCHOLARSHIP','CONCERT','ADMISSION','GENERAL_QUERY')),
      message TEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW','IN_PROGRESS','RESOLVED')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_inquiries_category ON inquiries(category);
    CREATE INDEX IF NOT EXISTS idx_inquiries_user_type ON inquiries(user_type);
    CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status)
  `);
}

const inquiryFromRow = (row) => row && ({
  id: row.id, fullName: row.full_name, email: row.email, phone: row.phone,
  userType: row.user_type, category: row.category, message: row.message,
  status: row.status, createdAt: row.created_at, updatedAt: row.updated_at
});

async function createInquiry(data) {
  const { fullName, email, phone, userType, category, message } = data;
  const { rows } = await pool.query(
    `INSERT INTO inquiries (full_name,email,phone,user_type,category,message)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [fullName.trim(), email.trim().toLowerCase(), phone.trim(), userType, category, message.trim()]
  );
  return inquiryFromRow(rows[0]);
}

async function listInquiries({ category, userType, status, search, sort = 'newest', page=0, size=10 }) {
  const offset = page * size;
  const params = [];
  let where = 'WHERE 1=1';
  if (category) { params.push(category); where += ` AND category=$${params.length}`; }
  if (userType) { params.push(userType); where += ` AND user_type=$${params.length}`; }
  if (status) { params.push(status); where += ` AND status=$${params.length}`; }
  if (search) { params.push(`%${search}%`); where += ` AND (full_name ILIKE $${params.length} OR phone ILIKE $${params.length})`; }
  params.push(size, offset);
  const ordering = sort === 'oldest' ? 'ASC' : 'DESC';
  const { rows } = await pool.query(`SELECT * FROM inquiries ${where} ORDER BY created_at ${ordering}, id ${ordering} LIMIT $${params.length-1} OFFSET $${params.length}`, params);
  const { rows: c } = await pool.query(`SELECT COUNT(*)::int AS total FROM inquiries ${where}`, params.slice(0, params.length-2));
  const totalElements = c[0].total;
  return { content: rows.map(inquiryFromRow), totalElements, totalPages: Math.ceil(totalElements / size), number: page, size };
}

async function getInquiry(id) {
  const { rows } = await pool.query('SELECT * FROM inquiries WHERE id=$1', [id]);
  return inquiryFromRow(rows[0]);
}

async function updateStatus(id, status) {
  const { rows } = await pool.query('UPDATE inquiries SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *', [status, id]);
  return inquiryFromRow(rows[0]);
}

async function stats() {
  const { rows } = await pool.query(`SELECT status, COUNT(*)::int AS count FROM inquiries GROUP BY status`);
  const counts = Object.fromEntries(rows.map((r) => [r.status, r.count]));
  return {
    total: rows.reduce((a,r)=>a+r.count,0),
    newCount: counts.NEW || 0,
    inProgress: counts.IN_PROGRESS || 0,
    resolved: counts.RESOLVED || 0
  };
}

async function analytics({ days, interval }) {
  const filter = `created_at >= NOW() - ($1::text || ' days')::interval`;
  const [statusRows, categoryRows, userTypeRows, trendRows] = await Promise.all([
    pool.query(`SELECT status, COUNT(*)::int AS count FROM inquiries WHERE ${filter} GROUP BY status`, [days]),
    pool.query(`SELECT category, COUNT(*)::int AS count FROM inquiries WHERE ${filter} GROUP BY category`, [days]),
    pool.query(`SELECT user_type, COUNT(*)::int AS count FROM inquiries WHERE ${filter} GROUP BY user_type`, [days]),
    pool.query(`SELECT date_trunc($2, created_at) AS bucket, COUNT(*)::int AS count FROM inquiries WHERE ${filter} GROUP BY bucket ORDER BY bucket`, [days, interval])
  ]);
  const status = Object.fromEntries(statusRows.rows.map(row => [row.status, row.count]));
  const categories = Object.fromEntries(categoryRows.rows.map(row => [row.category, row.count]));
  const userTypes = Object.fromEntries(userTypeRows.rows.map(row => [row.user_type, row.count]));
  return {
    total: Object.values(status).reduce((sum, count) => sum + count, 0),
    newCount: status.NEW || 0,
    inProgress: status.IN_PROGRESS || 0,
    resolved: status.RESOLVED || 0,
    categories,
    userTypes,
    trend: trendRows.rows.map(row => ({ bucket: row.bucket, count: row.count }))
  };
}

module.exports = { ensureInquiryTable, createInquiry, listInquiries, getInquiry, updateStatus, stats, analytics };
