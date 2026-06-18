<script setup lang="ts">
import { Flame } from 'lucide-vue-next';

import type { QaQuestionItem } from '@/api/qa-center';
import AppIcon from '@/components/AppIcon.vue';

defineProps<{
  questions: QaQuestionItem[];
}>();

const emit = defineEmits<{
  'select-keyword': [productModel: string];
  'show-all': [];
}>();
</script>

<template>
  <aside class="qa-center-hot-panel">
    <div class="qa-center-hot-panel__title">
      <AppIcon :icon="Flame" :size="18" />
      <h2>推荐问题</h2>
    </div>
    <div class="qa-center-hot-list">
      <button
        v-for="(item, index) in questions"
        :key="item.id"
        type="button"
        @click="emit('select-keyword', item.productModel)"
      >
        <strong>{{ index + 1 }}</strong>
        <span>{{ item.title }}</span>
      </button>
    </div>
    <button class="qa-center-hot-more" type="button" @click="emit('show-all')">
      查看更多
    </button>
  </aside>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.qa-center-hot-panel {
  position: sticky;
  top: 84px;
  min-width: 0;
  padding: 22px;
  background: #fff;
  border: 1px solid #dfe8f5;
  border-radius: 16px;
  box-shadow: 0 14px 36px rgb(18 33 61 / 6%);
}

.qa-center-hot-panel__title,
.qa-center-hot-list button {
  display: flex;
  align-items: center;
}

.qa-center-hot-panel__title {
  gap: 8px;
  margin-bottom: 16px;
}

.qa-center-hot-panel__title :deep(.app-icon) {
  color: #ef4c3c;
}

.qa-center-hot-panel h2 {
  margin: 0;
  font-size: 18px;
}

.qa-center-hot-list {
  display: grid;
  gap: 14px;
}

.qa-center-hot-list button {
  gap: 10px;
  width: 100%;
  padding: 0;
  font: inherit;
  cursor: pointer;
  background: transparent;
  border: 0;
  text-align: left;
}

.qa-center-hot-list strong {
  display: inline-flex;
  flex: 0 0 24px;
  align-items: center;
  justify-content: center;
  height: 24px;
  color: #fff;
  background: #1677ff;
  border-radius: 999px;
}

.qa-center-hot-list span {
  min-width: 0;
  overflow: hidden;
  color: #44556f;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qa-center-hot-more {
  margin-top: 18px;
  font: inherit;
  font-weight: 800;
  color: #1664d9;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.qa-center-hot-more::after {
  margin-left: 7px;
  content: '›';
}

@media (max-width: 1180px) {
  .qa-center-hot-panel {
    position: static;
  }
}
</style>
