import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    port: 3000
  },
  preview: {
    port: 3001
  },
  build: {
    minify: false
  },
  esbuild: {
    drop: [], // Ne supprime aucun console.log
    pure: []  // Ne supprime aucun code "mort"
  }
});