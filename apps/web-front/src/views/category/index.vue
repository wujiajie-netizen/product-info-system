<script setup lang="ts">
import { computed, ref } from 'vue';
import { ChevronRight, Flame, Hash } from 'lucide-vue-next';
import { RouterLink } from 'vue-router';

import AppIcon from '@/components/AppIcon.vue';
import FrontShell from '@/components/FrontShell.vue';
import CategoryBrandCard from '@/views/category/components/CategoryBrandCard.vue';
import CategoryNavCard from '@/views/category/components/CategoryNavCard.vue';
import CategoryQuickEntryCard from '@/views/category/components/CategoryQuickEntryCard.vue';
import CategoryRecentUpdateItem from '@/views/category/components/CategoryRecentUpdateItem.vue';
import {
  allBrandItems,
  brandIndexGroups,
  brandLetters,
  categoryKeywordColumns,
  categoryNavigationItems,
  hotBrandItems,
  industryTopics,
  platformStats,
  quickEntryItems,
  recentUpdateItems,
} from '@/views/category/category-navigation-data';

const props = defineProps<{
  slug?: string;
}>();

const brandTab = ref<'all' | 'hot'>('hot');
const activeLetter = ref('全部');

const visibleBrands = computed(() =>
  brandTab.value === 'hot' ? hotBrandItems : allBrandItems,
);

const visibleBrandGroups = computed(() => {
  if (activeLetter.value === '全部') {
    return brandIndexGroups;
  }

  return brandIndexGroups.filter((item) => item.letter === activeLetter.value);
});

function buildProductQuery(slug: string) {
  return {
    name: 'products',
    query: {
      categorySlug: slug,
    },
  };
}

function buildBrandQuery(slug: string) {
  return {
    name: 'products',
    query: {
      brandSlug: slug,
    },
  };
}
</script>

