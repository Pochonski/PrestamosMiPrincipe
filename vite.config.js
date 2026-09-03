import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('@supabase/supabase-js')) return 'supabase';
          if (id.includes('lucide-react') || id.includes('/clsx/')) return 'ui';
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router') ||
            id.includes('/scheduler/')
          ) {
            return 'vendor';
          }
          return 'vendor';
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    globals: true,
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/lib/**', 'src/services/**', 'src/features/**/selectors.js', 'src/components/**'],
      exclude: ['src/test/**', '**/*.test.*', '**/__tests__/**'],
      thresholds: {
        statements: 95,
        branches: 83,
        functions: 92,
        lines: 95,
      },
    },
  },
})
