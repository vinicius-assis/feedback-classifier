import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/** Where the Nest API listens during development. */
const API_TARGET = process.env.VITE_DEV_API_TARGET ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    // Proxying keeps the browser on one origin, so dev needs no CORS setup.
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // `lib/api.ts` throws when this is unset; tests always talk to MSW, not a real API.
    env: {
      VITE_API_BASE_URL: 'http://localhost:3000/api',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/**/*.d.ts', 'src/main.tsx'],
    },
  },
});
