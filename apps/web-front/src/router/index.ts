import type { RouteRecordRaw } from 'vue-router';

import BrandView from '#/views/brand/index.vue';
import CategoryView from '#/views/category/index.vue';
import CompanyListView from '#/views/company/index.vue';
import DocumentListView from '#/views/document/index.vue';
import HomeView from '#/views/home/index.vue';
import ProductDetailView from '#/views/product/detail.vue';
import ProductListView from '#/views/product/index.vue';
import QuoteListView from '#/views/quote/index.vue';

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/products',
    name: 'products',
    component: ProductListView,
  },
  {
    path: '/products/:productId',
    name: 'product-detail',
    component: ProductDetailView,
    props: true,
  },
  {
    path: '/categories/:slug?',
    name: 'categories',
    component: CategoryView,
    props: true,
  },
  {
    path: '/brands/:brand?',
    name: 'brands',
    component: BrandView,
    props: true,
  },
  {
    path: '/documents',
    name: 'documents',
    component: DocumentListView,
  },
  {
    path: '/quotes',
    name: 'quotes',
    component: QuoteListView,
  },
  {
    path: '/companies',
    name: 'companies',
    component: CompanyListView,
  },
];
