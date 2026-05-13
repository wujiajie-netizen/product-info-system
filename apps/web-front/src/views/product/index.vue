<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  ChevronDown,
  Download,
  Grid2x2,
  List,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-vue-next';
import { useRoute, useRouter } from 'vue-router';

import type {
  BrandFilter,
  CatalogProduct,
  CategoryGroup,
} from '#/views/product/product-list-data';

import {
  isUsingDemoData,
  listProducts,
  type ProductListItem,
} from '#/api/product-info';
import AppIcon from '#/components/AppIcon.vue';
import { useAuthState } from '#/lib/auth';
import { getErrorMessage } from '#/lib/errors';
import ProductSidebarFilters from '#/views/product/components/ProductSidebarFilters.vue';
import ProductTableRow from '#/views/product/components/ProductTableRow.vue';
import {
  productBrands,
  productCategoryGroups,
} from '#/views/product/product-list-data';

const DEFAULT_CATEGORY_SUMMARY = '电脑显示屏、平板、无人机配件';
const BASE_RESULT_COUNT = 2156;

const auth = useAuthState();
const route = useRoute();
const router = useRouter();
const loading = ref(false);
const errorMessage = ref('');
const keyword = ref('');
const products = ref<ProductListItem[]>([]);
const selectedCategorySlug = ref('');
const selectedBrandSlugs = ref<string[]>([]);
const minPrice = ref('');
const maxPrice = ref('');
const sortBy = ref('相关度');
const mobileFilterOpen = ref(false);

const sortOptions = ['相关度', '最新更新', '价格从低到高'];

const brandOptions = computed<BrandFilter[]>(() => {
  if (products.value.length === 0) {
    return productBrands;
  }

  const map = new Map<string, { count: number; label: string }>();
  for (const item of products.value) {
    if (!item.brandSlug || !item.brand) {
      continue;
    }

    const current = map.get(item.brandSlug) || { count: 0, label: item.brand };
    current.count += 1;
    map.set(item.brandSlug, current);
  }

  return [...map.entries()].map(([slug, value]) => ({
    count: value.count,
    label: value.label,
    slug,
  }));
});

const categoryOptions = computed<CategoryGroup[]>(() => {
  if (products.value.length === 0) {
    return productCategoryGroups;
  }

  const map = new Map<string, { count: number; label: string }>();
  for (const item of products.value) {
    if (!item.categorySlug) {
      continue;
    }

    const current = map.get(item.categorySlug) || {
      count: 0,
      label: item.category,
    };
    current.count += 1;
    map.set(item.categorySlug, current);
  }

  return [
    {
      count: products.value.length,
      label: '产品分类',
      options: [...map.entries()].map(([slug, value]) => ({
        count: value.count,
        label: value.label,
        slug,
      })),
    },
  ];
});

function normalizeQueryValue(value: unknown) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function normalizeQueryValues(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const single = normalizeQueryValue(value);

  return single ? [single] : [];
}

function getPriceNumber(value: string) {
  return Number(value.replaceAll(',', '')) || 0;
}

function syncRouteFilters() {
  keyword.value = normalizeQueryValue(route.query.keyword);
  selectedCategorySlug.value = normalizeQueryValue(route.query.categorySlug);
  selectedBrandSlugs.value = normalizeQueryValues(route.query.brandSlug);
}

watch(
  () => route.query,
  () => {
    syncRouteFilters();
  },
  { deep: true, immediate: true },
);

const selectedCategoryLabel = computed(() => {
  for (const group of categoryOptions.value) {
    const matched = group.options.find(
      (option) => option.slug === selectedCategorySlug.value,
    );

    if (matched) {
      return matched.label;
    }
  }

  return '';
});

const selectedBrandLabel = computed(() => {
  if (selectedBrandSlugs.value.length === 0) {
    return '全部';
  }

  return brandOptions.value
    .filter((item) => selectedBrandSlugs.value.includes(item.slug))
    .map((item) => item.label)
    .join('、');
});

