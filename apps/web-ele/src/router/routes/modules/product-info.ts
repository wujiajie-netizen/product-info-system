import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    component: () => import('#/views/product-info/dashboard/index.vue'),
    meta: {
      order: 0,
      affixTab: true,
      icon: 'lucide:gauge',
      title: '后台看板',
    },
    name: 'AdminDashboard',
    path: '/admin/dashboard',
  },
  {
    component: () => import('#/views/product-info/workbench/index.vue'),
    meta: {
      authority: ['admin'],
      order: 1,
      icon: 'lucide:table-properties',
      title: '快速入库工作台',
    },
    name: 'AdminProductWorkbench',
    path: '/admin/product-info/workbench',
  },
  {
    component: () => import('#/views/product-info/manual-entry/index.vue'),
    meta: {
      authority: ['admin'],
      hideInMenu: true,
      order: 2,
      icon: 'lucide:package-plus',
      title: '手动建档',
    },
    name: 'AdminManualProductEntry',
    path: '/admin/product-info/manual-entry',
  },
  {
    component: () => import('#/views/product-info/document-fill/index.vue'),
    meta: {
      authority: ['admin'],
      order: 3,
      icon: 'lucide:files',
      title: '资料补齐',
    },
    name: 'AdminDocumentFill',
    path: '/admin/product-info/document-fill',
  },
  {
    component: () => import('#/views/product-info/import-templates/index.vue'),
    meta: {
      authority: ['admin'],
      hideInMenu: true,
      order: 4,
      icon: 'lucide:file-spreadsheet',
      title: '导入模板',
    },
    name: 'AdminImportTemplates',
    path: '/admin/product-info/import-templates',
  },
  {
    component: () => import('#/views/product-info/import-history/index.vue'),
    meta: {
      authority: ['admin'],
      hideInMenu: true,
      order: 5,
      icon: 'lucide:history',
      title: '导入历史',
    },
    name: 'AdminImportHistory',
    path: '/admin/product-info/import-history',
  },
  {
    component: () => import('#/views/product-info/quote-options/index.vue'),
    meta: {
      authority: ['admin'],
      order: 6,
      icon: 'lucide:list-plus',
      title: '报价选配项',
    },
    name: 'AdminQuoteOptions',
    path: '/admin/product-info/quote-options',
  },
  {
    component: () => import('#/views/product-info/products/index.vue'),
    meta: {
      order: 7,
      icon: 'lucide:package-search',
      title: '产品管理',
    },
    name: 'AdminProducts',
    path: '/admin/products',
  },
  {
    component: () => import('#/views/product-info/categories/index.vue'),
    meta: {
      order: 8,
      icon: 'lucide:folder-tree',
      title: '分类管理',
    },
    name: 'AdminCategories',
    path: '/admin/categories',
  },
  {
    component: () => import('#/views/product-info/brands/index.vue'),
    meta: {
      order: 9,
      icon: 'lucide:badge-check',
      title: '品牌管理',
    },
    name: 'AdminBrands',
    path: '/admin/brands',
  },
  {
    component: () => import('#/views/product-info/companies/index.vue'),
    meta: {
      order: 10,
      icon: 'lucide:building-2',
      title: '公司管理',
    },
    name: 'AdminCompanies',
    path: '/admin/companies',
  },
  {
    component: () => import('#/views/product-info/documents/index.vue'),
    meta: {
      order: 11,
      icon: 'lucide:file-box',
      title: '文件资料',
    },
    name: 'AdminDocuments',
    path: '/admin/documents',
  },
  {
    component: () => import('#/views/product-info/quotes/index.vue'),
    meta: {
      order: 12,
      icon: 'lucide:receipt-text',
      title: '报价管理',
    },
    name: 'AdminQuotes',
    path: '/admin/quotes',
  },
  {
    component: () => import('#/views/product-info/updates/index.vue'),
    meta: {
      order: 13,
      icon: 'lucide:radio',
      title: '动态管理',
    },
    name: 'AdminUpdates',
    path: '/admin/updates',
  },
  {
    component: () => import('#/views/product-info/users/index.vue'),
    meta: {
      authority: ['admin'],
      order: 14,
      icon: 'lucide:shield-check',
      title: '用户权限',
    },
    name: 'AdminUsers',
    path: '/admin/users',
  },
];

export default routes;
