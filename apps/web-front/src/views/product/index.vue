<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NPagination, NSkeleton } from 'naive-ui';
import {
  ChevronDown,
  Download,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-vue-next';
import { useRoute, useRouter } from 'vue-router';

import type {
  BrandFilter,
  CatalogProduct,
  CategoryGroup,
} from '@/views/product/product-list-data';

import {
  exportProductsCsv,
  formatCompanyType,
  formatDocumentType,
  formatDate,
  formatStatus,
  isUsingDemoData,
  listAllProducts,
  listProducts,
  type ProductListOptions,
  type ProductListItem,
} from '@/api/product-info';
import AppIcon from '@/components/AppIcon.vue';
import { useAuthState } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import ProductSidebarFilters from '@/views/product/components/ProductSidebarFilters.vue';
import ProductTableRow from '@/views/product/components/ProductTableRow.vue';

const auth = useAuthState();
const route = useRoute();
const router = useRouter();
const loading = ref(false);
const exporting = ref(false);
const errorMessage = ref('');
const keyword = ref('');
const products = ref<ProductListItem[]>([]);
const brandFacetProducts = ref<ProductListItem[]>([]);
const categoryFacetProducts = ref<ProductListItem[]>([]);
const currentPage = ref(1);
const selectedCategorySlug = ref('');
const selectedBrandSlugs = ref<string[]>([]);
const minPrice = ref('');
const maxPrice = ref('');
const sortBy = ref<NonNullable<ProductListOptions['sortBy']>>('相关度');
const mobileFilterOpen = ref(false);
const pageSize = 20;
const totalResults = ref(0);
const totalPages = ref(1);
const skeletonProductRows = Array.from({ length: 6 }, (_, index) => index);

const sortOptions = ['相关度', '最新更新', '价格从低到高'] as const;

function isSortOption(value: string): value is NonNullable<ProductListOptions['sortBy']> {
  return sortOptions.includes(value as (typeof sortOptions)[number]);
}

const brandOptions = computed<BrandFilter[]>(() => {
  const map = new Map<string, { count: number; label: string }>();
  for (const item of brandFacetProducts.value) {
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
  const map = new Map<string, { count: number; label: string }>();
  for (const item of categoryFacetProducts.value) {
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
      count: categoryFacetProducts.value.length,
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

function normalizePriceValue(value: unknown) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.replace(/[^\d.]/g, '').trim();
}

function formatUpdatedAgo(value: string) {
  const updatedAt = new Date(value).getTime();
  if (Number.isNaN(updatedAt)) {
    return '';
  }

  const diffMs = Date.now() - updatedAt;
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  if (diffMs < hour) {
    const minutes = Math.max(1, Math.floor(diffMs / (60 * 1000)));
    return `${minutes} 分钟前`;
  }

  if (diffMs < day) {
    return `${Math.floor(diffMs / hour)} 小时前`;
  }

  return `${Math.floor(diffMs / day)} 天前`;
}

function buildDocumentLinks(product: ProductListItem) {
  const tones: Array<'blue' | 'red'> = ['red', 'blue'];

  return (product.documentTypes || [])
    .slice(0, 2)
    .map((fileType, index) => ({
      label: formatDocumentType(fileType),
      tone: tones[index] || 'blue',
    }));
}

function syncRouteFilters() {
  keyword.value = normalizeQueryValue(route.query.keyword);
  selectedCategorySlug.value = normalizeQueryValue(route.query.categorySlug);
  selectedBrandSlugs.value = normalizeQueryValues(route.query.brandSlug);
  minPrice.value = normalizePriceValue(route.query.minPrice);
  maxPrice.value = normalizePriceValue(route.query.maxPrice);
  currentPage.value = Math.max(1, Number(normalizeQueryValue(route.query.page)) || 1);

  const nextSortBy = normalizeQueryValue(route.query.sortBy);
  sortBy.value = isSortOption(nextSortBy) ? nextSortBy : '相关度';
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
  return products.value.map((product) => ({
    brandName: product.brand || '未设置品牌',
    brandSlug: product.brandSlug || 'unknown-brand',
    categorySlug: product.categorySlug || 'uncategorized',
    companyId: product.companyId || undefined,
    companyName: product.company,
    docCount: product.documentCount,
    docs: buildDocumentLinks(product),
    id: product.model,
    image: product.imageUrl,
    minimumOrder: product.latestQuote?.min_order_quantity
      ? `${product.latestQuote.min_order_quantity} 台`
      : '暂无',
    model: product.model,
    name: product.name,
    price: product.priceRange,
    productId: product.id,
    quoteRole: product.companyType
      ? formatCompanyType(product.companyType)
      : '关联公司',
    specs: product.specEntries.slice(0, 4).map((item) => ({
      label: item.label,
      value: item.value,
    })),
    summary: product.summary,
    tags: product.tags,
    updatedAgo: formatUpdatedAgo(product.updatedAt),
    updatedDate: formatDate(product.updatedAt),
    statusLabel: formatStatus(product.status),
  }));
});

const activeFilterChips = computed(() => {
  const chips: Array<{ key: string; label: string }> = [];

  if (keyword.value.trim()) {
    chips.push({
      key: 'keyword',
      label: `关键词：${keyword.value.trim()}`,
    });
  }

  if (selectedCategoryLabel.value) {
    chips.push({
      key: 'category',
      label: `分类：${selectedCategoryLabel.value}`,
    });
  }

  if (selectedBrandSlugs.value.length > 0) {
    chips.push({
      key: 'brand',
      label: `品牌：${selectedBrandLabel.value}`,
    });
  }

  if (minPrice.value || maxPrice.value) {
    chips.push({
      key: 'price',
      label: `价格：${minPrice.value || '不限'} - ${maxPrice.value || '不限'}`,
    });
  }

  return chips;
});

const totalResultsLabel = computed(() => {
  return totalResults.value.toLocaleString('zh-CN');
});
const showInitialSkeleton = computed(
  () => loading.value && rows.value.length === 0 && !errorMessage.value,
);

function buildProductsRouteQuery() {
  const query: Record<string, string | string[]> = {};

  if (keyword.value.trim()) {
    query.keyword = keyword.value.trim();
  }

  if (selectedCategorySlug.value) {
    query.categorySlug = selectedCategorySlug.value;
  }

  if (selectedBrandSlugs.value.length > 0) {
    query.brandSlug = selectedBrandSlugs.value;
  }

  if (minPrice.value) {
    query.minPrice = minPrice.value;
  }

  if (maxPrice.value) {
    query.maxPrice = maxPrice.value;
  }

  if (sortBy.value !== '相关度') {
    query.sortBy = sortBy.value;
  }

  if (currentPage.value > 1) {
    query.page = String(currentPage.value);
  }

  return query;
}

function replaceProductsRouteQuery({
  page = currentPage.value,
}: {
  page?: number;
} = {}) {
  currentPage.value = page;
  void router.replace({
    name: 'products',
    query: buildProductsRouteQuery(),
  });
}

function submitSearch() {
  replaceProductsRouteQuery({ page: 1 });
}

function toggleBrand(slug: string) {
  if (selectedBrandSlugs.value.includes(slug)) {
    selectedBrandSlugs.value = selectedBrandSlugs.value.filter(
      (item) => item !== slug,
    );
  } else {
    selectedBrandSlugs.value = [...selectedBrandSlugs.value, slug];
  }

  replaceProductsRouteQuery({ page: 1 });
}

function clearChip(key: string) {
  if (key === 'keyword') {
    keyword.value = '';
  } else if (key === 'category') {
    selectedCategorySlug.value = '';
  } else if (key === 'brand') {
    selectedBrandSlugs.value = [];
  } else if (key === 'price') {
    minPrice.value = '';
    maxPrice.value = '';
  }

  replaceProductsRouteQuery({ page: 1 });
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
  replaceProductsRouteQuery({ page: 1 });
}

function updateCategory(slug: string) {
  selectedCategorySlug.value = slug;
  replaceProductsRouteQuery({ page: 1 });
}

function handleSortChange() {
  replaceProductsRouteQuery({ page: 1 });
}

function buildProductFilterOptions(
  overrides: Partial<Omit<ProductListOptions, 'page' | 'pageSize'>> = {},
): Omit<ProductListOptions, 'page' | 'pageSize'> {
  return {
    brandSlugs: selectedBrandSlugs.value,
    categorySlug: selectedCategorySlug.value || undefined,
    keyword: keyword.value || undefined,
    maxPrice: maxPrice.value ? Number(maxPrice.value) : undefined,
    minPrice: minPrice.value ? Number(minPrice.value) : undefined,
    sortBy: sortBy.value,
    ...overrides,
  };
}

function handlePageChange(page: number) {
  replaceProductsRouteQuery({ page });
}

async function handleExport() {
  exporting.value = true;

  try {
    const csv = await exportProductsCsv(buildProductFilterOptions());
    const blob = new Blob([`\uFEFF${csv}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `products-${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    errorMessage.value = getErrorMessage(error);
  } finally {
    exporting.value = false;
  }
}

async function loadProducts() {
  loading.value = true;
  errorMessage.value = '';

  try {
    const baseOptions = buildProductFilterOptions();
    const [pagedResult, brands, categories] = await Promise.all([
      listProducts({
        ...baseOptions,
        page: currentPage.value,
        pageSize,
      }),
      listAllProducts({
        ...baseOptions,
        brandSlugs: undefined,
      }),
      listAllProducts({
        ...baseOptions,
        categorySlug: undefined,
      }),
    ]);

    products.value = pagedResult.items;
    brandFacetProducts.value = brands;
    categoryFacetProducts.value = categories;
    totalResults.value = pagedResult.total;
    totalPages.value = pagedResult.totalPages;

    if (pagedResult.page !== currentPage.value) {
      replaceProductsRouteQuery({ page: pagedResult.page });
    }
  } catch (error) {
    errorMessage.value = getErrorMessage(error);
    products.value = [];
    brandFacetProducts.value = [];
    categoryFacetProducts.value = [];
    totalResults.value = 0;
    totalPages.value = 1;
  } finally {
    loading.value = false;
  }
}

watch(
  () => [auth.initialized, isUsingDemoData(), route.fullPath],
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
            <button type="button" aria-label="清空搜索" @click="keyword = ''; submitSearch()">
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
          <button
            v-if="activeFilterChips.length"
            class="product-page__chips-clear"
            type="button"
            @click="clearAllFilters"
          >
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
          @update-category="updateCategory"
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
                <select
                  v-model="sortBy"
                  aria-label="排序方式"
                  @change="handleSortChange"
                >
                  <option v-for="item in sortOptions" :key="item" :value="item">
                    {{ item }}
                  </option>
                </select>
                <AppIcon :icon="ChevronDown" :size="14" />
              </label>
            </div>

            <button
              class="product-page__export"
              type="button"
              :disabled="exporting || totalResults === 0"
              @click="handleExport"
            >
              <AppIcon :icon="Download" :size="16" />
              <span>{{ exporting ? '导出中' : '导出 CSV' }}</span>
            </button>
          </div>
        </div>

        <div
          class="product-page__table"
          :class="{ 'is-refreshing': loading && rows.length > 0 }"
        >
          <div class="product-page__table-head">
            <span>产品信息</span>
            <span>关键参数</span>
            <span>相关资料</span>
            <span>最新报价（含税）</span>
            <span>关联公司</span>
            <span>更新时间</span>
          </div>

          <div v-if="errorMessage" class="product-page__empty">
            <strong>产品数据加载失败</strong>
            <p>{{ errorMessage }}</p>
            <button type="button" @click="loadProducts">重新加载</button>
          </div>

          <div v-else-if="showInitialSkeleton" class="product-page__skeleton" aria-hidden="true">
            <article
              v-for="item in skeletonProductRows"
              :key="`product-row-skeleton-${item}`"
              class="product-page__skeleton-row"
            >
              <div class="product-page__skeleton-info">
                <n-skeleton class="product-page__skeleton-thumb" />
                <div class="product-page__skeleton-copy">
                  <div class="product-page__skeleton-title-row">
                    <n-skeleton text class="product-page__skeleton-line product-page__skeleton-line--title" />
                    <n-skeleton class="product-page__skeleton-pill" />
                  </div>
                  <n-skeleton text class="product-page__skeleton-line product-page__skeleton-line--medium" />
                  <n-skeleton text class="product-page__skeleton-line product-page__skeleton-line--wide" />
                  <div class="product-page__skeleton-tags">
                    <n-skeleton class="product-page__skeleton-tag" />
                    <n-skeleton class="product-page__skeleton-tag" />
                  </div>
                </div>
              </div>
              <div class="product-page__skeleton-stack">
                <n-skeleton text class="product-page__skeleton-line product-page__skeleton-line--wide" />
                <n-skeleton text class="product-page__skeleton-line product-page__skeleton-line--medium" />
                <n-skeleton text class="product-page__skeleton-line product-page__skeleton-line--short" />
              </div>
              <div class="product-page__skeleton-stack">
                <n-skeleton class="product-page__skeleton-tag product-page__skeleton-tag--long" />
                <n-skeleton class="product-page__skeleton-tag product-page__skeleton-tag--long" />
              </div>
              <div class="product-page__skeleton-stack">
                <n-skeleton text class="product-page__skeleton-line product-page__skeleton-line--price" />
                <n-skeleton text class="product-page__skeleton-line product-page__skeleton-line--medium" />
              </div>
              <div class="product-page__skeleton-stack">
                <n-skeleton text class="product-page__skeleton-line product-page__skeleton-line--wide" />
                <n-skeleton class="product-page__skeleton-tag" />
              </div>
              <div class="product-page__skeleton-stack">
                <n-skeleton text class="product-page__skeleton-line product-page__skeleton-line--medium" />
                <n-skeleton text class="product-page__skeleton-line product-page__skeleton-line--short" />
              </div>
            </article>
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

        <div
          v-if="!showInitialSkeleton && !errorMessage && totalResults > 0"
          class="product-page__pagination"
        >
          <span class="product-page__pagination-summary">
            第 {{ currentPage }} / {{ totalPages }} 页，共 {{ totalResultsLabel }} 条
          </span>
          <n-pagination
            :item-count="totalResults"
            :page="currentPage"
            :page-size="pageSize"
            @update:page="handlePageChange"
          />
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
        @update-category="updateCategory"
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
.product-page__export {
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

.product-page__export:disabled {
  color: #9aa8bf;
  cursor: not-allowed;
  background: #f7f9fc;
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

.product-page__table {
  overflow: hidden;
  border: 1px solid #e6edf7;
  border-radius: 6px;
}

.product-page__table.is-refreshing .product-table-row {
  opacity: 0.68;
  transition: opacity 0.18s ease;
}

.product-page__table-head {
  display: grid;
  grid-template-columns: minmax(0, 2.8fr) minmax(0, 1.5fr) 0.95fr 0.9fr 1.05fr 0.62fr;
  gap: 16px;
  align-items: center;
  padding: 10px 14px;
  font-size: 12px;
  color: #60708d;
  background: #fafcff;
}

.product-page__skeleton {
  display: grid;
}

.product-page__skeleton-row {
  display: grid;
  grid-template-columns: minmax(0, 2.8fr) minmax(0, 1.5fr) 0.95fr 0.9fr 1.05fr 0.62fr;
  gap: 16px;
  align-items: stretch;
  padding: 12px 14px;
  border-top: 1px solid #edf2f8;
}

.product-page__skeleton-info {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  min-width: 0;
}

.product-page__skeleton-thumb {
  flex: 0 0 auto;
  width: 96px;
  height: 96px;
  border-radius: 8px;
}

.product-page__skeleton-copy,
.product-page__skeleton-stack {
  display: grid;
  gap: 10px;
  align-content: flex-start;
  min-width: 0;
}

.product-page__skeleton-copy {
  flex: 1 1 auto;
  padding-top: 2px;
}

.product-page__skeleton-title-row,
.product-page__skeleton-tags {
  display: flex;
  gap: 8px;
  align-items: center;
}

.product-page__skeleton-line,
.product-page__skeleton-pill,
.product-page__skeleton-tag {
  display: block;
}

.product-page__skeleton-line--title {
  width: 58%;
  height: 18px;
}

.product-page__skeleton-line--wide {
  width: 86%;
}

.product-page__skeleton-line--medium {
  width: 62%;
}

.product-page__skeleton-line--short {
  width: 42%;
}

.product-page__skeleton-line--price {
  width: 74%;
  height: 28px;
}

.product-page__skeleton-pill {
  width: 42px;
  height: 22px;
  border-radius: 4px;
}

.product-page__skeleton-tag {
  width: 58px;
  height: 22px;
  border-radius: 4px;
}

.product-page__skeleton-tag--long {
  width: 74px;
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

.product-page__pagination {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 16px 4px 0;
}

.product-page__pagination-summary {
  font-size: 13px;
  color: #60708d;
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

  .product-page__skeleton-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 14px;
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

  .product-page__pagination {
    align-items: flex-start;
    justify-content: flex-start;
  }
}

@media (max-width: 680px) {
  .product-page__skeleton-row {
    padding: 14px 12px;
  }

  .product-page__skeleton-info {
    flex-direction: column;
  }

  .product-page__skeleton-thumb {
    width: 100%;
    max-width: 280px;
  }
}
</style>