const rows = computed<CatalogProduct[]>(() => {
  const normalizedKeyword = keyword.value.trim().toLowerCase();
  const minimum = Number(minPrice.value) || 0;
  const maximum = Number(maxPrice.value) || Number.POSITIVE_INFINITY;

  const filtered = products.value.filter((product) => {
    if (
      selectedCategorySlug.value &&
      product.categorySlug !== selectedCategorySlug.value
    ) {
      return false;
    }

    if (
      selectedBrandSlugs.value.length > 0 &&
      !selectedBrandSlugs.value.includes(product.brandSlug || '')
    ) {
      return false;
    }

    const productPrice = getPriceNumber(product.priceRange);
    if (productPrice < minimum || productPrice > maximum) {
      return false;
    }

    if (!normalizedKeyword) {
      return true;
    }

    const haystack = [
      product.name,
      product.model,
      product.summary,
      product.brand || '',
      product.company,
      ...product.tags,
      ...product.specEntries.map((spec) => `${spec.label} ${spec.value}`),
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedKeyword);
  });

  let sorted = filtered;

  if (sortBy.value === '价格从低到高') {
    sorted = [...filtered].sort(
      (left, right) =>
        getPriceNumber(left.priceRange) - getPriceNumber(right.priceRange),
    );
  } else if (sortBy.value === '最新更新') {
    sorted = [...filtered].sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    );
  }

  return sorted.map((product) => ({
    brandName: product.brand || '未设置品牌',
    brandSlug: product.brandSlug || 'unknown-brand',
    categorySlug: product.categorySlug || 'uncategorized',
    companyName: product.company,
    companyRating: 4.8,
    docCount: product.documentCount,
    docs: [
      { label: '规格书', tone: 'red' },
      { label: '报价资料', tone: 'blue' },
    ],
    id: product.model,
    image: product.imageUrl,
    leadTime: '待确认',
    minimumOrder: product.latestQuote?.min_order_quantity
      ? `${product.latestQuote.min_order_quantity} 台`
      : '待确认',
    model: product.model,
    name: product.name,
    price: product.priceRange.replace(/^[^\d-]+/, '').trim() || '待报价',
    quoteRole: '供应商',
    specs: product.specEntries.slice(0, 4).map((item) => ({
      label: item.label,
      value: item.value,
    })),
    summary: product.summary,
    tags: product.tags,
    updatedAgo: '',
    updatedDate: product.updatedAt,
  }));
});

const activeFilterChips = computed(() => [
  {
    key: 'category',
    label: `分类：${selectedCategoryLabel.value || DEFAULT_CATEGORY_SUMMARY}`,
  },
  {
    key: 'brand',
    label: `品牌：${selectedBrandLabel.value}`,
  },
  {
    key: 'voltage',
    label: '工作电压：全部',
  },
]);

const totalResultsLabel = computed(() => {
  if (rows.value.length === 0) {
    return '0';
  }

  if (rows.value.length === products.value.length) {
    return BASE_RESULT_COUNT.toLocaleString('zh-CN');
  }

  const reduced = Math.max(
    24,
    BASE_RESULT_COUNT - (products.value.length - rows.value.length) * 164,
  );
  return reduced.toLocaleString('zh-CN');
});

function submitSearch() {
  const query = keyword.value.trim();
  void router.replace({
    name: 'products',
    query: query ? { keyword: query } : {},
  });
}

function toggleBrand(slug: string) {
  if (selectedBrandSlugs.value.includes(slug)) {
    selectedBrandSlugs.value = selectedBrandSlugs.value.filter(
      (item) => item !== slug,
    );
    return;
  }

  selectedBrandSlugs.value = [...selectedBrandSlugs.value, slug];
}

function clearChip(key: string) {
  if (key === 'category') {
    selectedCategorySlug.value = '';
    return;
  }

  if (key === 'brand') {
    selectedBrandSlugs.value = [];
  }
}

function clearAllFilters() {
  keyword.value = '';
  selectedCategorySlug.value = '';
  selectedBrandSlugs.value = [];
  minPrice.value = '';
  maxPrice.value = '';
  sortBy.value = '相关度';
  void router.replace({ name: 'products' });
}

