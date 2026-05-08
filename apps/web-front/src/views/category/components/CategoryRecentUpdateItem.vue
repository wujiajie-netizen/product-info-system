<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';

import { RouterLink } from 'vue-router';

defineProps<{
  image: string;
  meta: string;
  time: string;
  title: string;
  to: RouteLocationRaw;
}>();
</script>

<template>
  <RouterLink class="category-recent-update" :to="to">
    <img :src="image" :alt="title" class="category-recent-update__thumb" />
    <div class="category-recent-update__body">
      <strong>{{ title }}</strong>
      <span>{{ meta }}</span>
    </div>
    <div class="category-recent-update__time">
      <span>{{ time }}</span>
      <i></i>
    </div>
  </RouterLink>
</template>

<style scoped>
.category-recent-update {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 10px 0;
}

.category-recent-update + .category-recent-update {
  border-top: 1px solid #edf2f8;
}

.category-recent-update__thumb {
  width: 64px;
  height: 38px;
  object-fit: cover;
  border: 1px solid #dde8f7;
  border-radius: 6px;
}

.category-recent-update__body {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.category-recent-update__body strong {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.35;
  color: #22324d;
}

.category-recent-update__body span,
.category-recent-update__time span {
  font-size: 12px;
  color: #6a7d99;
}

.category-recent-update__time {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
  min-width: 76px;
}

.category-recent-update__time i {
  width: 8px;
  height: 8px;
  background: #1664d9;
  border-radius: 999px;
}
</style>
