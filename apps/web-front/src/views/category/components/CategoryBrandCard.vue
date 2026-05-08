<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';

import { RouterLink } from 'vue-router';

defineProps<{
  accent: string;
  label: string;
  to: RouteLocationRaw;
  wordmark: string;
}>();
</script>

<template>
  <RouterLink class="category-brand-card" :to="to">
    <span class="category-brand-card__wordmark" :style="{ color: accent }">
      {{ wordmark }}
    </span>
    <span class="category-brand-card__label">{{ label }}</span>
  </RouterLink>
</template>

<style scoped>
.category-brand-card {
  display: grid;
  gap: 10px;
  align-items: center;
  justify-items: center;
  min-height: 66px;
  padding: 10px 10px 8px;
  text-align: center;
  background: linear-gradient(180deg, #fff 0%, #fbfdff 100%);
  border: 1px solid #e3ebf6;
  border-radius: 10px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.category-brand-card:hover {
  border-color: #c8daf5;
  box-shadow: 0 12px 24px rgb(18 64 128 / 0.08);
  transform: translateY(-2px);
}

.category-brand-card__wordmark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  font-size: 14px;
  font-style: italic;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.category-brand-card__label {
  font-size: 13px;
  color: #40516d;
}
</style>