function applyFilters() {
  mobileFilterOpen.value = false;
}

async function loadProducts() {
  loading.value = true;
  errorMessage.value = '';

  try {
    products.value = await listProducts();
  } catch (error) {
    errorMessage.value = getErrorMessage(error);
    products.value = [];
  } finally {
    loading.value = false;
  }
}

watch(
  () => [auth.initialized, isUsingDemoData()],
  ([initialized, demoMode]) => {
    if (!initialized && !demoMode) {
      return;
    }

    void loadProducts();
  },
  { immediate: true },
);
</script>

<template>
  <div class="product-page">
    <section class="product-page__search-strip">
      <div class="product-page__search-inner">
        <div class="product-page__search-bar">
          <div class="product-page__search-input">
            <input
              v-model="keyword"
              type="text"
              placeholder="搜索产品名称 / 型号"
              @keyup.enter="submitSearch"
            />
            <button type="button" aria-label="清空搜索" @click="keyword = ''">
              <AppIcon :icon="X" :size="15" />
            </button>
          </div>

          <button class="product-page__search-button" type="button" @click="submitSearch">
            <AppIcon :icon="Search" :size="16" />
            <span>搜索</span>
          </button>
        </div>

        <div class="product-page__chips">
          <span class="product-page__chips-label">已选条件：</span>
          <button
            v-for="chip in activeFilterChips"
            :key="chip.key"
            type="button"
            class="product-page__chip"
            @click="clearChip(chip.key)"
          >
            <AppIcon :icon="X" :size="12" />
            <span>{{ chip.label }}</span>
          </button>
          <button class="product-page__chips-clear" type="button" @click="clearAllFilters">
            清空全部
          </button>
        </div>
      </div>
    </section>

    <section class="product-page__content">
      <aside class="product-page__sidebar">
        <ProductSidebarFilters
          v-model:max-price="maxPrice"
          v-model:min-price="minPrice"
          :brands="brandOptions"
          :category-groups="categoryOptions"
          :selected-brand-slugs="selectedBrandSlugs"
          :selected-category-slug="selectedCategorySlug"
          @apply="applyFilters"
          @reset="clearAllFilters"
          @toggle-brand="toggleBrand"
          @update-category="selectedCategorySlug = $event"
        />
      </aside>

      <section class="product-page__main">
        <div class="product-page__toolbar">
          <div class="product-page__title-group">
            <h1>产品列表</h1>
            <span>共 {{ totalResultsLabel }} 条结果</span>
          </div>

          <div class="product-page__toolbar-actions">
            <button
              class="product-page__filter-toggle"
              type="button"
              @click="mobileFilterOpen = true"
            >
              <AppIcon :icon="SlidersHorizontal" :size="16" />
              <span>筛选</span>
            </button>

            <div class="product-page__sorter">
              <span>排序：</span>
              <label>
                <select v-model="sortBy" aria-label="排序方式">
                  <option v-for="item in sortOptions" :key="item" :value="item">
                    {{ item }}
                  </option>
                </select>
                <AppIcon :icon="ChevronDown" :size="14" />
              </label>
            </div>

            <div class="product-page__view-switch">
              <button class="is-active" type="button" aria-label="列表视图">
                <AppIcon :icon="List" :size="16" />
              </button>
              <button type="button" aria-label="网格视图">
                <AppIcon :icon="Grid2x2" :size="16" />
              </button>
            </div>

            <button class="product-page__export" type="button">
              <AppIcon :icon="Download" :size="16" />
              <span>导出</span>
            </button>
          </div>
        </div>

        <div class="product-page__table">
          <div class="product-page__table-head">
            <span></span>
            <span>产品信息</span>
            <span>关键参数</span>
            <span>相关资料</span>
            <span>最新报价（含税）</span>
            <span>关联公司</span>
            <span>更新时间</span>
            <span></span>
          </div>

          <div v-if="errorMessage" class="product-page__empty">
            <strong>产品数据加载失败</strong>
            <p>{{ errorMessage }}</p>
            <button type="button" @click="loadProducts">重新加载</button>
          </div>

          <div v-else-if="loading" class="product-page__empty">
            <strong>正在加载产品数据</strong>
            <p>请稍候片刻。</p>
          </div>

          <template v-else>
            <ProductTableRow
              v-for="product in rows"
              :key="product.id"
              :product="product"
            />
          </template>

          <div v-if="!loading && !errorMessage && rows.length === 0" class="product-page__empty">
            <strong>没有匹配的产品</strong>
            <p>尝试清空筛选条件，或者更换关键词继续搜索。</p>
            <button type="button" @click="clearAllFilters">重置筛选</button>
          </div>
        </div>
      </section>
    </section>

    <div
      v-if="mobileFilterOpen"
      class="product-page__mobile-mask"
      @click="mobileFilterOpen = false"
    ></div>

    <aside
      class="product-page__mobile-panel"
      :class="{ 'is-open': mobileFilterOpen }"
    >
      <div class="product-page__mobile-panel-head">
        <strong>筛选条件</strong>
        <button type="button" @click="mobileFilterOpen = false">
          <AppIcon :icon="X" :size="16" />
        </button>
      </div>

      <ProductSidebarFilters
        v-model:max-price="maxPrice"
        v-model:min-price="minPrice"
        :brands="brandOptions"
        :category-groups="categoryOptions"
        :selected-brand-slugs="selectedBrandSlugs"
        :selected-category-slug="selectedCategorySlug"
        @apply="applyFilters"
        @reset="clearAllFilters"
        @toggle-brand="toggleBrand"
        @update-category="selectedCategorySlug = $event"
      />
    </aside>
  </div>
