<script setup lang="ts">
import { PlusCircle } from 'lucide-vue-next';

import type { QaQuestionCategory } from '#/api/qa-center';
import AppIcon from '#/components/AppIcon.vue';

import type { FrontQaSortBy, QaCategoryFilter, QaCategoryTab, QaSortOption } from '../types';

defineProps<{
  selectedCategory: QaCategoryFilter;
  sortBy: FrontQaSortBy;
  sortOptions: QaSortOption[];
  tabs: QaCategoryTab[];
}>();

const emit = defineEmits<{
  'open-ask': [];
  'select-category': [category: QaCategoryFilter];
  'select-sort': [sortBy: FrontQaSortBy];
}>();

function handleSortChange(event: Event) {
  emit('select-sort', (event.target as HTMLSelectElement).value as FrontQaSortBy);
}
</script>

<template>
  <section class="qa-center-tabs-row">
    <div class="qa-center-tabs" aria-label="问题分类">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        :class="{ 'is-active': selectedCategory === tab.key }"
        @click="emit('select-category', tab.key)"
      >
        <span>{{ tab.label }}</span>
        <strong>{{ tab.count }}</strong>
      </button>
    </div>
    <div class="qa-center-tabs-row__actions">
      <select
        :value="sortBy"
        class="qa-center-sort-select"
        aria-label="排序方式"
        @change="handleSortChange"
      >
        <option v-for="option in sortOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <button class="qa-center-submit-button" type="button" @click="emit('open-ask')">
        <AppIcon :icon="PlusCircle" :size="17" />
        提交商品问题
      </button>
    </div>
  </section>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.qa-center-tabs-row,
.qa-center-tabs,
.qa-center-tabs-row__actions,
.qa-center-submit-button {
  display: flex;
  align-items: center;
}

.qa-center-tabs-row {
  gap: 18px;
  justify-content: space-between;
  min-width: 0;
  padding: 6px 0 0;
  border-top: 1px solid #e5edf7;
}

.qa-center-tabs {
  flex: 1 1 auto;
  flex-wrap: wrap;
  gap: 10px;
  min-width: 0;
}

.qa-center-tabs-row__actions {
  flex: 0 0 auto;
  gap: 10px;
}

.qa-center-tabs button {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  min-width: 92px;
  height: 40px;
  padding: 0 14px;
  font: inherit;
  color: #4a5b78;
  cursor: pointer;
  background: rgb(255 255 255 / 70%);
  border: 1px solid transparent;
  border-radius: 999px;
}

.qa-center-tabs button:hover,
.qa-center-tabs button.is-active {
  color: #1664d9;
  background: #fff;
  border-color: #9cc6ff;
}

.qa-center-tabs button strong {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 22px;
  padding: 0 7px;
  font-size: 12px;
  color: #647590;
  background: #f2f6fb;
  border-radius: 999px;
}

.qa-center-tabs button.is-active strong {
  color: #fff;
  background: #1677ff;
}

.qa-center-sort-select {
  flex: 0 0 auto;
  width: 128px;
  height: 42px;
  padding: 0 10px;
  font: inherit;
  font-weight: 700;
  color: #4a5b78;
  background: #fff;
  border: 1px solid #d9e3f0;
  border-radius: 10px;
}

.qa-center-submit-button {
  flex: 0 0 auto;
  gap: 8px;
  height: 42px;
  padding: 0 18px;
  font: inherit;
  font-weight: 800;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(135deg, #1677ff, #0f63d4);
  border: 0;
  border-radius: 12px;
  box-shadow: 0 12px 24px rgb(22 119 255 / 18%);
}

@media (max-width: 780px) {
  .qa-center-tabs-row,
  .qa-center-tabs-row__actions {
    align-items: stretch;
    flex-direction: column;
  }

  .qa-center-sort-select {
    width: 100%;
  }
}
</style>
