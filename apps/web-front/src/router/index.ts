import type { RouteRecordRaw } from 'vue-router';

import CategoryView from '#/views/category/index.vue';
import CompanyListView from '#/views/company/index.vue';
import DocumentListView from '#/views/document/index.vue';
import HomeView from '#/views/home/index.vue';
import ProductDetailView from '#/views/product/detail.vue';
import ProductListView from '#/views/product/index.vue';
import QaCenterView from '#/views/qa-center/index.vue';
import QuoteListView from '#/views/quote/index.vue';
import UpdateListView from '#/views/update/index.vue';

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: {
      keepAlive: true,
      siteHeader: true,
    },
  },
  {
    path: '/products',
    name: 'products',
    component: ProductListView,
    meta: {
      keepAlive: true,
      siteHeader: true,
    },
  },
  {
    path: '/products/:productId',
    name: 'product-detail',
    component: ProductDetailView,
    props: true,
    meta: {
      siteHeader: true,
    },
  },
  {
    path: '/categories/:slug?',
    name: 'categories',
    component: CategoryView,
    props: true,
    meta: {
      keepAlive: true,
      siteHeader: true,
    },
  },
  {
    path: '/qa-center',
    name: 'qa-center',
    component: QaCenterView,
    meta: {
      keepAlive: true,
      siteHeader: true,
    },
  },
  {
    path: '/documents',
    name: 'documents',
    component: DocumentListView,
    meta: {
      keepAlive: true,
      siteHeader: true,
    },
  },
  {
    path: '/quotes',
    name: 'quotes',
    component: QuoteListView,
    meta: {
      keepAlive: true,
      siteHeader: true,
    },
  },
  {
    path: '/companies',
    name: 'companies',
    component: CompanyListView,
    meta: {
      keepAlive: true,
      siteHeader: true,
    },
  },
  {
    path: '/updates',
    name: 'updates',
    component: UpdateListView,
    meta: {
      keepAlive: true,
      siteHeader: true,
    },
  },
];
