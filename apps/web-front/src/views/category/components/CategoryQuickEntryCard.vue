<script setup lang="ts">
import type { Component } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

import { RouterLink } from 'vue-router';

import AppIcon from '@/components/AppIcon.vue';

defineProps<{
  icon: Component;
  label: string;
  to: RouteLocationRaw;
}>();
</script>

<template>
  <RouterLink class="category-quick-entry-card" :to="to">
    <span class="category-quick-entry-card__icon">
      <AppIcon :icon="icon" :size="26" />
    </span>
    <span>{{ label }}</span>
  </RouterLink>
</template>

<style scoped>
.category-quick-entry-card {
  display: grid;
  gap: 10px;
  align-content: center;
  justify-items: center;
  min-height: 76px;
  padding: 12px 8px;
  text-align: center;
  background: linear-gradient(180deg, #fff 0%, #fbfdff 100%);
  border: 1px solid #e3ebf6;
  border-radius: 10px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.category-quick-entry-card:hover {
  border-color: #c8daf5;
  box-shadow: 0 12px 24px rgb(18 64 128 / 0.08);
  transform: translateY(-2px);
}

.category-quick-entry-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #1664d9;
}

.category-quick-entry-card span:last-child {
  font-size: 12px;
  color: #40516d;
}
</style>
