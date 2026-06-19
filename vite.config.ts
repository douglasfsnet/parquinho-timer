import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { spawn } from 'child_process';

// Auto-spawn the Express API server on port 3001 during local dev mode
if (process.env.NODE_ENV !== 'production' && !process.env.VITE_SERVER_ALREADY_SPAWNED) {
  process.env.VITE_SERVER_ALREADY_SPAWNED = 'true';
  console.log("🚀 Spawning Express API server on port 3001...");
  const serverProcess = spawn('npx', ['tsx', 'server.ts'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, IS_DEV_API_SERVER: 'true' }
  });
  serverProcess.on('close', (code) => {
    console.log(`Express API server exited with code ${code}`);
  });
  process.on('exit', () => {
    serverProcess.kill();
  });
}

export default defineConfig(() => {
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Proxy configuration to delegate /api requests to Express server running internally on port 3001
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3001',
          changeOrigin: true,
          secure: false
        }
      }
    },
  };
});
