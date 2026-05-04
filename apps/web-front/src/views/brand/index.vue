<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NCard, NEmpty, NSpin, NTag } from 'naive-ui';
import { RouterLink } from 'vue-router';

import { getDashboardSummary, isUsingDemoData } from '#/api/product-info';
import AppIcon from '#/components/AppIcon.vue';
import FrontShell from '#/components/FrontShell.vue';
import { getCategoryIcon } from '#/lib/front-icons';
import { useAuthState } from '#/lib/auth';
import { getErrorMessage } from '#/lib/errors';

const props = defineProps<{
  brand?: string;
}>();

const auth = useAuthState();
const loading = ref(false);
const errorMessage = ref('');
const summary = ref<Awaited<ReturnType<typeof getDashboardSummary>> | null>(
  null,
);

const currentBrand = computed(() =>
  summary.value?.brands.find(
    (item) => item.slug === props.brand || item.name === props.brand,
  ),
);

const visibleProducts = computed(() => {
  const products = summary.value?.products || [];

  if (!props.brand) {
    return products;
  }

  return products.filter(
    (item) =>
      item.brandId === currentBrand.value?.id ||
      item.brand === currentBrand.value?.name,
  );
});

const relatedCategories = computed(() => {
  const sourceProducts = props.brand
    ? visibleProducts.value
    : summary.value?.products || [];
  const counters = new Map<string, number>();

  for (const item of sourceProducts) {
    counters.set(item.category, (counters.get(item.category) || 0) + 1);
  }

  const rankedCategories = (summary.value?.categories || [])
    .filter((item) => counters.has(item.name))
    .toSorted((left, right) => {
      return (counters.get(right.name) || 0) - (counters.get(left.name) || 0);
    });

  return rankedCategories.slice(0, props.brand ? 8 : 10);
});

const recentProducts = computed(() =>
  [...visibleProducts.value]
    .toSorted((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, 5),
);

const metrics = computed(() => [
  {
    label: props.brand ? '当前产品' : '全部产品',
    value: visibleProducts.value.length,
  },
  {
    label: '品牌',
    value: summary.value?.brands.length ?? 0,
  },
  {
    label: '覆盖分类',
    value: relatedCategories.value.length,
  },
  {
    label: '资料',
    value: summary.value?.documentCount ?? 0,
  },
]);

function buildBrandProductListQuery() {
  if (!currentBrand.value) {
    return {};
  }

  return {
    brandId: currentBrand.value.id,
    brandSlug: currentBrand.value.slug,
  };
}

function buildBrandLabel(name: string) {
  const compact = name.replace(/\s+/g, '');
  return compact.slice(0, Math.min(compact.length, 3)).toUpperCase();
}

async function loadSummary() {
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

    void loadSummary();
  },
  { immediate: true },
);
</script>