<template>
  <FrontShell>
    <section class="category-page">
      <div class="shell-container category-page__container">
        <div class="category-page__grid">
          <div class="category-page__main">
            <section class="category-panel">
              <div class="category-panel__header">
                <h2>分类导航</h2>
                <RouterLink class="category-panel__link" :to="{ name: 'products' }">
                  <span>查看全部分类</span>
                  <AppIcon :icon="ChevronRight" :size="16" />
                </RouterLink>
              </div>

              <div class="category-page__nav-grid">
                <CategoryNavCard
                  v-for="item in categoryNavigationItems"
                  :key="item.slug"
                  :active="item.slug === props.slug"
                  :count="item.count"
                  :icon="item.icon"
                  :label="item.label"
                  :to="buildProductQuery(item.slug)"
                />
              </div>
            </section>

            <section class="category-panel">
              <div class="category-panel__header">
                <div class="category-panel__title-stack">
                  <h2>品牌导航</h2>
                  <div class="category-page__tabs">
                    <button
                      type="button"
                      :class="{ 'is-active': brandTab === 'hot' }"
                      @click="brandTab = 'hot'"
                    >
                      热门品牌
                    </button>
                    <button
                      type="button"
                      :class="{ 'is-active': brandTab === 'all' }"
                      @click="brandTab = 'all'"
                    >
                      全部品牌
                    </button>
                  </div>
                </div>
              </div>

              <div class="category-page__brand-grid">
                <CategoryBrandCard
                  v-for="item in visibleBrands"
                  :key="item.slug"
                  :accent="item.accent"
                  :label="item.label"
                  :to="buildBrandQuery(item.slug)"
                  :wordmark="item.wordmark"
                />
              </div>

              <div class="category-page__brand-index">
                <div class="category-page__brand-index-title">
                  <strong>全部品牌</strong>
                </div>
                <div class="category-page__letter-bar">
                  <button
                    v-for="item in brandLetters"
                    :key="item"
                    type="button"
                    :class="{ 'is-active': activeLetter === item }"
                    @click="activeLetter = item"
                  >
                    {{ item }}
                  </button>
                </div>

                <div class="category-page__brand-group-grid">
                  <div
                    v-for="group in visibleBrandGroups"
                    :key="group.letter"
                    class="category-page__brand-group"
                  >
                    <span>{{ group.letter }}</span>
                    <div>
                      <RouterLink
                        v-for="item in group.items"
                        :key="item.slug"
                        :to="buildBrandQuery(item.slug)"
                      >
                        {{ item.label }}
                      </RouterLink>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section class="category-panel">
              <div class="category-panel__header">
                <div class="category-panel__title-stack">
                  <h2>分类索引（热门）</h2>
                </div>
                <RouterLink class="category-panel__link" :to="{ name: 'products' }">
                  <span>查看全部索引</span>
                  <AppIcon :icon="ChevronRight" :size="16" />
                </RouterLink>
              </div>

              <div class="category-page__keyword-grid">
                <div
                  v-for="(column, columnIndex) in categoryKeywordColumns"
                  :key="columnIndex"
                  class="category-page__keyword-column"
                >
                  <RouterLink
                    v-for="item in column"
                    :key="item.label"
                    :to="{ name: 'products', query: { keyword: item.label } }"
                    class="category-page__keyword-item"
                  >
                    <span class="category-page__keyword-name">
                      <AppIcon :icon="columnIndex === 0 ? Hash : Flame" :size="14" />
                      <span>{{ item.label }}</span>
                    </span>
                    <span>{{ item.count }}</span>
                  </RouterLink>
                </div>
              </div>
            </section>
          </div>

          <aside class="category-page__side">
            <section class="category-panel category-panel--side">
              <div class="category-panel__header">
                <h2>最近更新</h2>
                <RouterLink class="category-panel__link" :to="{ name: 'updates' }">
                  <span>查看全部</span>
                  <AppIcon :icon="ChevronRight" :size="16" />
                </RouterLink>
              </div>

              <div class="category-page__recent-list">
                <CategoryRecentUpdateItem
                  v-for="item in recentUpdateItems"
                  :key="item.title"
                  :image="item.image"
                  :meta="item.meta"
                  :time="item.time"
                  :title="item.title"
                  :to="item.to"
                />
              </div>
            </section>

            <section class="category-panel category-panel--side">
              <div class="category-panel__header">
                <h2>常用入口</h2>
              </div>

              <div class="category-page__quick-grid">
                <CategoryQuickEntryCard
                  v-for="item in quickEntryItems"
                  :key="item.label"
                  :icon="item.icon"
                  :label="item.label"
                  :to="item.to"
                />
              </div>
            </section>

            <section class="category-panel category-panel--side">
              <div class="category-panel__header">
                <h2>平台数据</h2>
              </div>

              <div class="category-page__stats-grid">
                <div
                  v-for="item in platformStats"
                  :key="item.label"
                  class="category-page__stat-card"
                >
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                </div>
              </div>
            </section>

            <section class="category-panel category-panel--side">
              <div class="category-panel__header">
                <h2>行业热点</h2>
              </div>

              <div class="category-page__topic-grid">
                <RouterLink
                  v-for="item in industryTopics"
                  :key="item"
                  :to="{ name: 'updates' }"
                  class="category-page__topic-chip"
                >
                  {{ item }}
                </RouterLink>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </section>
  </FrontShell>
</template>

<style scoped>
.category-page {
  padding: 12px 0 22px;
}

.category-page__container {
  position: relative;
}

.category-page__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 430px;
  gap: 14px;
  align-items: start;
}

.category-page__main,
.category-page__side {
  display: grid;
  gap: 14px;
}

.category-panel {
  background: linear-gradient(180deg, #fff 0%, #fbfcff 100%);
  border: 1px solid #e3ebf6;
  border-radius: 12px;
  box-shadow: 0 10px 28px rgb(18 33 61 / 0.04);
}

.category-panel--side {
  padding: 14px 16px;
}

.category-panel__header {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 18px 18px 0;
}

.category-panel__header h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #12213d;
}

.category-panel__title-stack {
  display: grid;
  gap: 12px;
}

.category-panel__link {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #1664d9;
  white-space: nowrap;
}

.category-page__nav-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  padding: 14px 14px 18px;
}

.category-page__tabs {
  display: inline-flex;
  gap: 24px;
  align-items: center;
  border-bottom: 1px solid #edf2f8;
}

