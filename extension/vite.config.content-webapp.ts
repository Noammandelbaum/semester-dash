import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Vite config for webapp content script
 * Injected into the SemesterHub webapp for extension detection
 */
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/content/content-script-webapp.ts'),
      name: 'ContentScriptWebapp',
      fileName: () => 'content/content-script-webapp.js',
      formats: ['iife'],
    },
    target: 'esnext',
    minify: false,
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
