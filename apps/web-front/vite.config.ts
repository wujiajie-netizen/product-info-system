import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

const srcAlias = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5678,
  },
  resolve: {
    alias: {
      '@': srcAlias,
      '#': srcAlias,
    },
  },
});
