<script setup lang="ts">
import { computed, ref } from 'vue';
import { ChevronDown, Search } from 'lucide-vue-next';
import { NTimeline } from 'naive-ui';
import { RouterLink } from 'vue-router';

import AppIcon from '#/components/AppIcon.vue';
import FrontShell from '#/components/FrontShell.vue';
import UpdatesSidePanel from '#/views/update/components/UpdatesSidePanel.vue';
import UpdatesTimelineItem from '#/views/update/components/UpdatesTimelineItem.vue';
import type { UpdateCategory } from '#/views/update/update-data';
import {
  hotProducts,
  latestDigest,
  pinnedNotice,
  timelineItems,
  updateFilterTabs,
} from '#/views/update/update-data';

const activeTab = ref(updateFilterTabs[0]?.value ?? 'new-product');
const currentFilter = ref<UpdateCategory | 'all'>('all');
const keyword = ref('');

const filteredTimelineSections = computed(() => {
  const query = keyword.value.trim().toLowerCase();
  const filtered = timelineItems.filter((item) => {
    const matchesTab = currentFilter.value === 'all' || item.category === currentFilter.value;
    const haystack = [
      item.title,
      item.description,
      item.summary,
      item.relatedLabel,
      item.relatedValue,
    ]
      .join(' ')
      .toLowerCase();

    return matchesTab && (!query || haystack.includes(query));
  });

  return filtered.reduce<Array<{ items: typeof filtered; title: string }>>((sections, item) => {
    const current = sections[sections.length - 1];

    if (!current || current.title !== item.section) {
      sections.push({
        items: [item],
        title: item.section,
      });
      return sections;
    }

    current.items.push(item);
    return sections;
  }, []);
});

function handleTabClick(value: UpdateCategory) {
  activeTab.value = value;
  currentFilter.value = value;
}
</script>

<template>
  <FrontShell>
    <section class="updates-page">
      <section class="updates-hero">
        <div class="shell-container updates-hero__container">
          <div class="updates-hero__content">
            <h1>动态资讯</h1>
            <p>追踪新品、报价调整、资料更新与平台通知</p>

            <form class="updates-search" @submit.prevent>
              <AppIcon :icon="Search" :size="20" />
              <input
                v-model="keyword"
                type="search"
                placeholder="搜索动态标题、产品、公司、关键词"
              />
              <button type="submit">搜索</button>
            </form>

            <div class="updates-tabs" role="tablist" aria-label="动态分类">
              <button
                v-for="tab in updateFilterTabs"
                :key="tab.value"
                type="button"
                class="updates-tabs__button"
                :class="{ 'is-active': activeTab === tab.value }"
                @click="handleTabClick(tab.value)"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>

          <div class="updates-hero__decor" aria-hidden="true">
            <span class="updates-hero__cube updates-hero__cube--one"></span>
            <span class="updates-hero__cube updates-hero__cube--two"></span>
            <span class="updates-hero__cube updates-hero__cube--three"></span>
            <span class="updates-hero__cube updates-hero__cube--four"></span>
            <span class="updates-hero__ribbon updates-hero__ribbon--one"></span>
            <span class="updates-hero__ribbon updates-hero__ribbon--two"></span>
          </div>
        </div>
      </section>

      <section class="shell-container updates-board">
        <div class="updates-main">
          <section class="updates-card updates-pinned">
            <header class="updates-card__header updates-card__header--pin">
              <h2>{{ pinnedNotice.badge }}通知</h2>
            </header>

            <RouterLink :to="pinnedNotice.to" class="updates-pinned__body">
              <div class="updates-pinned__time">
                <strong>{{ pinnedNotice.date }}</strong>
                <span>{{ pinnedNotice.time }}</span>
                <i>{{ pinnedNotice.badge }}</i>
              </div>

              <div class="updates-pinned__content">
                <div class="updates-pinned__title-row">
                  <h3>{{ pinnedNotice.title }}</h3>
                  <span class="updates-pinned__badge">{{ pinnedNotice.categoryLabel }}</span>
                </div>
                <p>{{ pinnedNotice.summary }}</p>
              </div>

              <span class="updates-pinned__button">查看详情</span>
            </RouterLink>
          </section>

          <section class="updates-card updates-feed">
            <template v-if="filteredTimelineSections.length">
              <section
                v-for="section in filteredTimelineSections"
                :key="section.title"
                class="updates-feed__section"
              >
                <h2>{{ section.title }}</h2>
                <n-timeline class="updates-feed__timeline" item-placement="left" size="large">
                  <UpdatesTimelineItem
                    v-for="item in section.items"
                    :key="item.id"
                    :item="item"
                  />
                </n-timeline>
              </section>
            </template>

            <div v-else class="updates-feed__empty">
              <strong>没有找到匹配的动态</strong>
              <p>换一个关键词试试，或者切换到其他分类查看。</p>
            </div>

            <button v-if="filteredTimelineSections.length" class="updates-feed__more" type="button">
              <span>查看更多动态</span>
              <AppIcon :icon="ChevronDown" :size="16" />
            </button>
          </section>
        </div>

        <aside class="updates-side">
          <UpdatesSidePanel title="热门产品" to="/products">
            <div class="updates-side-products">
              <RouterLink
                v-for="item in hotProducts"
                :key="item.name"
                :to="item.to"
                class="updates-side-products__item"
              >
                <div class="updates-side-products__thumb">
                  <img :src="item.image" :alt="item.name" loading="lazy" />
                </div>
                <div class="updates-side-products__content">
                  <strong>{{ item.name }}</strong>
                  <span>{{ item.updateCount }}</span>
                </div>
              </RouterLink>
            </div>
          </UpdatesSidePanel>

          <UpdatesSidePanel title="最新动态" to="/updates">
            <div class="updates-side-digest">
              <RouterLink
                v-for="item in latestDigest"
                :key="`${item.tagLabel}-${item.title}`"
                :to="item.to"
                class="updates-side-digest__item"
              >
                <div class="updates-side-digest__main">
                  <span class="updates-side-digest__tag" :class="`is-${item.tone}`">
                    {{ item.tagLabel }}
                  </span>
                  <strong>{{ item.title }}</strong>
                </div>
                <span class="updates-side-digest__date">{{ item.date }}</span>
              </RouterLink>
            </div>
          </UpdatesSidePanel>
        </aside>
      </section>
    </section>
  </FrontShell>
