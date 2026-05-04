<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  NButton,
  NCard,
  NEmpty,
  NGrid,
  NGridItem,
  NInput,
  NSelect,
  NSpin,
  NTag,
} from 'naive-ui';
import { RouterLink, useRouter } from 'vue-router';

import { getDashboardSummary, isUsingDemoData } from '#/api/product-info';
import AppIcon from '#/components/AppIcon.vue';
import FrontShell from '#/components/FrontShell.vue';
import {
  getCategoryIcon,
  homeFeatureIcons,
  quickEntryIcons,
  searchIcon,
  sideEntryIcons,
} from '#/lib/front-icons';
import { useAuthState } from '#/lib/auth';
import { getErrorMessage } from '#/lib/errors';

const router = useRouter();
const keyword = ref('');
const searchScope = ref('all');
const auth = useAuthState();
const loading = ref(false);
const errorMessage = ref('');
const summary = ref<Awaited<ReturnType<typeof getDashboardSummary>> | null>(
  null,
);

const searchScopeOptions = [
  { label: '全部', value: 'all' },
  { label: '产品', value: 'products' },
  { label: '资料', value: 'documents' },
  { label: '报价', value: 'quotes' },
  { label: '公司', value: 'companies' },
];

const quickEntrances = computed(() => [
  {
    count: summary.value?.products.length ?? 0,
    icon: quickEntryIcons.产品,
    label: '产品',
    note: '按型号、参数、分类筛选',
    to: '/products',
  },
  {
    count: summary.value?.categories.length ?? 0,
    icon: quickEntryIcons.分类,
    label: '分类',
    note: '目录式浏览商品族',
    to: '/categories',
  },
  {
    count: summary.value?.brands.length ?? 0,
    icon: quickEntryIcons.品牌,
    label: '品牌',
    note: '按品牌聚合入口',
    to: '/brands',
  },
  {
    count: summary.value?.documentCount ?? 0,
    icon: quickEntryIcons.资料,
    label: '资料',
    note: '规格书、图纸、手册',
    to: '/documents',
  },
  {
    count: summary.value?.quoteCount ?? 0,
    icon: quickEntryIcons.报价,
    label: '报价',
    note: '报价资料和价格摘要',
    to: '/quotes',
  },
  {
    count: summary.value?.companies.length ?? 0,
    icon: quickEntryIcons.公司库,
    label: '公司库',
    note: '供应商和关联公司',
    to: '/companies',
  },
]);

const sideEntrances = computed(() => [
  {
    count: summary.value?.documentCount ?? 0,
    icon: sideEntryIcons.资料中心,
    label: '资料中心',
    note: '产品样本、图纸、手册等',
    theme: 'blue',
    to: '/documents',
    unit: '份资料',
  },
  {
    count: summary.value?.quoteCount ?? 0,
    icon: sideEntryIcons.报价中心,
    label: '报价中心',
    note: '最新报价、历史报价查询',
    theme: 'orange',
    to: '/quotes',
    unit: '条报价',
  },
  {
    count: summary.value?.companies.length ?? 0,
    icon: sideEntryIcons.公司库,
    label: '公司库',
    note: '供应商、制造商、代理商',
    theme: 'teal',
    to: '/companies',
    unit: '家公司',
  },
]);

const homeCategories = computed(() =>
  (summary.value?.categories || []).slice(0, 8).map((item) => ({
    ...item,
    icon: getCategoryIcon(item.name),
  })),
);

const featureItems = [
  { ...homeFeatureIcons[0], note: '覆盖商品与资料' },
  { ...homeFeatureIcons[1], note: '多维筛选定位' },
  { ...homeFeatureIcons[2], note: '数据每日维护' },
  { ...homeFeatureIcons[3], note: '支持团队共享' },
];

function submitSearch() {
  const value = keyword.value.trim();

  void router.push({
    name: 'products',
    query: value ? { keyword: value } : {},
  });
}

