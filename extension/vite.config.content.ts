import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Separate Vite config for content scripts
 * Content scripts can't use ES modules, so we build as IIFE
 * Each content script is built separately due to IIFE format requirement
 */
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false, // Don't delete other build outputs
    lib: {
      entry: resolve(__dirname, 'src/content/content-script.ts'),
      name: 'ContentScript',
      fileName: () => 'content/content-script.js',
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