</template>

<style scoped>
.updates-page {
  position: relative;
  min-height: calc(100vh - 76px);
  padding-bottom: 18px;
  overflow: hidden;
}

.updates-page::before {
  position: absolute;
  inset: 0;
  content: '';
  background:
    radial-gradient(circle at 18% 6%, rgb(22 100 217 / 0.08), transparent 26%),
    linear-gradient(180deg, #fbfdff 0%, #f4f7fb 42%, #f6f9fd 100%);
}

.updates-page > * {
  position: relative;
  z-index: 1;
}

.updates-hero {
  position: relative;
  padding: 12px 0 2px;
}

.updates-hero__container {
  position: relative;
  min-height: 174px;
}

.updates-hero__content {
  position: relative;
  z-index: 1;
  max-width: 820px;
}

.updates-hero__content h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
  color: #12213d;
}

.updates-hero__content p {
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.6;
  color: #60708d;
}

.updates-search {
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) 108px;
  gap: 10px;
  align-items: center;
  max-width: 764px;
  height: 46px;
  padding: 0 0 0 14px;
  margin-top: 12px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #dbe5f3;
  border-radius: 12px;
  box-shadow: 0 14px 34px rgb(18 33 61 / 0.05);
}

.updates-search :deep(.app-icon) {
  color: #6d7fa0;
}

.updates-search input {
  width: 100%;
  height: 44px;
  padding: 0;
  font: inherit;
  font-size: 14px;
  color: #24344f;
  background: transparent;
  border: 0;
  outline: none;
}

.updates-search input::placeholder {
  color: #91a1ba;
}

.updates-search button {
  width: 100%;
  height: 46px;
  font: inherit;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(180deg, #1677ff 0%, #1664d9 100%);
  border: 0;
}

.updates-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 12px;
}