<template>
  <FrontShell>
    <section class="content-section shell-container nav-page">
      <n-spin :show="loading">
        <div class="section-heading">
          <div>
            <h1>{{ currentBrand?.name ?? '品牌导航' }}</h1>
            <p>
              {{
                currentBrand?.description ||
                '按品牌聚合产品、资料与报价，并保持和分类页一致的浏览与跳转节奏。'
              }}
            </p>
          </div>
          <n-tag>{{ visibleProducts.length }} 个产品</n-tag>
        </div>

        <div class="nav-switcher" aria-label="分类品牌切换">
          <RouterLink :to="{ name: 'categories' }">分类</RouterLink>
          <RouterLink :to="{ name: 'brands' }" class="active">品牌</RouterLink>
        </div>

        <n-card v-if="errorMessage">
          <n-empty :description="errorMessage" />
        </n-card>

        <template v-else>
          <section class="nav-overview">
            <div class="nav-panel">
              <div class="section-heading compact-heading">
                <h2>{{ currentBrand ? '当前品牌' : '品牌目录' }}</h2>
                <RouterLink
                  :to="{
                    name: 'products',
                    query: buildBrandProductListQuery(),
                  }"
                >
                  {{ currentBrand ? '查看品牌产品' : '进入产品列表' }}
                </RouterLink>
              </div>

              <div v-if="currentBrand" class="nav-focus-card">
                <div class="nav-directory-top">
                  <span class="nav-badge nav-badge-brand">
                    {{ buildBrandLabel(currentBrand.name) }}
                  </span>
                  <div>
                    <strong>{{ currentBrand.name }}</strong>
                    <p>{{ currentBrand.count }} 个产品</p>
                  </div>
                  <n-tag size="small" type="info">
                    {{ currentBrand.sampleModels.length }} 个主推型号
                  </n-tag>
                </div>
                <p class="nav-focus-description">
                  {{
                    currentBrand.description ||
                    '品牌页保持产品预览、关联分类和最近更新联动，方便从品牌维度继续收窄。'
                  }}
                </p>
                <div class="nav-directory-samples">
                  <span
                    v-for="model in currentBrand.sampleModels"
                    :key="model"
                    >{{ model }}</span
                  >
                </div>
              </div>

              <div
                v-else-if="summary?.brands?.length"
                class="nav-logo-grid brand-directory-grid"
              >
                <RouterLink
                  v-for="item in summary.brands"
                  :key="item.id"
                  :to="{ name: 'brands', params: { brand: item.slug } }"
                  class="nav-logo-card brand-directory-card"
                >
                  <span class="nav-logo-mark">{{
                    buildBrandLabel(item.name)
                  }}</span>
                  <strong>{{ item.name }}</strong>
                  <p>{{ item.count }} 个产品</p>
                </RouterLink>
              </div>

              <n-card v-else embedded>
                <n-empty description="当前还没有品牌数据。" />
              </n-card>
            </div>

            <aside class="nav-side-stack">
              <section class="nav-side-block">
                <div class="section-heading compact-heading">
                  <h3>最近更新</h3>
                  <RouterLink to="/products">全部产品</RouterLink>
                </div>
                <div v-if="recentProducts.length" class="nav-side-list">
                  <RouterLink
                    v-for="item in recentProducts"
                    :key="item.id"
                    :to="{
                      name: 'product-detail',
                      params: { productId: item.model },
                    }"
                  >
                    <div>
                      <strong>{{ item.name }}</strong>
                      <span>{{ item.model }} · {{ item.category }}</span>
                    </div>
                    <span>{{ item.updatedAt.slice(5, 10) }}</span>
                  </RouterLink>
                </div>
                <n-empty v-else description="暂无最近更新。" />
              </section>

              <section class="nav-side-block">
                <h3>品牌概览</h3>
                <div class="nav-metric-grid">
                  <div v-for="item in metrics" :key="item.label">
                    <strong>{{ item.value }}</strong>
                    <span>{{ item.label }}</span>
                  </div>
                </div>
              </section>
            </aside>
          </section>

          <section class="content-section nav-subsection">
            <div class="section-heading compact-heading">
              <h2>{{ currentBrand ? '品牌产品预览' : '品牌产品总览' }}</h2>
              <RouterLink
                :to="{
                  name: 'products',
                  query: buildBrandProductListQuery(),
                }"
              >
                进入产品列表
              </RouterLink>
            </div>
            <div v-if="visibleProducts.length" class="product-card-grid">
              <RouterLink
                v-for="item in visibleProducts.slice(0, 12)"
                :key="item.id"
                :to="{
                  name: 'product-detail',
                  params: { productId: item.model },
                }"
                class="mini-product-card nav-product-card"
              >
                <div class="nav-product-top">
                  <strong>{{ item.name }}</strong>
                  <n-tag size="small">{{ item.brand || '品牌' }}</n-tag>
                </div>
                <p>{{ item.model }} · {{ item.category }}</p>
                <span>{{ item.summary }}</span>
              </RouterLink>
            </div>
            <n-card v-else>
              <n-empty description="当前品牌下暂无产品。" />
            </n-card>
          </section>

          <section class="content-section nav-subsection">
            <div class="section-heading compact-heading">
              <h2>{{ currentBrand ? '相关分类' : '分类入口' }}</h2>
              <RouterLink :to="{ name: 'categories' }">查看全部分类</RouterLink>
            </div>
            <div
              v-if="relatedCategories.length"
              class="nav-collection-grid nav-category-compact-grid"
            >
              <RouterLink
                v-for="item in relatedCategories"
                :key="item.id"
                :to="{ name: 'categories', params: { slug: item.slug } }"
                class="nav-directory-card nav-directory-card-compact"
              >
                <div class="nav-directory-top">
                  <span class="nav-badge">
                    <AppIcon :icon="getCategoryIcon(item.name)" :size="22" />
                  </span>
                  <n-tag size="small">{{ item.count }} 个产品</n-tag>
                </div>
                <div>
                  <strong>{{ item.name }}</strong>
                  <p>{{ item.sampleModels.slice(0, 2).join(' / ') }}</p>
                </div>
              </RouterLink>
            </div>
            <n-card v-else>
              <n-empty description="暂无可用分类入口。" />
            </n-card>
          </section>
        </template>
      </n-spin>
    </section>
  </FrontShell>
</template>
