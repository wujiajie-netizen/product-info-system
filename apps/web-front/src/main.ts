import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';

import App from './App.vue';
import { initializeAuth } from './lib/auth';
import { routes } from './router';
import './styles/main.scss';

async function bootstrap() {
  await initializeAuth();

  const app = createApp(App);
  const pinia = createPinia();
  const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior() {
      return { top: 0 };
    },
  });

  app.use(pinia);
  app.use(router);
  app.mount('#app');
}

void bootstrap();