.updates-tabs__button {
  min-width: 106px;
  height: 40px;
  padding: 0 24px;
  font: inherit;
  font-size: 16px;
  font-weight: 700;
  color: #223451;
  cursor: pointer;
  background: linear-gradient(180deg, #fff 0%, #f8fbff 100%);
  border: 1px solid #e3ebf6;
  border-radius: 10px;
  box-shadow: 0 8px 20px rgb(18 33 61 / 0.02);
}

.updates-tabs__button.is-active {
  color: #1664d9;
  background: #f8fbff;
  border-color: #b8d2f6;
}

.updates-hero__decor {
  position: absolute;
  top: -10px;
  right: 4px;
  width: min(36vw, 520px);
  height: 250px;
  pointer-events: none;
}

.updates-hero__cube,
.updates-hero__ribbon {
  position: absolute;
}

.updates-hero__cube {
  background: linear-gradient(145deg, rgb(236 243 255 / 0.94), rgb(249 251 255 / 0.82));
  border: 1px solid rgb(226 236 251 / 0.98);
  box-shadow: 0 20px 40px rgb(18 33 61 / 0.04);
  transform: rotate(45deg);
}

.updates-hero__cube--one {
  top: 12px;
  right: 114px;
  width: 80px;
  height: 80px;
}

.updates-hero__cube--two {
  top: 92px;
  right: 10px;
  width: 124px;
  height: 124px;
}

.updates-hero__cube--three {
  top: 112px;
  right: 158px;
  width: 72px;
  height: 72px;
}

.updates-hero__cube--four {
  top: 24px;
  right: 258px;
  width: 104px;
  height: 104px;
}

.updates-hero__ribbon {
  border: 1px solid rgb(225 235 252 / 0.88);
  transform: skewX(-18deg) rotate(36deg);
}

.updates-hero__ribbon--one {
  top: 54px;
  right: 160px;
  width: 260px;
  height: 108px;
  background: linear-gradient(180deg, rgb(227 237 253 / 0.4), rgb(245 249 255 / 0.12));
}

.updates-hero__ribbon--two {
  top: 10px;
  right: 0;
  width: 210px;
  height: 94px;
  background: linear-gradient(180deg, rgb(233 240 253 / 0.42), rgb(245 249 255 / 0.1));
}

.updates-board {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 16px;
  align-items: start;
}

.updates-main,
.updates-side {
  min-width: 0;
}

.updates-main {
  display: grid;
  gap: 10px;
}

.updates-card {
  background: linear-gradient(180deg, #fff 0%, #fbfdff 100%);
  border: 1px solid #e7edf6;
  border-radius: 18px;
  box-shadow: 0 12px 30px rgb(18 33 61 / 0.04);
}

.updates-card__header {
  padding: 10px 20px 8px;
}

.updates-card__header h2 {
  margin: 0;
  font-size: 18px;
}

.updates-card__header--pin h2 {
  position: relative;
  display: inline-flex;
  gap: 8px;
  align-items: center;
  font-size: 18px;
}

.updates-card__header--pin h2::before {
  width: 18px;
  height: 18px;
  content: '';
  background:
    radial-gradient(circle at center, #fff 0 28%, transparent 30%),
    linear-gradient(180deg, #ff6a55 0%, #ff3f2c 100%);
  border-radius: 999px;
  box-shadow: 0 0 0 2px #fff1ef;
}

.updates-pinned {
  padding-bottom: 8px;
}

.updates-pinned__body {
  display: grid;
  grid-template-columns: 124px minmax(0, 1fr) 124px;
  gap: 0;
  align-items: center;
  margin: 0 12px;
  overflow: hidden;
  border: 1px solid #ffdcd3;
  border-radius: 14px;
  background: linear-gradient(180deg, #fff 0%, #fffdfd 100%);
}

.updates-pinned__time {
  position: relative;
  display: grid;
  gap: 8px;
  justify-items: center;
  align-content: center;
  min-height: 66px;
  padding: 12px 16px;
  color: #223451;
  border-right: 1px solid #ffe3da;
}

.updates-pinned__time strong {
  font-size: 18px;
}

.updates-pinned__time span {
  font-size: 14px;
  color: #60708d;
}

.updates-pinned__time i {
  position: absolute;
  top: 12px;
  left: -1px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 18px;
  padding: 0 7px;
  font-size: 11px;
  font-style: normal;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(180deg, #ff6d42 0%, #ff4a22 100%);
  border-radius: 0 6px 6px 0;
}

.updates-pinned__content {
  padding: 12px 16px 12px 14px;
}

.updates-pinned__title-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.updates-pinned__title-row h3 {
  margin: 0;
  font-size: 16px;
  color: #1a2a47;
}

.updates-pinned__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 58px;
  height: 22px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 700;
  color: #f05a1a;
  background: #fff3eb;
  border-radius: 8px;
}

.updates-pinned__content p {
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.65;
  color: #60708d;
}

.updates-pinned__button {
  justify-self: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 102px;
  height: 36px;
  font-size: 14px;
  font-weight: 700;
  color: #1664d9;
  background: #fff;
  border: 1px solid #d9e6f7;
  border-radius: 10px;
}

.updates-feed {
  padding: 2px 20px 6px;
}

.updates-feed__section + .updates-feed__section {
  margin-top: 2px;
}

.updates-feed__section h2 {
  margin: 0;
  padding: 2px 0 0;
  font-size: 18px;
  color: #12213d;
}

.updates-feed__timeline {
  padding-top: 6px;
}

.updates-feed__empty {
  padding: 48px 12px;
  text-align: center;
}

.updates-feed__empty strong {
  font-size: 18px;
  color: #12213d;
}

.updates-feed__empty p {
  margin: 10px 0 0;
  color: #60708d;
}

.updates-feed__more {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  width: 194px;
  height: 30px;
  margin: 10px auto 0;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  color: #1664d9;
  cursor: pointer;
  background: linear-gradient(180deg, #fff 0%, #f7fbff 100%);
  border: 1px solid #d9e6f7;
  border-radius: 8px;
}

.updates-side {
  display: grid;
  gap: 10px;
}

.updates-side-products {
  display: grid;
}

.updates-side-products__item {
  display: grid;
  grid-template-columns: 60px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  padding: 8px 6px;
}

.updates-side-products__item + .updates-side-products__item {
  border-top: 1px solid #edf2f8;
}

.updates-side-products__thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
}

.updates-side-products__thumb img {
  display: block;
  width: 56px;
  height: 56px;
  object-fit: contain;
}

.updates-side-products__content strong {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #1d2c48;
}

.updates-side-products__content span {
  display: block;
  margin-top: 8px;
  font-size: 14px;
  color: #60708d;
}

.updates-side-digest {
  display: grid;
}

.updates-side-digest__item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 10px 4px;
}

.updates-side-digest__item + .updates-side-digest__item {
  border-top: 1px solid #edf2f8;
}

.updates-side-digest__main {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  min-width: 0;
}

.updates-side-digest__tag {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 24px;
  padding: 0 9px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 8px;
}

.updates-side-digest__tag.is-blue {
  color: #1664d9;
  background: #eef4ff;
}

.updates-side-digest__tag.is-green {
  color: #18a36d;
  background: #ebf9f1;
}

.updates-side-digest__tag.is-orange {
  color: #f05a1a;
  background: #fff3eb;
}

.updates-side-digest__tag.is-teal {
  color: #0f9488;
  background: #ebf8f7;
}

.updates-side-digest__main strong {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.65;
  color: #3f4e68;
}

.updates-side-digest__date {
  flex: 0 0 auto;
  padding-top: 1px;
  font-size: 14px;
  color: #8d9cb4;
}

@media (max-width: 1200px) {
  .updates-board {
    grid-template-columns: 1fr;
  }

  .updates-side {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .updates-hero {
    padding-top: 20px;
  }

  .updates-hero__container {
    min-height: auto;
  }

  .updates-hero__decor {
    display: none;
  }

  .updates-search {
    grid-template-columns: 24px minmax(0, 1fr) 96px;
  }

  .updates-pinned__body {
    grid-template-columns: 1fr;
  }

  .updates-pinned__time {
    border-right: 0;
    border-bottom: 1px solid #ffe3da;
  }
}

@media (max-width: 768px) {
  .updates-page {
    min-height: auto;
  }

  .updates-hero__content h1 {
    font-size: 26px;
  }

  .updates-tabs {
    gap: 10px;
  }

  .updates-tabs__button {
    min-width: calc(50% - 5px);
    font-size: 15px;
  }

  .updates-search {
    grid-template-columns: 24px minmax(0, 1fr);
    height: auto;
    padding: 12px 12px 12px 14px;
  }

  .updates-search button {
    grid-column: 1 / -1;
    height: 44px;
    border-radius: 10px;
  }

  .updates-side {
    grid-template-columns: 1fr;
  }

  .updates-feed {
    padding-right: 16px;
    padding-left: 16px;
  }
}
</style>
