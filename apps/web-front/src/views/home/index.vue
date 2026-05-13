<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NSelect } from 'naive-ui';
import { Search } from 'lucide-vue-next';
import { RouterLink, useRouter } from 'vue-router';

import AppIcon from '#/components/AppIcon.vue';
import {
  getDashboardSummary,
  isUsingDemoData,
  listUpdates,
} from '#/api/product-info';
import FrontShell from '#/components/FrontShell.vue';
import { useAuthState } from '#/lib/auth';
import { getCategoryIcon, getUpdateTypeIcon } from '#/lib/front-icons';
import HomeCategoryTile from '#/views/home/components/HomeCategoryTile.vue';
import HomeProductCard from '#/views/home/components/HomeProductCard.vue';
import HomeSectionHeader from '#/views/home/components/HomeSectionHeader.vue';
import HomeSideCard from '#/views/home/components/HomeSideCard.vue';
import {
  features,
  hotKeywords,
  searchScopes,
} from '#/views/home/home-data';
import { getErrorMessage } from '#/lib/errors';

const auth = useAuthState();
const router = useRouter();
const loading = ref(false);
const errorMessage = ref('');
const dashboard = ref<Awaited<ReturnType<typeof getDashboardSummary>> | null>(
  null,
);
const updates = ref<Awaited<ReturnType<typeof listUpdates>>>([]);
const keyword = ref('');
const hasLoadedOnce = ref(false);
const searchScopeOptions = searchScopes.map((item) => ({
  label: item,
  value: item,
}));
const searchScope = ref(searchScopeOptions[1]?.value ?? searchScopeOptions[0]?.value ?? '产品');
const showInitialSkeleton = computed(
  () => loading.value && !hasLoadedOnce.value && !dashboard.value,
);
const showRefreshingBadge = computed(
  () => loading.value && hasLoadedOnce.value && !errorMessage.value,
);

const categoryTiles = computed(() => {
  const categories = dashboard.value?.categories || [];
  if (categories.length === 0) {
    return [];
  }

  return [
    ...categories.slice(0, 8).map((item) => ({
      count: `${item.count}`,
      icon: getCategoryIcon(item.name),
      label: item.name,
      to: `/categories/${item.slug}`,
    })),
    {
      count: '更多',
      icon: getCategoryIcon('更多分类'),
      label: '更多分类',
      to: '/categories',
    },
  ];
});

const hotProducts = computed(() =>
  (dashboard.value?.products || []).slice(0, 6).map((item) => ({
    image: item.imageUrl,
    name: item.name,
    price: item.priceRange,
    priceSuffix: item.latestQuote?.min_order_quantity
      ? `${item.latestQuote.min_order_quantity}+`
      : '待报价',
    specs: item.specEntries.slice(0, 2).map((spec) => `${spec.label} ${spec.value}`),
    to: `/products/${item.model}`,
  })),
);

const sideLinks = computed(() => [
  {
    accent: 'blue' as const,
    count: `${dashboard.value?.documentCount || 0}`,
    description: '规格书、图片、图纸和原始工作簿统一沉淀',
    icon: getUpdateTypeIcon('product'),
    title: '资料中心',
    to: '/documents',
    unit: '份',
  },
  {
    accent: 'orange' as const,
    count: `${dashboard.value?.quoteCount || 0}`,
    description: '按系列变体查看有效报价与阶梯价',
    icon: getUpdateTypeIcon('price_update'),
    title: '报价中心',
    to: '/quotes',
    unit: '条',
  },
  {
    accent: 'teal' as const,
    count: `${dashboard.value?.companies.length || 0}`,
    description: '供应商、品牌方和合作公司统一查看',
    icon: getUpdateTypeIcon('notice'),
    title: '公司库',
    to: '/companies',
    unit: '家',
  },
]);

const latestUpdates = computed(() =>
  updates.value.slice(0, 6).map((item) => ({
    date: item.created_at.slice(0, 10),
    title: item.title,
    tone:
      item.type === 'price_update'
        ? 'orange'
        : item.type === 'notice'
          ? 'cyan'
          : 'blue',
    type:
      item.type === 'price_update'
        ? '报价'
        : item.type === 'notice'
          ? '通知'
      : '产品',
  })),
);
const skeletonCategoryTiles = Array.from({ length: 6 }, (_, index) => index);
const skeletonProductTiles = Array.from({ length: 4 }, (_, index) => index);
const skeletonUpdateRows = Array.from({ length: 4 }, (_, index) => index);

