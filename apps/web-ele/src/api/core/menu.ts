import type { RouteRecordStringComponent } from '@vben/types';
import type { RouteRecordRaw } from 'vue-router';

import { accessRoutes } from '#/router/routes';

function toMenuRoute(route: RouteRecordRaw): RouteRecordStringComponent {
  return {
    children: route.children?.map(toMenuRoute),
    component: route.children?.length ? 'BasicLayout' : '',
    meta: route.meta,
    name: String(route.name || route.path),
    path: route.path,
    redirect: typeof route.redirect === 'string' ? route.redirect : undefined,
  } as RouteRecordStringComponent;
}

/**
 * 使用本地路由模块生成菜单，避免再依赖 backend-mock 服务。
 */
export async function getAllMenusApi() {
  return accessRoutes.map(toMenuRoute);
}