.category-page__tabs button {
  position: relative;
  padding: 0 2px 10px;
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  color: #60708d;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.category-page__tabs button::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 3px;
  content: '';
  background: #1664d9;
  border-radius: 999px;
  opacity: 0;
  transform: scaleX(0.5);
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.category-page__tabs button.is-active {
  color: #1664d9;
}

.category-page__tabs button.is-active::after {
  opacity: 1;
  transform: scaleX(1);
}

.category-page__brand-grid {
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  gap: 10px;
  padding: 14px 14px 10px;
}

.category-page__brand-index {
  display: grid;
  gap: 12px;
  padding: 10px 14px 14px;
}

.category-page__brand-index-title strong {
  font-size: 15px;
  color: #12213d;
}

.category-page__letter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: center;
}

.category-page__letter-bar button {
  position: relative;
  padding: 0 2px 8px;
  font: inherit;
  font-size: 13px;
  color: #40516d;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.category-page__letter-bar button.is-active {
  color: #1664d9;
  font-weight: 700;
}

.category-page__letter-bar button.is-active::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 3px;
  content: '';
  background: #1664d9;
  border-radius: 999px;
}

.category-page__brand-group-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  border: 1px solid #edf2f8;
  border-radius: 12px;
}

.category-page__brand-group {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  gap: 14px;
  min-height: 106px;
  padding: 14px 14px;
}

.category-page__brand-group + .category-page__brand-group {
  border-left: 1px solid #edf2f8;
}

.category-page__brand-group > span {
  font-size: 24px;
  font-weight: 800;
  line-height: 1;
  color: #1849a4;
}

.category-page__brand-group div {
  display: grid;
  gap: 10px;
  align-content: flex-start;
}

.category-page__brand-group a {
  font-size: 13px;
  color: #3f526e;
}

.category-page__keyword-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  padding: 12px 14px 14px;
}

.category-page__keyword-column {
  display: grid;
  gap: 12px;
}

.category-page__keyword-item {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #465975;
}

.category-page__keyword-name {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.category-page__keyword-name .app-icon {
  color: #506b95;
}

.category-page__recent-list {
  display: grid;
}

.category-page__quick-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.category-page__stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.category-page__stat-card {
  display: grid;
  gap: 6px;
  justify-items: center;
  min-height: 72px;
  padding: 12px 8px 10px;
  text-align: center;
  background: #f8fbff;
  border: 1px solid #e5edf8;
  border-radius: 10px;
}

.category-page__stat-card span {
  font-size: 13px;
  color: #52627d;
}

.category-page__stat-card strong {
  font-size: 16px;
  color: #12213d;
}

.category-page__topic-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.category-page__topic-chip {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  font-size: 13px;
  color: #4f607c;
  background: #f7faff;
  border: 1px solid #e4ebf6;
  border-radius: 10px;
}

@media (max-width: 1380px) {
  .category-page__grid {
    grid-template-columns: minmax(0, 1fr) 360px;
  }

  .category-page__nav-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .category-page__brand-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .category-page__brand-group-grid,
  .category-page__stats-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1024px) {
  .category-page {
    padding-top: 14px;
  }

  .category-page__grid {
    grid-template-columns: 1fr;
  }

  .category-page__nav-grid,
  .category-page__keyword-grid,
  .category-page__stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .category-page__brand-group-grid,
  .category-page__quick-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .category-page__brand-group + .category-page__brand-group {
    border-left: 0;
  }
}

@media (max-width: 720px) {
  .category-panel__header {
    flex-direction: column;
    align-items: flex-start;
    padding: 18px 16px 0;
  }

  .category-page__nav-grid,
  .category-page__brand-grid,
  .category-page__keyword-grid,
  .category-page__brand-group-grid,
  .category-page__quick-grid,
  .category-page__stats-grid {
    grid-template-columns: 1fr;
  }

  .category-page__brand-group {
    min-height: 0;
    border-top: 1px solid #edf2f8;
  }

  .category-page__brand-group:first-child {
    border-top: 0;
  }

  .category-page__letter-bar {
    gap: 6px 12px;
  }
}
</style>