function handleSearch() {
  const query = keyword.value.trim();
  const targetName =
    searchScope.value === '资料'
      ? 'documents'
      : searchScope.value === '报价'
        ? 'quotes'
        : searchScope.value === '公司'
          ? 'companies'
          : searchScope.value === '全部'
            ? 'products'
            : 'products';

  void router.push({
    name: targetName,
    query: query ? { keyword: query, scope: searchScope.value } : {},
  });
}

function handleKeywordClick(value: string) {
  keyword.value = value;
  handleSearch();
}

async function loadHomeData() {
  loading.value = true;
  errorMessage.value = '';

  try {
    const [dashboardSummary, latest] = await Promise.all([
      getDashboardSummary(),
      listUpdates(),
    ]);
    dashboard.value = dashboardSummary;
    updates.value = latest;
    hasLoadedOnce.value = true;
  } catch (error) {
    if (!hasLoadedOnce.value) {
      dashboard.value = null;
      updates.value = [];
    }
    errorMessage.value = getErrorMessage(error);
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

    void loadHomeData();
  },
  { immediate: true },
);
</script>

<template>
  <FrontShell>
    <section class="home-page">
      <section class="home-hero">
        <div class="shell-container home-hero__container">
          <div class="home-hero__content">
            <h1>专业的商品信息与商业数据平台</h1>
            <p>搜索产品、资料、报价、公司等信息，快速获取所需数据</p>

            <form class="home-search" @submit.prevent="handleSearch">
              <n-select
                v-model:value="searchScope"
                class="home-search__scope"
                :consistent-menu-width="false"
                :options="searchScopeOptions"
              />

              <input
                v-model="keyword"
                type="text"
                placeholder="搜索产品/资料/报价/公司"
              />

              <button type="submit" class="home-search__button">
                <AppIcon :icon="Search" :size="22" />
                <span>搜索</span>
              </button>
            </form>

            <div class="home-hot-keywords">
              <span>热门搜索：</span>
              <button
                v-for="item in hotKeywords"
                :key="item"
                type="button"
                @click="handleKeywordClick(item)"
              >
                {{ item }}
              </button>
            </div>
          </div>

          <div class="home-hero__decor" aria-hidden="true">
            <span class="home-hero__cube home-hero__cube--one"></span>
            <span class="home-hero__cube home-hero__cube--two"></span>
            <span class="home-hero__cube home-hero__cube--three"></span>
            <span class="home-hero__cube home-hero__cube--four"></span>
            <span class="home-hero__ribbon"></span>
          </div>
        </div>
      </section>

      <section class="shell-container home-board">
        <div class="home-main">
          <section class="home-panel">
            <HomeSectionHeader title="分类入口" link-label="查看全部" link-to="/categories" />
            <div v-if="showInitialSkeleton" class="home-category-grid home-category-grid--skeleton">
              <div
                v-for="item in skeletonCategoryTiles"
                :key="`category-skeleton-${item}`"
                class="home-skeleton-card home-skeleton-card--tile"
              ></div>
            </div>
            <div v-else-if="categoryTiles.length" class="home-category-grid">
              <HomeCategoryTile
                v-for="item in categoryTiles"
                :key="item.label"
                :count="item.count"
                :icon="item.icon"
                :label="item.label"
                :to="item.to"
              />
            </div>
            <div v-else class="home-section-empty">
              <strong>分类数据正在补充中</strong>
              <p>当前还没有可展示的分类入口，稍后刷新后会自动显示最新内容。</p>
            </div>
          </section>

          <section class="home-panel">
            <HomeSectionHeader title="热门产品" link-label="查看全部" link-to="/products" />
            <div v-if="showInitialSkeleton" class="home-product-grid home-product-grid--skeleton">
              <div
                v-for="item in skeletonProductTiles"
                :key="`product-skeleton-${item}`"
                class="home-skeleton-card home-skeleton-card--product"
              ></div>
            </div>
            <div v-else-if="hotProducts.length" class="home-product-grid">
              <HomeProductCard
                v-for="item in hotProducts"
                :key="item.name"
                :image="item.image"
                :name="item.name"
                :price="item.price"
                :price-suffix="item.priceSuffix"
                :specs="item.specs"
                :to="item.to"
              />
            </div>
            <div v-else class="home-section-empty">
              <strong>暂时没有热门产品</strong>
              <p>可以先通过上方搜索入口查找型号、资料或报价，热门区会随着数据积累自动更新。</p>
            </div>
          </section>

          <section class="home-panel home-panel--features">
            <div class="home-feature-strip">
              <article
                v-for="item in features"
                :key="item.title"
                class="home-feature-card"
              >
                <span class="home-feature-card__icon">
                  <AppIcon :icon="item.icon" :size="24" />
                </span>
                <div>
                  <strong>{{ item.title }}</strong>
                  <p>{{ item.description }}</p>
                </div>
              </article>
            </div>
          </section>
        </div>

        <aside class="home-side-column">
          <HomeSideCard
            v-for="item in sideLinks"
            :key="item.title"
            :accent="item.accent"
            :count="item.count"
            :description="item.description"
            :icon="item.icon"
            :title="item.title"
            :to="item.to"
            :unit="item.unit"
          />

          <section class="home-updates-card">
            <div class="home-card-head">
              <HomeSectionHeader title="最新动态" link-label="查看全部" link-to="/updates" />
              <span v-if="showRefreshingBadge" class="home-refresh-badge">内容已缓存，正在刷新</span>
            </div>

            <div v-if="showInitialSkeleton" class="home-updates-list">
              <div
                v-for="item in skeletonUpdateRows"
                :key="`update-skeleton-${item}`"
                class="home-update-skeleton"
              >
                <span class="home-update-skeleton__tag"></span>
                <div class="home-update-skeleton__content">
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
            <div v-else-if="latestUpdates.length" class="home-updates-list">
              <RouterLink
                v-for="item in latestUpdates"
                :key="`${item.type}-${item.title}`"
                to="/updates"
                class="home-update-row"
              >
                <div class="home-update-row__main">
                  <span
                    class="home-update-row__tag"
                    :class="`home-update-row__tag--${item.tone}`"
                  >
                    {{ item.type }}
                  </span>
                  <strong>{{ item.title }}</strong>
                </div>
                <span class="home-update-row__date">{{ item.date }}</span>
              </RouterLink>
            </div>
            <div v-else class="home-section-empty home-section-empty--compact">
              <strong>还没有最新动态</strong>
              <p>产品更新、报价变动和平台通知会在这里按时间自动汇总。</p>
            </div>
            <p v-if="errorMessage" class="home-load-error">{{ errorMessage }}</p>
          </section>
        </aside>
      </section>
    </section>
  </FrontShell>
