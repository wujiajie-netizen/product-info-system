<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  NButton,
  NCard,
  NDrawer,
  NDrawerContent,
  NEmpty,
  NInput,
  NSelect,
  NSpace,
  NSpin,
  NTag,
} from 'naive-ui';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import {
  formatDate,
  formatStatus,
  isUsingDemoData,
  listProducts,
} from '#/api/product-info';
import AppIcon from '#/components/AppIcon.vue';
import FrontShell from '#/components/FrontShell.vue';
import {
  getQuoteMetaIcon,
  quickEntryIcons,
  searchIcon,
} from '#/lib/front-icons';
import { useAuthState } from '#/lib/auth';
import { getErrorMessage } from '#/lib/errors';

const route = useRoute();
const router = useRouter();
const keyword = ref('');
const category = ref<string | null>(null);
const brand = ref<string | null>(null);
const sort = ref('updated');
const filterOpen = ref(false);
const auth = useAuthState();
const loading = ref(false);
const errorMessage = ref('');
const products = ref<Awaited<ReturnType<typeof listProducts>>>([]);

const categoryOptions = computed(() =>
  [...new Set(products.value.map((item) => item.category))].map((item) => ({
    label: item,
    value: item,
  })),
);

const brandOptions = computed(() =>
  [
    ...new Set(
      products.value
        .map((item) => item.brand)
        .filter((item): item is string => Boolean(item)),
    ),
  ].map((item) => ({
    label: item,
    value: item,
  })),
);

const rows = computed(() => {
  const value = keyword.value.trim().toLowerCase();
  const filtered = products.value.filter((item) => {
    if (category.value && item.category !== category.value) {
      return false;
    }

    if (brand.value && item.brand !== brand.value) {
      return false;
    }

    if (!value) {
      return true;
    }

    return `${item.model} ${item.name} ${item.category} ${item.brand} ${item.company} ${item.tags.join(
      ' ',
    )} ${item.specEntries.map((entry) => `${entry.label} ${entry.value}`).join(' ')}`
      .toLowerCase()
      .includes(value);
  });

  return [...filtered].toSorted((left, right) => {
    if (sort.value === 'name') {
      return left.name.localeCompare(right.name, 'zh-CN');
    }

    if (sort.value === 'quote') {
      return right.quoteCount - left.quoteCount;
    }

    return right.updatedAt.localeCompare(left.updatedAt);
  });
});

function clearFilters() {
  keyword.value = '';
  category.value = null;
  brand.value = null;
  void router.replace({ name: 'products' });
}