</template>

<style scoped>
.product-page {
  min-height: 100vh;
  color: #12213d;
  background: #fff;
}

.product-page__search-strip,
.product-page__content {
  max-width: 1540px;
  padding-right: 16px;
  padding-left: 16px;
  margin: 0 auto;
}

.product-page__search-strip {
  padding-top: 10px;
  padding-bottom: 10px;
}

.product-page__search-inner {
  width: min(100%, 1040px);
  margin: 0 auto;
}

.product-page__search-bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 92px;
  margin-bottom: 10px;
}

.product-page__search-input,
.product-page__search-button {
  height: 38px;
}

.product-page__search-input {
  border: 1px solid #d9e2ef;
}

.product-page__search-input {
  display: flex;
  align-items: center;
  padding: 0 10px 0 14px;
  border-radius: 6px 0 0 6px;
}

.product-page__search-input input {
  flex: 1 1 auto;
  min-width: 0;
  font: inherit;
  font-size: 14px;
  color: #24344f;
  border: 0;
  outline: none;
}

.product-page__search-input input::placeholder {
  color: #95a3b9;
}

.product-page__search-input button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  color: #8a98b4;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.product-page__search-button {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(180deg, #1677ff 0%, #1664d9 100%);
  border: 0;
  border-radius: 0 6px 6px 0;
}

.product-page__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.product-page__chips-label {
  font-size: 13px;
  color: #52627d;
}

.product-page__chip {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  font-size: 13px;
  color: #52627d;
  cursor: pointer;
  background: #f7faff;
  border: 1px solid #dfe8f6;
  border-radius: 4px;
}

.product-page__chips-clear {
  padding: 0;
  font-size: 13px;
  color: #1664d9;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.product-page__content {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
  padding-bottom: 20px;
}

.product-page__sidebar {
  position: sticky;
  top: 18px;
  overflow: hidden;
  border: 1px solid #e6edf7;
  border-radius: 6px;
}

.product-page__main {
  min-width: 0;
}

.product-page__toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0 14px;
}

.product-page__title-group {
  display: flex;
  gap: 18px;
  align-items: baseline;
}

.product-page__title-group h1 {
  position: relative;
  margin: 0;
  padding-bottom: 6px;
  font-size: 18px;
  font-weight: 700;
  color: #1664d9;
}

.product-page__title-group h1::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 3px;
  content: '';
  background: #1664d9;
  border-radius: 999px;
}

