import { defineConfig, devices } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const dataDir = process.env.NOTEAPP_E2E_DATA_DIR || mkdtempSync(path.join(tmpdir(), 'noteapp-e2e-'));
process.env.NOTEAPP_E2E_DATA_DIR = dataDir;
const executablePath = process.env.NOTEAPP_CHROMIUM_PATH;
export default defineConfig({
  testDir: './e2e', workers: 1, fullyParallel: false,
  timeout: 45000, reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:5173', screenshot: 'only-on-failure', trace: 'retain-on-failure',
    launchOptions: executablePath ? { executablePath, args: process.env.NOTEAPP_CHROMIUM_ARGS ? JSON.parse(process.env.NOTEAPP_CHROMIUM_ARGS) : ['--no-sandbox', '--disable-dev-shm-usage'] } : {},
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    { command: 'node ../server/server.js', url: 'http://127.0.0.1:5000/api/health', reuseExistingServer: false,
      env: { NOTEAPP_DATA_DIR: dataDir, PORT: '5000' } },
    { command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort', url: 'http://127.0.0.1:5173', reuseExistingServer: false,
      env: { VITE_API_BASE_URL: 'http://127.0.0.1:5000/api' } },
  ],
});