</template>

<style scoped>
.home-page {
  position: relative;
  padding-bottom: 28px;
  overflow: hidden;
}

.home-page::before {
  position: absolute;
  inset: 0;
  content: '';
  background:
    radial-gradient(circle at left 20%, rgb(22 100 217 / 0.1), transparent 34%),
    radial-gradient(circle at right 14%, rgb(22 100 217 / 0.08), transparent 28%),
    linear-gradient(180deg, #fbfdff 0%, #f5f8fd 100%);
}

.home-page > * {
  position: relative;
  z-index: 1;
}

.home-hero {
  position: relative;
  overflow: hidden;
}

.home-hero::before {
  position: absolute;
  inset: 0;
  content: '';
  background:
    linear-gradient(
      90deg,
      rgb(255 255 255 / 0.12) 0%,
      rgb(255 255 255 / 0.16) 100%
    );
}

.home-hero__container {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  min-height: 178px;
  padding-top: 18px;
  padding-bottom: 10px;
}

.home-hero__content {
  position: relative;
  z-index: 1;
  max-width: 860px;
  margin: 0 auto;
  text-align: center;
}

.home-hero__content h1 {
  margin: 0 0 6px;
  font-size: clamp(24px, 2.2vw, 32px);
  font-weight: 700;
  line-height: 1.28;
  color: #12213d;
}

.home-hero__content p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #60708d;
}

.home-search {
  display: grid;
  grid-template-columns: 94px minmax(0, 1fr) 126px;
  max-width: 690px;
  margin: 14px auto 0;
  overflow: hidden;
  background: #fff;
  border: 1px solid #dbe5f4;
  border-radius: 10px;
  box-shadow: 0 12px 30px rgb(18 33 61 / 0.06);
}

.home-search__scope {
  min-width: 0;
}

.home-search input,
.home-search__button {
  width: 100%;
  height: 48px;
  font: inherit;
}

.home-search input {
  border: 0;
  outline: none;
}

.home-search :deep(.home-search__scope .n-base-selection) {
  height: 48px;
  border: 0;
  border-right: 1px solid #edf2f8;
  border-radius: 10px 0 0 10px;
  box-shadow: none;
}

.home-search :deep(.home-search__scope .n-base-selection-label) {
  height: 48px;
}

.home-search :deep(.home-search__scope .n-base-selection-input) {
  font-size: 14px;
  font-weight: 700;
  color: #12213d;
}

.home-search :deep(.home-search__scope .n-base-selection-placeholder) {
  color: #12213d;
}