async function loadProducts() {
  loading.value = true;
  errorMessage.value = '';

  try {
    products.value = await listProducts();
  } catch (error) {
    errorMessage.value = getErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function normalizeQueryValue(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function applyRouteFilters() {
  keyword.value = normalizeQueryValue(route.query.keyword) || '';

  const categoryId = normalizeQueryValue(route.query.categoryId);
  const categorySlug = normalizeQueryValue(route.query.categorySlug);
  const legacyCategory = normalizeQueryValue(route.query.category);
  const matchedCategory = products.value.find((item) => {
    return (
      (categoryId && item.categoryId === categoryId) ||
      (categorySlug && item.categorySlug === categorySlug) ||
      (legacyCategory && item.category === legacyCategory)
    );
  });
  category.value = matchedCategory?.category || legacyCategory || null;

  const brandId = normalizeQueryValue(route.query.brandId);
  const brandSlug = normalizeQueryValue(route.query.brandSlug);
  const legacyBrand = normalizeQueryValue(route.query.brand);
  const matchedBrand = products.value.find((item) => {
    return (
      (brandId && item.brandId === brandId) ||
      (brandSlug && item.brandSlug === brandSlug) ||
      (legacyBrand && item.brand === legacyBrand)
    );
  });
  brand.value = matchedBrand?.brand || legacyBrand || null;
}

watch(
  () => [
    route.query.keyword,
    route.query.category,
    route.query.categoryId,
    route.query.categorySlug,
    route.query.brand,
    route.query.brandId,
    route.query.brandSlug,
  ],
  () => {
    applyRouteFilters();
  },
  { immediate: true },
);

watch(
  products,
  () => {
    applyRouteFilters();
  },
  { immediate: true },
);

watch(
  () => [auth.user?.id, isUsingDemoData()],
  ([userId, demoMode]) => {
    if (!userId && !demoMode) {
      products.value = [];
      return;
    }

    void loadProducts();
  },
  { immediate: true },
);
</script>

<template>
  <FrontShell>
    <section class="content-section shell-container product-page">
      <div class="section-heading">
        <div>
          <h1>产品列表</h1>
          <p>
            支持关键词、分类、品牌和关键参数筛选，直接感知资料、报价与关联公司。
          </p>
        </div>
        <n-space>
          <n-button class="mobile-only" secondary @click="filterOpen = true"
            >筛选</n-button
          >
          <n-select
            v-model:value="sort"
            class="sort-select"
            :options="[
              { label: '最新发布', value: 'updated' },
              { label: '名称', value: 'name' },
              { label: '报价资料多', value: 'quote' },
            ]"
          />
        </n-space>
      </div>

      <div class="product-layout">
        <aside class="filter-panel">
          <h2 class="panel-title-with-icon">
            <AppIcon :icon="searchIcon" :size="18" />
            筛选条件
          </h2>
          <n-input
            v-model:value="keyword"
            clearable
            placeholder="搜索型号 / 参数 / 公司"
          >
            <template #prefix>
              <AppIcon :icon="searchIcon" :size="16" />
            </template>
          </n-input>
          <n-select
            v-model:value="category"
            clearable
            placeholder="分类"
            :options="categoryOptions"
          />
          <n-select
            v-model:value="brand"
            clearable
            placeholder="品牌"
            :options="brandOptions"
          />
          <n-button block secondary @click="clearFilters">重置</n-button>
        </aside>

        <main>
          <n-spin :show="loading">
            <n-card v-if="errorMessage">
              <n-empty :description="errorMessage" />
            </n-card>
            <template v-else>
              <div class="result-bar">
                <strong class="title-with-icon">
                  <AppIcon :icon="quickEntryIcons.产品" :size="18" />
                  产品列表
                </strong>
                <span>共 {{ rows.length }} 条结果</span>
              </div>

              <div class="desktop-product-table" v-if="rows.length">
                <div class="product-table-head">
                  <span>产品信息</span>
                  <span>关键参数</span>
                  <span>相关资料</span>
                  <span>最新报价</span>
                  <span>关联公司</span>
                  <span>更新时间</span>
                </div>
                <RouterLink
                  v-for="item in rows"
                  :key="item.id"
                  :to="{
                    name: 'product-detail',
                    params: { productId: item.model },
                  }"
                  class="product-row"
                >
                  <div class="product-info-cell">
                    <div class="product-thumb">
                      <img :src="item.imageUrl" :alt="item.name" />
                    </div>
                    <div>
                      <strong>{{ item.name }}</strong>
                      <p>{{ item.model }} · {{ item.brand }}</p>
                      <n-space size="small">
                        <n-tag size="small" type="success">{{
                          formatStatus(item.status)
                        }}</n-tag>
                        <n-tag
                          v-for="tag in item.tags.slice(0, 2)"
                          :key="tag"
                          size="small"
                        >
                          {{ tag }}
                        </n-tag>
                      </n-space>
                    </div>
                  </div>
                  <div>
                    <p
                      v-for="entry in item.specEntries.slice(0, 4)"
                      :key="entry.key"
                    >
                      {{ entry.label }}：{{ entry.value }}
                    </p>
                  </div>
                  <div>
                    <strong class="inline-info">
                      <AppIcon :icon="quickEntryIcons.资料" :size="16" />
                      {{ item.documentCount }} 份资料
                    </strong>
                    <p>规格书 / 手册 / 报价附件</p>
                  </div>
                  <div>
                    <strong class="price-text inline-info">
                      <AppIcon :icon="quickEntryIcons.报价" :size="16" />
                      {{ item.priceRange }}
                    </strong>
                    <p>{{ item.quoteCount }} 条报价资料</p>
                  </div>
                  <div>
                    <strong class="inline-info">
                      <AppIcon :icon="quickEntryIcons.公司库" :size="16" />
                      {{ item.company }}
                    </strong>
                    <p>{{ item.companyCount }} 家关联公司</p>
                  </div>
                  <div>
                    <strong class="inline-info">
                      <AppIcon :icon="getQuoteMetaIcon('updated')" :size="16" />
                      {{ formatDate(item.updatedAt) }}
                    </strong>
                  </div>
                </RouterLink>
              </div>

              <div class="mobile-product-list" v-if="rows.length">
                <article
                  v-for="item in rows"
                  :key="item.id"
                  class="mobile-product-card"
                >
                  <RouterLink
                    :to="{
                      name: 'product-detail',
                      params: { productId: item.model },
                    }"
                    class="mobile-product-main-link"
                  >
                    <div class="product-info-cell">
                      <div class="product-thumb">
                        <img :src="item.imageUrl" :alt="item.name" />
                      </div>
                      <div>
                        <strong>{{ item.name }}</strong>
                        <p>{{ item.model }} · {{ item.brand }}</p>
                      </div>
                    </div>
                    <div class="mobile-tags">
                      <n-tag size="small">{{ item.category }}</n-tag>
                      <n-tag
                        v-for="tag in item.tags.slice(0, 2)"
                        :key="tag"
                        size="small"
                      >
                        {{ tag }}
                      </n-tag>
                    </div>
                    <p>{{ item.summary }}</p>
                  </RouterLink>
                  <div class="mobile-card-meta">
                    <RouterLink
                      :to="{
                        name: 'product-detail',
                        params: { productId: item.model },
                        hash: '#quotes',
                      }"
                    >
                      <AppIcon :icon="quickEntryIcons.报价" :size="15" />
                      {{ item.priceRange }} · 报价 {{ item.quoteCount }}
                    </RouterLink>
                    <RouterLink
                      :to="{
                        name: 'product-detail',
                        params: { productId: item.model },
                        hash: '#documents',
                      }"
                    >
                      <AppIcon :icon="quickEntryIcons.资料" :size="15" />
                      资料 {{ item.documentCount }} · 查看
                    </RouterLink>
                  </div>
                  <div class="mobile-card-footer">
                    <RouterLink
                      :to="{
                        name: 'product-detail',
                        params: { productId: item.model },
                        hash: '#companies',
                      }"
                    >
                      <AppIcon :icon="quickEntryIcons.公司库" :size="15" />
                      {{ item.company }} · {{ item.companyCount }} 家
                    </RouterLink>
                    <span class="inline-info">
                      <AppIcon :icon="getQuoteMetaIcon('updated')" :size="14" />
                      {{ formatDate(item.updatedAt) }}
                    </span>
                  </div>
                </article>
              </div>

              <n-card v-if="!rows.length">
                <n-empty description="没有匹配到产品。" />
              </n-card>
            </template>
          </n-spin>
        </main>
      </div>
    </section>

    <n-drawer v-model:show="filterOpen" placement="bottom" height="430">
      <n-drawer-content title="筛选产品">
        <div class="drawer-filter">
          <n-input
            v-model:value="keyword"
            clearable
            placeholder="搜索型号 / 参数 / 公司"
          >
            <template #prefix>
              <AppIcon :icon="searchIcon" :size="16" />
            </template>
          </n-input>
          <n-select
            v-model:value="category"
            clearable
            placeholder="分类"
            :options="categoryOptions"
          />
          <n-select
            v-model:value="brand"
            clearable
            placeholder="品牌"
            :options="brandOptions"
          />
          <n-button block type="primary" @click="filterOpen = false"
            >查看结果</n-button
          >
          <n-button block secondary @click="clearFilters">重置</n-button>
        </div>
      </n-drawer-content>
    </n-drawer>
  </FrontShell>
</template>
