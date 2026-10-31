const { spawn } = require('node:child_process');
const path = require('node:path');
const { startServer } = require('../backend/src/server');
const pool = require('../backend/src/config/db');

const root = path.resolve(__dirname, '..');
const frontend = path.join(root, 'frontend');
const viteCli = path.join(frontend, 'node_modules', 'vite', 'bin', 'vite.js');
const node = process.execPath;

let stopping = false;
let apiServer = null;
let webProcess = null;
let apiRetryTimer = null;
let webRetryTimer = null;
let apiAttempts = 0;
let webAttempts = 0;

function retryDelay(attempt) {
  return Math.min(1000 * (2 ** Math.min(attempt, 5)), 30_000);
}

async function startApi() {
  if (stopping || apiServer) return;
  try {
    apiServer = await startServer();
    apiAttempts = 0;
  } catch (error) {
    if (stopping) return;
    const delay = retryDelay(apiAttempts++);
    console.error(`API startup failed: ${error.message}. Retrying in ${Math.ceil(delay / 1000)}s.`);
    apiRetryTimer = setTimeout(startApi, delay);
  }
}

function startWeb() {
  if (stopping) return;
  console.log('[web] starting Vite');
  const child = spawn(node, [viteCli, '--host', '0.0.0.0'], {
    cwd: frontend,
    stdio: 'inherit',
    windowsHide: true,
  });
  webProcess = child;
  child.once('error', (error) => {
    console.error(`[web] could not start Vite: ${error.message}`);
  });
  child.once('exit', (code, signal) => {
    webProcess = null;
    if (stopping) return;
    const delay = retryDelay(webAttempts++);
    console.error(`[web] stopped (code ${code ?? 'unknown'}${signal ? `, ${signal}` : ''}); restarting in ${Math.ceil(delay / 1000)}s.`);
    webRetryTimer = setTimeout(startWeb, delay);
  });
}

async function shutdown() {
  if (stopping) return;
  stopping = true;
  if (apiRetryTimer) clearTimeout(apiRetryTimer);
  if (webRetryTimer) clearTimeout(webRetryTimer);
  if (webProcess && !webProcess.killed) webProcess.kill();
  if (apiServer) {
    const server = apiServer;
    apiServer = null;
    server.close();
    server.closeAllConnections?.();
  }
  await pool.end().catch(() => {});
  console.log('Frontend and API stopped.');
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

startApi();
startWeb();
