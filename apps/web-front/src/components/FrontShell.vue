<script setup lang="ts">
import type { Component } from 'vue';

import { computed, reactive, ref } from 'vue';
import {
  NAlert,
  NButton,
  NCard,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NIcon,
  NLayout,
  NLayoutContent,
  NLayoutFooter,
  NLayoutHeader,
  NSpin,
  NTag,
  useMessage,
} from 'naive-ui';
import { RouterLink, useRoute } from 'vue-router';

import { isUsingDemoData } from '#/api/product-info';
import AppIcon from '#/components/AppIcon.vue';
import { headerActionIcons, navIcons } from '#/lib/front-icons';
import { loginWithPassword, logout, useAuthState } from '#/lib/auth';
import { getErrorMessage } from '#/lib/errors';
import { isSupabaseConfigured } from '#/lib/supabase';

const route = useRoute();
const message = useMessage();
const auth = useAuthState();
const mobileOpen = ref(false);
const loginForm = reactive({
  email: '',
  password: '',
});

const navItems = [
  { label: '首页', short: '首页', to: '/' },
  { label: '产品', short: '产品', to: '/products' },
  { label: '分类', short: '分类', to: '/categories' },
  { label: '品牌', short: '品牌', to: '/brands' },
  { label: '资料', short: '资料', to: '/documents' },
  { label: '报价', short: '报价', to: '/quotes' },
  { label: '公司库', short: '公司', to: '/companies' },
];

const isSignedIn = computed(() => Boolean(auth.user));
const demoMode = computed(() => isUsingDemoData());
const canShowContent = computed(() => demoMode.value || isSignedIn.value);
const userLabel = computed(() => auth.user?.email || '演示模式');

function getNavIcon(path: string): Component {
  return navIcons[path] ?? navIcons['/products']!;
}

function isActive(path: string) {
  if (path === '/') {
    return route.path === '/';
  }

  return route.path === path || route.path.startsWith(`${path}/`);
}

async function handleLogin() {
  try {
    await loginWithPassword(loginForm.email, loginForm.password);
    loginForm.password = '';
    message.success('已连接到 Supabase 商品库。');
  } catch (error) {
    message.error(getErrorMessage(error));
  }
}

async function handleLogout() {
  try {
    await logout();
    message.success('已退出登录。');
  } catch (error) {
    message.error(getErrorMessage(error));
  }
}
</script>

<template>
  <n-layout>
    <n-layout-header bordered class="front-header">
      <div class="shell-container header-row">
        <RouterLink class="brand" to="/">
          <span class="brand-mark">
            <n-icon :size="24">
              <component :is="navIcons['/products']" />
            </n-icon>
          </span>
          <div>
            <strong>品信网</strong>
            <p>B2B 商品信息平台</p>
          </div>
        </RouterLink>

        <nav class="desktop-nav" aria-label="前台导航">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="nav-link"
            :class="{ active: isActive(item.to) }"
          >
            <AppIcon :icon="getNavIcon(item.to)" :size="16" />
            {{ item.label }}
          </RouterLink>
        </nav>

        <div class="header-actions">
          <n-tag v-if="demoMode" type="info" size="small">演示数据</n-tag>
          <n-tag v-else-if="isSignedIn" type="success" size="small">
            {{ userLabel }}
          </n-tag>
          <button
            class="header-icon-button desktop-only"
            type="button"
            aria-label="通知"
          >
            <AppIcon :icon="headerActionIcons.notice" :size="18" />
          </button>
          <n-button
            v-if="isSignedIn"
            class="desktop-only"
            secondary
            type="primary"
            @click="handleLogout"
          >
            <template #icon>
              <AppIcon :icon="headerActionIcons.logout" :size="16" />
            </template>
            退出
          </n-button>
          <n-button
            class="mobile-menu-button"
            quaternary
            @click="mobileOpen = true"
          >
            <template #icon>
              <AppIcon :icon="headerActionIcons.menu" :size="18" />
            </template>
            菜单
          </n-button>
        </div>
      </div>
    </n-layout-header>

    <n-drawer v-model:show="mobileOpen" placement="right" width="280">
      <n-drawer-content title="导航">
        <nav class="drawer-nav">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="drawer-link"
            :class="{ active: isActive(item.to) }"
            @click="mobileOpen = false"
          >
            <AppIcon :icon="getNavIcon(item.to)" :size="18" />
            {{ item.label }}
          </RouterLink>
        </nav>
      </n-drawer-content>
    </n-drawer>

    <n-layout-content embedded>
      <section
        v-if="auth.pending && !auth.initialized"
        class="auth-shell shell-container"
      >
        <n-card class="auth-card">
          <n-spin size="large" />
          <p>正在恢复登录会话并连接商品数据...</p>
        </n-card>
      </section>

      <section v-else-if="!canShowContent" class="auth-shell shell-container">
        <n-card class="auth-card">
          <n-tag type="warning" size="small">需要登录</n-tag>
          <h1>登录后查看真实商品数据</h1>
          <p>
            当前 RLS 策略仅允许已登录用户读取商品、资料、报价和公司信息。
            如果本地未配置 Supabase，页面会自动进入演示数据模式用于 UI 验收。
          </p>
          <n-alert
            v-if="!isSupabaseConfigured"
            type="info"
            title="演示模式未启用异常"
          >
            请检查环境变量读取，或配置 VITE_SUPABASE_URL 与
            VITE_SUPABASE_ANON_KEY。
          </n-alert>
          <n-form @submit.prevent="handleLogin">
            <n-form-item label="邮箱">
              <n-input
                v-model:value="loginForm.email"
                autocomplete="username"
                placeholder="name@example.com"
              />
            </n-form-item>
            <n-form-item label="密码">
              <n-input
                v-model:value="loginForm.password"
                autocomplete="current-password"
                placeholder="请输入密码"
                show-password-on="click"
                type="password"
              />
            </n-form-item>
            <n-button
              :loading="auth.pending"
              attr-type="submit"
              block
              size="large"
              type="primary"
            >
              登录并加载数据
            </n-button>
          </n-form>
        </n-card>
      </section>

      <slot v-else />
    </n-layout-content>

    <n-layout-footer bordered class="front-footer desktop-footer">
      <div class="shell-container footer-row">
        <div>
          <strong>商品资料与报价协同平台</strong>
          <p>首批链路：搜索、分类/品牌浏览、产品筛选、资料与报价查看。</p>
        </div>
        <n-tag :type="demoMode ? 'info' : 'success'">
          {{ demoMode ? 'Demo Data' : 'Supabase Connected' }}
        </n-tag>
      </div>
    </n-layout-footer>

    <nav class="mobile-bottom-nav" aria-label="移动端底部导航">
      <RouterLink
        v-for="item in navItems.slice(0, 5)"
        :key="item.to"
        :to="item.to"
        :class="{ active: isActive(item.to) }"
      >
        <AppIcon :icon="getNavIcon(item.to)" :size="18" />
        <span>{{ item.short }}</span>
      </RouterLink>
    </nav>
  </n-layout>
</template>
