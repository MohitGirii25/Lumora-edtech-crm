const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'email and password required' });
  const admin = await userModel.findAdminByEmail(email.trim());
  if (!admin) return res.status(401).json({ message: 'invalid credentials' });
  const ok = await bcrypt.compare(password, admin.password_hash);
  if (!ok) return res.status(401).json({ message: 'invalid credentials' });
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) return res.status(500).json({ message: 'Authentication is not configured.' });
  const expiresInMs = Number.parseInt(process.env.JWT_EXPIRATION_MS || '3600000', 10);
  const token = jwt.sign({ id: admin.id, email: admin.email, name: admin.name }, secret, { expiresIn: Math.floor(expiresInMs / 1000), algorithm: 'HS256' });
  res.json({ token, expiresInMs, admin: { id: admin.id, name: admin.name, email: admin.email } });
}

module.exports = { login };
