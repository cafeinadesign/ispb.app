import { defineConfig } from 'vite';

export default defineConfig({
  base: '/ispb.app/',
  build: {
    outDir: 'dist/assets',
    emptyOutDir: true,
    assetsDir: '.',
    rollupOptions: {
      input: 'src/client.ts',
      output: {
        entryFileNames: 'app.js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]',
      },
    },
  },
});
