import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';

// Helper to copy directory recursively
function copyDir(src: string, dest: string) {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }
  const entries = readdirSync(src);
  for (const entry of entries) {
    const srcPath = resolve(src, entry);
    const destPath = resolve(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Service worker and popup use ES modules (they can share chunks)
        'background/index': resolve(__dirname, 'src/background/index.ts'),
        'popup/popup': resolve(__dirname, 'src/popup/popup.ts'),
        // Content scripts (IIFE format - no imports/exports)
        'content/content-script': resolve(__dirname, 'src/content/content-script.ts'),
        'content/content-script-webapp': resolve(__dirname, 'src/content/content-script-webapp.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'shared/[name].js',
        assetFileNames: '[name].[ext]',
        format: 'es',
      },
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
  plugins: [
    {
      name: 'copy-static-files',
      closeBundle() {
        const distDir = resolve(__dirname, 'dist');

        // Copy manifest.json
        copyFileSync(
          resolve(__dirname, 'manifest.json'),
          resolve(distDir, 'manifest.json')
        );

        // Copy popup.html and popup.css
        const popupDir = resolve(distDir, 'popup');
        if (!existsSync(popupDir)) {
          mkdirSync(popupDir, { recursive: true });
        }
        copyFileSync(
          resolve(__dirname, 'src/popup/popup.html'),
          resolve(popupDir, 'popup.html')
        );
        copyFileSync(
          resolve(__dirname, 'src/popup/popup.css'),
          resolve(popupDir, 'popup.css')
        );

        // Copy _locales
        const localesSrc = resolve(__dirname, '_locales');
        if (existsSync(localesSrc)) {
          copyDir(localesSrc, resolve(distDir, '_locales'));
        }

        // Copy icons (if they exist)
        const iconsSrc = resolve(__dirname, 'src/icons');
        if (existsSync(iconsSrc)) {
          const iconsDir = resolve(distDir, 'icons');
          if (!existsSync(iconsDir)) {
            mkdirSync(iconsDir, { recursive: true });
          }
          const icons = readdirSync(iconsSrc).filter(f => f.endsWith('.png'));
          for (const icon of icons) {
            copyFileSync(resolve(iconsSrc, icon), resolve(iconsDir, icon));
          }
        }

        console.log('Static files copied to dist/');
      },
    },
  ],
});
