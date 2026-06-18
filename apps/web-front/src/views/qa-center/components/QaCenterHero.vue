<script setup lang="ts">
import { Search, X } from 'lucide-vue-next';

import AppIcon from '@/components/AppIcon.vue';

defineProps<{
  keyword: string;
}>();

const emit = defineEmits<{
  search: [];
  'update:keyword': [value: string];
}>();

function updateKeyword(event: Event) {
  emit('update:keyword', (event.target as HTMLInputElement).value);
}

function clearKeyword() {
  emit('update:keyword', '');
  emit('search');
}
</script>

<template>
  <section class="qa-center-hero">
    <span class="qa-center-hero__eyebrow">商品知识问答</span>
    <h1>问答中心</h1>
    <p>
      围绕商品、技术、规格、配件和交付等问题，帮助销售、采购和技术同事快速查询与资料。
    </p>
    <div class="qa-center-search">
      <div class="qa-center-search__bar">
        <AppIcon :icon="Search" :size="18" />
        <input
          :value="keyword"
          type="text"
          placeholder="搜索商品型号 / 技术问题 / 规格参数 / 应用场景"
          @input="updateKeyword"
          @keyup.enter="emit('search')"
        />
        <button
          v-if="keyword"
          type="button"
          aria-label="清空搜索"
          @click="clearKeyword"
        >
          <AppIcon :icon="X" :size="16" />
        </button>
      </div>
      <button class="qa-center-search__button" type="button" @click="emit('search')">
        搜索问答
      </button>
    </div>
  </section>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.qa-center-hero {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.qa-center-hero__eyebrow {
  display: inline-flex;
  width: fit-content;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 800;
  color: #1664d9;
  background: #edf5ff;
  border: 1px solid #cfdef4;
  border-radius: 999px;
}

.qa-center-hero h1 {
  margin: 0;
  font-size: 34px;
  line-height: 1.1;
}

.qa-center-hero p {
  margin: 0;
  line-height: 1.7;
  color: #52627d;
}

.qa-center-search,
.qa-center-search__bar {
  display: flex;
  align-items: center;
}

.qa-center-search {
  gap: 14px;
  min-width: 0;
  margin-top: 12px;
}

.qa-center-search__bar {
  flex: 1 1 auto;
  gap: 10px;
  min-width: 0;
  height: 48px;
  padding: 0 16px;
  background: #fff;
  border: 1px solid #d9e3f0;
  border-radius: 12px;
  box-shadow: 0 8px 22px rgb(18 33 61 / 3.5%);
}

.qa-center-search__bar input {
  flex: 1 1 auto;
  min-width: 0;
  font: inherit;
  border: 0;
  outline: none;
}

.qa-center-search__bar button {
  font: inherit;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.qa-center-search__button {
  height: 48px;
  padding: 0 22px;
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
  .qa-center-search {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