.home-search :deep(.home-search__scope .n-base-selection-arrow) {
  color: #8a98b4;
}

.home-search :deep(.home-search__scope .n-base-selection-tags) {
  padding-left: 2px;
}

.home-search input {
  padding: 0 16px;
  font-size: 14px;
  color: #12213d;
}

.home-search input::placeholder {
  color: #8fa0bb;
}

.home-search__button {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(180deg, #1677ff 0%, #1664d9 100%);
  border: 0;
}

.home-hot-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
}

.home-hot-keywords span {
  font-size: 13px;
  color: #60708d;
}

.home-hot-keywords button {
  height: 28px;
  padding: 0 12px;
  font-size: 12px;
  color: #233450;
  cursor: pointer;
  background: #f3f6fb;
  border: 1px solid #edf2f8;
  border-radius: 10px;
  transition:
    color 0.2s ease,
    background 0.2s ease;
}

.home-hot-keywords button:hover {
  color: #1664d9;
  background: #edf4ff;
}

.home-hero__decor {
  position: absolute;
  top: 2px;
  right: 0;
  bottom: 0;
  width: min(31vw, 420px);
  pointer-events: none;
  opacity: 0.92;
}

.home-hero__cube,
.home-hero__ribbon {
  position: absolute;
}

.home-hero__cube {
  background: linear-gradient(145deg, rgb(230 239 255 / 0.94), rgb(245 249 255 / 0.86));
  border: 1px solid rgb(227 235 248 / 0.96);
  box-shadow: 0 18px 38px rgb(18 33 61 / 0.04);
}

.home-hero__cube::before {
  position: absolute;
  inset: 0;
  content: '';
  background: linear-gradient(145deg, rgb(255 255 255 / 0.65), transparent 70%);
}

.home-hero__cube--one {
  top: 8px;
  right: 54px;
  width: 98px;
  height: 98px;
  transform: rotate(45deg);
}

.home-hero__cube--two {
  top: 102px;
  right: -20px;
  width: 124px;
  height: 124px;
  transform: rotate(45deg);
}

.home-hero__cube--three {
  top: 122px;
  right: 132px;
  width: 60px;
  height: 60px;
  transform: rotate(45deg);
}

.home-hero__cube--four {
  top: 40px;
  right: 152px;
  width: 48px;
  height: 48px;
  transform: rotate(45deg);
}

.home-hero__ribbon {
  top: 16px;
  right: 26px;
  width: 244px;
  height: 204px;
  opacity: 0.84;
}

.home-hero__ribbon::before,
.home-hero__ribbon::after {
  position: absolute;
  inset: 0;
  content: '';
  border: 26px solid rgb(213 227 253 / 0.7);
  border-radius: 42px;
  transform: skewX(-12deg) rotate(32deg);
}

.home-hero__ribbon::after {
  inset: 38px 46px;
  border-width: 18px;
  border-color: rgb(228 237 254 / 0.78);
}

.home-board {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 14px;
  align-items: start;
  padding-top: 8px;
}

.home-main,
.home-updates-card {
  min-width: 0;
}

.home-main {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.home-panel,
.home-updates-card {
  background: linear-gradient(180deg, #fff 0%, #fbfcff 100%);
  border: 1px solid #e7edf6;
  border-radius: 16px;
  box-shadow: 0 10px 28px rgb(18 33 61 / 0.04);
}

.home-panel {
  padding: 16px;
}

.home-panel--features {
  padding-top: 14px;
  padding-bottom: 14px;
}

.home-category-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.home-product-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}

.home-side-column {
  display: grid;
  gap: 14px;
}

.home-updates-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px 18px 10px;
}

.home-card-head {
  display: grid;
  gap: 10px;
}

.home-refresh-badge {
  justify-self: start;
  padding: 6px 10px;
  font-size: 12px;
  color: #1664d9;
  background: #edf4ff;
  border: 1px solid #d7e7ff;
  border-radius: 999px;
}

.home-updates-list {
  display: grid;
}

.home-update-skeleton,
.home-skeleton-card {
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, #f8fbff 0%, #f2f6fc 100%);
  border: 1px solid #e7eef8;
  border-radius: 14px;
}

.home-update-skeleton::before,
.home-skeleton-card::before {
  position: absolute;
  inset: 0;
  content: '';
  background: linear-gradient(
    110deg,
    transparent 0%,
    rgb(255 255 255 / 0.86) 40%,
    transparent 75%
  );
  transform: translateX(-100%);
  animation: home-skeleton-shimmer 1.5s ease-in-out infinite;
}

