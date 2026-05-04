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
  slug?: string;
}>();

const auth = useAuthState();
const loading = ref(false);
const errorMessage = ref('');
const summary = ref<Awaited<ReturnType<typeof getDashboardSummary>> | null>(
  null,
);

const currentCategory = computed(() =>
  summary.value?.categories.find(
    (item) => item.slug === props.slug || item.name === props.slug,
  ),
);

const visibleProducts = computed(() => {
  const products = summary.value?.products || [];

  if (!props.slug) {
    return products;
  }

  return products.filter(
    (item) =>
      item.categoryId === currentCategory.value?.id ||
      item.category === currentCategory.value?.name,
  );
});

const recentProducts = computed(() =>
  [...visibleProducts.value]
    .toSorted((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, 5),
);

const visibleBrands = computed(() => {
  const sourceProducts = props.slug
    ? visibleProducts.value
    : summary.value?.products || [];
  const counters = new Map<string, number>();

  for (const item of sourceProducts) {
    if (!item.brand) {
      continue;
    }

    counters.set(item.brand, (counters.get(item.brand) || 0) + 1);
  }

  const rankedBrands = (summary.value?.brands || [])
    .filter((item) => counters.has(item.name))
    .toSorted((left, right) => {
      return (counters.get(right.name) || 0) - (counters.get(left.name) || 0);
    });

  return rankedBrands.slice(0, props.slug ? 8 : 10);
});

const metrics = computed(() => [
  {
    label: props.slug ? '当前产品' : '全部产品',
    value: visibleProducts.value.length,
  },
  {
    label: '分类',
    value: summary.value?.categories.length ?? 0,
  },
  {
    label: '品牌',
    value: visibleBrands.value.length || summary.value?.brands.length || 0,
  },
  {
    label: '资料',
    value: summary.value?.documentCount ?? 0,
  },
]);

function buildCategoryProductListQuery() {
  if (!currentCategory.value) {
    return {};
  }

  return {
    categoryId: currentCategory.value.id,
    categorySlug: currentCategory.value.slug,
  };
}

function buildBrandLabel(name: string) {
  const compact = name.replace(/\s+/g, '');
  return compact.slice(0, Math.min(compact.length, 2)).toUpperCase();
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
            <h1>{{ currentCategory?.name ?? '分类导航' }}</h1>
            <p>
              {{
                currentCategory?.description ||
                '按产品目录浏览、切入分类结果，并继续进入产品列表查看更细筛选。'
              }}
            </p>
          </div>
          <n-tag>{{ visibleProducts.length }} 个产品</n-tag>
        </div>

        <div class="nav-switcher" aria-label="分类品牌切换">
          <RouterLink :to="{ name: 'categories' }" class="active"
            >分类</RouterLink
          >
          <RouterLink :to="{ name: 'brands' }">品牌</RouterLink>
        </div>

        <n-card v-if="errorMessage">
          <n-empty :description="errorMessage" />
        </n-card>

        <template v-else>
          <section class="nav-overview">
            <div class="nav-panel">
              <div class="section-heading compact-heading">
                <h2>{{ currentCategory ? '当前分类' : '产品分类' }}</h2>
                <RouterLink
                  :to="{
                    name: 'products',
                    query: buildCategoryProductListQuery(),
                  }"
                >
                  {{ currentCategory ? '查看分类产品' : '进入产品列表' }}
                </RouterLink>
              </div>

              <div v-if="currentCategory" class="nav-focus-card">
                <div class="nav-directory-top">
                  <span class="nav-badge">
                    <AppIcon
                      :icon="getCategoryIcon(currentCategory.name)"
                      :size="24"
                    />
                  </span>
                  <div>
                    <strong>{{ currentCategory.name }}</strong>
                    <p>{{ currentCategory.count }} 个产品</p>
                  </div>
                  <n-tag size="small" type="info">
                    最近更新 {{ currentCategory.latestUpdatedAtLabel }}
                  </n-tag>
                </div>
                <p class="nav-focus-description">
                  {{
                    currentCategory.description ||
                    '当前分类下保留产品预览、品牌入口和最近更新，方便继续纵向浏览。'
                  }}
                </p>
                <div class="nav-directory-samples">
                  <span
                    v-for="model in currentCategory.sampleModels"
                    :key="model"
                    >{{ model }}</span
                  >
                </div>
              </div>

              <div
                v-else-if="summary?.categories?.length"
                class="nav-collection-grid"
              >
                <RouterLink
                  v-for="item in summary.categories"
                  :key="item.id"
                  :to="{ name: 'categories', params: { slug: item.slug } }"
                  class="nav-directory-card"
                >
                  <div class="nav-directory-top">
                    <span class="nav-badge">
                      <AppIcon :icon="getCategoryIcon(item.name)" :size="22" />
                    </span>
                    <n-tag size="small">{{ item.count }} 个产品</n-tag>
                  </div>
                  <div>
                    <strong>{{ item.name }}</strong>
                    <p>
                      {{
                        item.description ||
                        '目录式导航入口，支持进入分类结果和产品列表。'
                      }}
                    </p>
                  </div>
                  <div class="nav-directory-meta">
                    <span>最近更新 {{ item.latestUpdatedAtLabel }}</span>
                    <span>{{ item.sampleModels.slice(0, 2).join(' / ') }}</span>
                  </div>
                </RouterLink>
              </div>

              <n-card v-else embedded>
                <n-empty description="当前还没有分类数据。" />
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
                      <span
                        >{{ item.model }} ·
                        {{ item.brand || item.category }}</span
                      >
                    </div>
                    <span>{{ item.updatedAt.slice(5, 10) }}</span>
                  </RouterLink>
                </div>
                <n-empty v-else description="暂无最近更新。" />
              </section>

              <section class="nav-side-block">
                <h3>导航概览</h3>
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
              <h2>{{ currentCategory ? '分类产品预览' : '分类产品总览' }}</h2>
              <RouterLink
                :to="{
                  name: 'products',
                  query: buildCategoryProductListQuery(),
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
                  <n-tag size="small">{{ item.category }}</n-tag>
                </div>
                <p>{{ item.model }} · {{ item.brand || '待补品牌' }}</p>
                <span>{{ item.summary }}</span>
              </RouterLink>
            </div>
            <n-card v-else>
              <n-empty description="当前分类下暂无产品。" />
            </n-card>
          </section>

          <section class="content-section nav-subsection">
            <div class="section-heading compact-heading">
              <h2>{{ currentCategory ? '相关品牌' : '品牌入口' }}</h2>
              <RouterLink :to="{ name: 'brands' }">查看全部品牌</RouterLink>
            </div>
            <div v-if="visibleBrands.length" class="nav-logo-grid">
              <RouterLink
                v-for="item in visibleBrands"
                :key="item.id"
                :to="{ name: 'brands', params: { brand: item.slug } }"
                class="nav-logo-card"
              >
                <span class="nav-logo-mark">{{
                  buildBrandLabel(item.name)
                }}</span>
                <strong>{{ item.name }}</strong>
                <p>{{ item.count }} 个产品</p>
              </RouterLink>
            </div>
            <n-card v-else>
              <n-empty description="暂无可用品牌入口。" />
            </n-card>
          </section>
        </template>
      </n-spin>
    </section>
  </FrontShell>
</template>
