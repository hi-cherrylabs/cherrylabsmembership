import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {viteSingleFile} from 'vite-plugin-singlefile';

export default defineConfig(({command}) => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      // Inlines all JS/CSS into dist/index.html on `npm run build`, so the
      // production build is a single self-contained, minified HTML file.
      command === 'build' ? viteSingleFile() : undefined,
    ].filter(Boolean),
    build: {
      target: 'es2020',
      cssCodeSplit: false,
      assetsInlineLimit: 100000000,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
