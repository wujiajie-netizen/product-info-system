<script setup lang="ts">
import { computed, reactive } from 'vue';
import {
  NAlert,
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NLayout,
  NLayoutContent,
  NLayoutFooter,
  NLayoutHeader,
  NSpace,
  NSpin,
  NTag,
  useMessage,
} from 'naive-ui';
import { RouterLink, useRoute } from 'vue-router';

import { loginWithPassword, logout, useAuthState } from '#/lib/auth';
import { getErrorMessage } from '#/lib/errors';
import { isSupabaseConfigured } from '#/lib/supabase';

const route = useRoute();
const message = useMessage();
const auth = useAuthState();
const loginForm = reactive({
  email: '',
  password: '',
});

const navItems = [
  { label: '首页', to: '/' },
  { label: '分类', to: '/categories' },
  { label: '商品', to: '/products' },
  { label: '报价', to: '/quotes' },
  { label: '动态', to: '/updates' },
];

const isSignedIn = computed(() => Boolean(auth.user));
const userLabel = computed(() => auth.user?.email || '已登录');

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
  <n-layout position="absolute">
    <n-layout-header bordered class="front-header">
      <div class="shell-container header-row">
        <RouterLink class="brand" to="/">
          <span class="brand-mark">PI</span>
          <div>
            <strong>商品资料平台</strong>
            <p>登录后读取真实 Supabase 商品、报价和动态数据</p>
          </div>
        </RouterLink>
        <n-space align="center" size="small">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="nav-link"
            :class="{ active: route.path === item.to || route.path.startsWith(`${item.to}/`) }"
          >
            {{ item.label }}
          </RouterLink>
          <n-tag v-if="isSignedIn" type="success">{{ userLabel }}</n-tag>
          <n-button
            v-if="isSignedIn"
            secondary
            type="primary"
            @click="handleLogout"
          >
            退出登录
          </n-button>
        </n-space>
      </div>
    </n-layout-header>
    <n-layout-content embedded>
      <section v-if="!isSupabaseConfigured" class="auth-shell shell-container">
        <n-card class="auth-card">
          <h1>还没有连接 Supabase</h1>
          <p>
            请先在 `apps/web-front/.env.local` 中配置
            `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`。
          </p>
          <n-alert type="info" title="安全提示">
            前端只使用浏览器安全的 anon/publishable key，不要放入 service_role。
          </n-alert>
        </n-card>
      </section>
      <section v-else-if="auth.pending && !auth.initialized" class="auth-shell shell-container">
        <n-card class="auth-card">
          <n-spin size="large" />
          <p>正在恢复登录会话并连接商品数据…</p>
        </n-card>
      </section>
      <section v-else-if="!isSignedIn" class="auth-shell shell-container">
        <n-card class="auth-card">
          <n-tag type="warning" size="small">需要登录</n-tag>
          <h1>登录后查看真实商品数据</h1>
          <p>
            当前 RLS 策略仅允许已登录用户读取商品、文档和动态。输入 Supabase
            账号后即可进入前台。
          </p>
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
    <n-layout-footer bordered class="front-footer">
      <div class="shell-container footer-row">
        <div>
          <strong>真实数据前台</strong>
          <p>当前由 Vue 3 + Vite + Naive UI 驱动，并直接读取 Supabase Cloud 数据。</p>
        </div>
        <n-tag :type="isSignedIn ? 'success' : 'warning'">
          {{ isSignedIn ? 'Supabase Connected' : 'Waiting For Login' }}
        </n-tag>
      </div>
    </n-layout-footer>
  </n-layout>
</template>