.product-page__title-group span {
  font-size: 14px;
  color: #60708d;
}

.product-page__toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: flex-end;
}

.product-page__filter-toggle,
.product-page__export,
.product-page__view-switch button {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  height: 34px;
  padding: 0 12px;
  font: inherit;
  font-size: 13px;
  color: #52627d;
  cursor: pointer;
  background: #fff;
  border: 1px solid #dce4f0;
  border-radius: 4px;
}

.product-page__filter-toggle {
  display: none;
}

.product-page__sorter {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
  color: #52627d;
}

.product-page__sorter label {
  position: relative;
  display: inline-flex;
  align-items: center;
  min-width: 110px;
  height: 34px;
  padding: 0 28px 0 10px;
  background: #fff;
  border: 1px solid #dce4f0;
  border-radius: 4px;
}

.product-page__sorter select {
  width: 100%;
  font: inherit;
  font-size: 13px;
  color: #233450;
  appearance: none;
  background: transparent;
  border: 0;
  outline: none;
}

.product-page__sorter .app-icon {
  position: absolute;
  right: 10px;
  color: #7f8ea7;
}

.product-page__view-switch {
  display: inline-flex;
  gap: 6px;
}

.product-page__view-switch button {
  width: 34px;
  padding: 0;
}

.product-page__view-switch button.is-active {
  color: #1664d9;
  background: #edf4ff;
  border-color: #d6e6ff;
}

.product-page__table {
  overflow: hidden;
  border: 1px solid #e6edf7;
  border-radius: 6px;
}

.product-page__table-head {
  display: grid;
  grid-template-columns: 34px minmax(0, 2.65fr) minmax(0, 1.55fr) 0.95fr 0.9fr 1.05fr 0.62fr 28px;
  gap: 16px;
  align-items: center;
  padding: 10px 14px;
  font-size: 12px;
  color: #60708d;
  background: #fafcff;
}

.product-page__empty {
  display: grid;
  gap: 10px;
  justify-items: center;
  padding: 52px 24px;
}

.product-page__empty strong {
  font-size: 16px;
}

.product-page__empty p {
  margin: 0;
  color: #60708d;
}

.product-page__empty button {
  height: 36px;
  padding: 0 16px;
  font: inherit;
  font-size: 14px;
  color: #fff;
  cursor: pointer;
  background: #1664d9;
  border: 0;
  border-radius: 6px;
}

.product-page__mobile-mask {
  position: fixed;
  inset: 0;
  z-index: 49;
  background: rgb(18 33 61 / 0.36);
}

.product-page__mobile-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  width: min(88vw, 360px);
  overflow-y: auto;
  background: #fff;
  box-shadow: -20px 0 60px rgb(18 33 61 / 0.18);
  transform: translateX(100%);
  transition: transform 0.22s ease;
}

.product-page__mobile-panel.is-open {
  transform: translateX(0);
}

.product-page__mobile-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #edf2f8;
}

.product-page__mobile-panel-head strong {
  font-size: 16px;
}

.product-page__mobile-panel-head button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  color: #52627d;
  cursor: pointer;
  background: transparent;
  border: 0;
}

@media (max-width: 1100px) {
  .product-page__content {
    grid-template-columns: 1fr;
  }

  .product-page__sidebar,
  .product-page__table-head {
    display: none;
  }

  .product-page__filter-toggle {
    display: inline-flex;
  }
}

@media (max-width: 760px) {
  .product-page__search-bar {
    grid-template-columns: 1fr;
  }

  .product-page__search-input {
    border-bottom: 0;
    border-radius: 6px 6px 0 0;
  }

  .product-page__search-button {
    border-radius: 0 0 6px 6px;
  }

  .product-page__toolbar,
  .product-page__title-group,
  .product-page__toolbar-actions {
    align-items: flex-start;
  }

  .product-page__toolbar,
  .product-page__title-group {
    flex-direction: column;
  }

  .product-page__toolbar-actions {
    justify-content: flex-start;
  }
}
</style>
