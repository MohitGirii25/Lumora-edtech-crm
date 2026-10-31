const app = require('./app');
const pool = require('./config/db');
const userModel = require('./models/userModel');
const inquiryModel = require('./models/inquiryModel');

async function initializeDatabase() {
  if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET) < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 bytes.');
  }
  const jwtExpirationMs = Number.parseInt(process.env.JWT_EXPIRATION_MS || '3600000', 10);
  if (!Number.isSafeInteger(jwtExpirationMs) || jwtExpirationMs < 60_000) {
    throw new Error('JWT_EXPIRATION_MS must be at least 60000 milliseconds.');
  }

  const bootstrapValues = [process.env.ADMIN_BOOTSTRAP_NAME, process.env.ADMIN_BOOTSTRAP_EMAIL, process.env.ADMIN_BOOTSTRAP_PASSWORD];
  if (bootstrapValues.some(Boolean) && bootstrapValues.some((value) => !value)) {
    throw new Error('Set all three ADMIN_BOOTSTRAP_NAME, ADMIN_BOOTSTRAP_EMAIL, and ADMIN_BOOTSTRAP_PASSWORD values, or leave all blank.');
  }

  await pool.query('SELECT 1');
  await userModel.ensureAdminTable();
  await inquiryModel.ensureInquiryTable();
  if (bootstrapValues.every(Boolean)) {
    const created = await userModel.createAdminIfMissing({ name: bootstrapValues[0], email: bootstrapValues[1], password: bootstrapValues[2] });
    if (created) console.log('Administrator account bootstrapped.');
  }
  console.log('Database connected');
}

async function startServer(port = process.env.PORT || 8081) {
  await initializeDatabase();
  return new Promise((resolve, reject) => {
    const server = app.listen(port);
    server.once('error', reject);
    server.once('listening', () => {
      server.removeListener('error', reject);
      console.log('Server running on port ' + port);
      resolve(server);
    });
  });
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error('Backend startup failed:', err.message);
    pool.end().finally(() => process.exit(1));
  });
}

module.exports = { startServer, initializeDatabase };