async function loadDashboard() {
  loading.value = true;
  errorMessage.value = '';

  try {
    summary.value = await getDashboardSummary();
  } catch (error) {
    errorMessage.value = getErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

watch(
  () => [auth.user?.id, isUsingDemoData()],
  ([userId, demoMode]) => {
    if (!userId && !demoMode) {
      summary.value = null;
      return;
    }

    void loadDashboard();
  },
  { immediate: true },
);
</script>

<template>
  <FrontShell>
    <section class="home-hero">
      <div class="shell-container">
        <div class="hero-copy">
          <n-tag type="info" size="small">B2B 商品信息平台</n-tag>
          <h1>专业的商品信息与商业数据平台</h1>
          <p>搜索产品、资料、报价、公司等信息，快速获取所需数据。</p>
          <form class="hero-search" @submit.prevent="submitSearch">
            <n-select
              v-model:value="searchScope"
              class="hero-scope"
              :options="searchScopeOptions"
              size="large"
            />
            <n-input
              v-model:value="keyword"
              clearable
              placeholder="搜索产品 / 资料 / 报价 / 公司"
              size="large"
            />
            <n-button attr-type="submit" size="large" type="primary">
              <template #icon>
                <AppIcon :icon="searchIcon" :size="18" />
              </template>
              搜索
            </n-button>
          </form>
          <div class="hot-keywords">
            <span>热门搜索：</span>
            <button
              v-for="item in [
                '显示器',
                '安卓平板',
                '无人机电池',
                '图传模块',
                '三防平板',
              ]"
              :key="item"
              type="button"
              @click="
                keyword = item;
                submitSearch();
              "
            >
              {{ item }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="content-section shell-container" v-if="errorMessage">
      <n-card>
        <n-empty :description="errorMessage" />
      </n-card>
    </section>

    <section v-else class="content-section shell-container mobile-home-quick">
      <n-spin :show="loading">
        <div class="section-heading">
          <div>
            <h2>快速入口</h2>
            <p>首批主链路入口，覆盖产品、分类、品牌、资料、报价和公司库。</p>
          </div>
        </div>
        <n-grid
          class="mobile-quick-grid"
          cols="2"
          responsive="screen"
          :x-gap="10"
          :y-gap="10"
        >
          <n-grid-item v-for="item in quickEntrances" :key="item.to">
            <RouterLink :to="item.to" class="block-link">
              <n-card hoverable class="entry-card lift-card">
                <span class="entry-icon">
                  <AppIcon :icon="item.icon" :size="22" />
                </span>
                <strong>{{ item.label }}</strong>
                <p>{{ item.note }}</p>
                <span>{{ item.count }} 条相关数据</span>
              </n-card>
            </RouterLink>
          </n-grid-item>
        </n-grid>
      </n-spin>
    </section>

    <section class="content-section shell-container home-board">
      <div class="home-main-column">
        <div class="home-category-panel">
          <div class="section-heading compact-heading">
            <h2>分类入口</h2>
            <RouterLink to="/categories">查看全部</RouterLink>
          </div>
          <n-card v-if="!homeCategories.length">
            <n-empty description="当前还没有分类数据。" />
          </n-card>
          <div v-else class="category-entry-grid">
            <RouterLink
              v-for="item in homeCategories"
              :key="item.name"
              :to="{ name: 'categories', params: { slug: item.slug } }"
              class="category-entry-tile"
            >
              <span class="category-entry-icon">
                <AppIcon :icon="item.icon" :size="22" />
              </span>
              <strong>{{ item.name }}</strong>
              <span>{{ item.count }} 个商品</span>
            </RouterLink>
          </div>
        </div>

        <section class="home-feature-strip">
          <div v-for="item in featureItems" :key="item.label">
            <span class="feature-icon">
              <AppIcon :icon="item.icon" :size="24" />
            </span>
            <strong>{{ item.label }}</strong>
            <span>{{ item.note }}</span>
          </div>
        </section>
      </div>

      <aside class="home-side-stack">
        <RouterLink
          v-for="item in sideEntrances"
          :key="item.to"
          :to="item.to"
          class="side-entry-card"
          :class="`side-entry-card-${item.theme}`"
        >
          <div>
            <strong>{{ item.label }}</strong>
            <p>{{ item.note }}</p>
            <span
              >{{ item.count.toLocaleString('zh-CN') }} {{ item.unit }}</span
            >
          </div>
          <span class="side-entry-icon">
            <AppIcon :icon="item.icon" :size="26" />
          </span>
        </RouterLink>
      </aside>
    </section>
  </FrontShell>
</template>
