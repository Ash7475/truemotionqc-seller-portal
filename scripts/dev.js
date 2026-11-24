import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const viteBin = path.resolve(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');

console.log('[DevRunner] Launching TrueMotion QC: Backend API (:5000) + Vite Frontend (:3000)...');

const backend = spawn('node', ['backend/server.js'], {
  cwd: rootDir,
  stdio: 'inherit',
  env: process.env
});

const frontend = spawn('node', [viteBin, '--port', '3000'], {
  cwd: rootDir,
  stdio: 'inherit',
  env: process.env
});

function handleExit(code) {
  try { backend.kill(); } catch (e) {}
  try { frontend.kill(); } catch (e) {}
  process.exit(code || 0);
}

process.on('SIGINT', () => handleExit(0));
process.on('SIGTERM', () => handleExit(0));
process.on('exit', () => handleExit(0));

backend.on('error', (err) => console.error('[DevRunner] Backend error:', err));
frontend.on('error', (err) => console.error('[DevRunner] Frontend error:', err));
