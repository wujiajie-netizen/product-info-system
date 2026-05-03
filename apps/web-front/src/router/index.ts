import type { RouteRecordRaw } from 'vue-router';

import HomeView from '#/views/HomeView.vue';
import CategoryView from '#/views/CategoryView.vue';
import ProductListView from '#/views/ProductListView.vue';
import ProductDetailView from '#/views/ProductDetailView.vue';
import QuoteListView from '#/views/QuoteListView.vue';
import UpdateListView from '#/views/UpdateListView.vue';

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/categories/:slug?',
    name: 'categories',
    component: CategoryView,
    props: true,
  },
  {
    path: '/products',
    name: 'products',
    component: ProductListView,
  },
  {
    path: '/products/:id',
    name: 'product-detail',
    component: ProductDetailView,
    props: true,
  },
  {
    path: '/quotes',
    name: 'quotes',
    component: QuoteListView,
  },
  {
    path: '/updates',
    name: 'updates',
    component: UpdateListView,
  },
];