.home-skeleton-card--tile {
  min-height: 116px;
}

.home-skeleton-card--product {
  min-height: 248px;
}

.home-update-skeleton {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  min-height: 72px;
  padding: 12px 0;
  background: transparent;
  border: 0;
  border-radius: 0;
}

.home-update-skeleton + .home-update-skeleton {
  border-top: 1px solid #edf2f8;
}

.home-update-skeleton__tag,
.home-update-skeleton__content span {
  display: block;
  height: 14px;
  background: #e6edf8;
  border-radius: 999px;
}

.home-update-skeleton__tag {
  width: 44px;
  height: 22px;
}

.home-update-skeleton__content {
  display: grid;
  gap: 10px;
}

.home-update-skeleton__content span:first-child {
  width: 82%;
}

.home-update-skeleton__content span:last-child {
  width: 38%;
}

.home-section-empty {
  display: grid;
  gap: 8px;
  justify-items: center;
  min-height: 164px;
  padding: 28px 20px;
  text-align: center;
  background: linear-gradient(180deg, #f9fbff 0%, #f4f8fe 100%);
  border: 1px dashed #d7e4f5;
  border-radius: 14px;
}

.home-section-empty--compact {
  min-height: 128px;
}

.home-section-empty strong {
  font-size: 18px;
  color: #1a2d4c;
}

.home-section-empty p {
  max-width: 420px;
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: #6a7b97;
}

.home-update-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: flex-start;
  padding: 10px 0;
}

.home-update-row + .home-update-row {
  border-top: 1px solid #edf2f8;
}

.home-update-row__main {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 8px;
  align-items: flex-start;
  min-width: 0;
}

.home-update-row__tag {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 22px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 8px;
}

.home-update-row__tag--blue {
  color: #1664d9;
  background: #edf4ff;
}

.home-update-row__tag--orange {
  color: #f05a1a;
  background: #fff3eb;
}

.home-update-row__tag--cyan {
  color: #0f79cf;
  background: #eaf6ff;
}

.home-update-row__tag--teal {
  color: #169e95;
  background: #eaf9f6;
}

.home-update-row strong {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.6;
  color: #3f4e68;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.home-update-row__date {
  flex: 0 0 auto;
  padding-top: 2px;
  font-size: 13px;
  white-space: nowrap;
  color: #8d9cb4;
}

.home-feature-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.home-feature-card {
  display: flex;
  gap: 14px;
  align-items: center;
  min-height: 76px;
  padding: 14px 14px 12px;
  background: linear-gradient(180deg, #fff 0%, #fcfdff 100%);
  border: 1px solid #edf2f8;
  border-radius: 12px;
}

.home-feature-card__icon {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  color: #1664d9;
  background: #f6faff;
  border: 1px solid #e0ebfa;
  border-radius: 999px;
}

.home-feature-card strong {
  display: block;
  margin-bottom: 4px;
  font-size: 16px;
  line-height: 1.2;
  color: #12213d;
}

.home-feature-card p {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: #60708d;
}

.home-load-error {
  margin: 12px 0 0;
  font-size: 13px;
  color: #d84a4a;
}

@keyframes home-skeleton-shimmer {
  100% {
    transform: translateX(100%);
  }
}

@media (max-width: 1200px) {
  .home-category-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .home-product-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .home-feature-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1024px) {
  .home-board {
    grid-template-columns: 1fr;
  }

  .home-side-column {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .home-updates-card {
    grid-column: 1 / -1;
    min-height: 0;
  }
}

@media (max-width: 860px) {
  .home-hero__container {
    min-height: auto;
    padding-top: 18px;
    padding-bottom: 14px;
  }

  .home-hero__content {
    max-width: none;
    margin: 0;
    text-align: left;
  }

  .home-hero__content p {
    font-size: 14px;
  }

  .home-search {
    grid-template-columns: 1fr;
    margin-top: 16px;
  }

  .home-search :deep(.home-search__scope .n-base-selection),
  .home-search input {
    border-bottom: 1px solid #edf2f8;
    border-right: 0;
  }

  .home-search :deep(.home-search__scope .n-base-selection) {
    border-radius: 10px 10px 0 0;
  }

  .home-hot-keywords {
    justify-content: flex-start;
  }

  .home-hero__decor {
    display: none;
  }

  .home-category-grid,
  .home-product-grid,
  .home-side-column {
    grid-template-columns: 1fr;
  }

  .home-panel {
    padding: 14px;
  }

  .home-updates-card {
    padding: 14px 14px 8px;
  }

  .home-feature-strip {
    grid-template-columns: 1fr;
  }
}
</style>
