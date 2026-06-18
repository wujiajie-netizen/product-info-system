import { defineConfig } from '@vben/vite-config';
import { fileURLToPath, URL } from 'node:url';

import ElementPlus from 'unplugin-element-plus/vite';

const srcAlias = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      plugins: [
        ElementPlus({
          format: 'esm',
        }),
      ],
      resolve: {
        alias: {
          '@': srcAlias,
          '#': srcAlias,
        },
      },
    },
  };
});
