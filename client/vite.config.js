import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '127.0.0.1',
    strictPort: true,
    fs: {
      allow: [
        '/Users/soumyajitghosh/grief-companion',
        '/Volumes/T7 Shield/grief-companion',
      ],
    },
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
