import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  const frontendPort = Number(process.env.VITE_PORT || env.VITE_PORT || 5173);
  const backendPort = Number(process.env.PORT || env.PORT || 5001);

  return {
    root: path.resolve(__dirname, 'frontend'),
    envDir: __dirname,
    plugins: [
      tailwindcss(),
      react()
    ],
    define: {
      'process.env': {},
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'frontend/src'),
      },
    },
    server: {
      port: frontendPort,
      strictPort: true,
      watch: {
        // Source edits made through mounted Codex/VS Code workspaces may not emit native fs events.
        usePolling: true,
        interval: 1000,
      },
      proxy: {
        '/api': {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
