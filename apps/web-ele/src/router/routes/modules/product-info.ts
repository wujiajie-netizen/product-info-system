import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:boxes',
      order: 0,
      title: '产品资料系统',
    },
    name: 'ProductInfoSystem',
    path: '/product-info',
    children: [
      {
        component: () => import('#/views/product-info/dashboard/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:gauge',
          title: '工作台',
        },
        name: 'ProductInfoDashboard',
        path: '/product-info/dashboard',
      },
      {
        component: () => import('#/views/product-info/products/index.vue'),
        meta: {
          icon: 'lucide:package-search',
          title: '产品管理',
        },
        name: 'ProductInfoProducts',
        path: '/product-info/products',
      },
      {
        component: () => import('#/views/product-info/documents/index.vue'),
        meta: {
          icon: 'lucide:file-box',
          title: '文件资料',
        },
        name: 'ProductInfoDocuments',
        path: '/product-info/documents',
      },
      {
        component: () => import('#/views/product-info/updates/index.vue'),
        meta: {
          icon: 'lucide:radio',
          title: '动态管理',
        },
        name: 'ProductInfoUpdates',
        path: '/product-info/updates',
      },
      {
        component: () => import('#/views/product-info/users/index.vue'),
        meta: {
          authority: ['admin'],
          icon: 'lucide:shield-check',
          title: '用户权限',
        },
        name: 'ProductInfoUsers',
        path: '/product-info/users',
      },
    ],
  },
];

export default routes;
