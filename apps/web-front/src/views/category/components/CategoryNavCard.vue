<script setup lang="ts">
import type { Component } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

import { RouterLink } from 'vue-router';

import AppIcon from '@/components/AppIcon.vue';

defineProps<{
  active?: boolean;
  count: string;
  icon: Component;
  label: string;
  to: RouteLocationRaw;
}>();
</script>

<template>
  <RouterLink class="category-nav-card" :class="{ 'is-active': active }" :to="to">
    <span class="category-nav-card__icon">
      <AppIcon :icon="icon" :size="30" />
    </span>
    <div class="category-nav-card__body">
      <strong>{{ label }}</strong>
      <span>{{ count }}</span>
    </div>
  </RouterLink>
</template>

<style scoped>
.category-nav-card {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  min-height: 76px;
  padding: 16px 14px;
  background: linear-gradient(180deg, #fff 0%, #fbfdff 100%);
  border: 1px solid #e3ebf6;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgb(18 33 61 / 0.03);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.category-nav-card:hover,
.category-nav-card.is-active {
  border-color: #c7d9f5;
  box-shadow: 0 14px 30px rgb(18 64 128 / 0.08);
  transform: translateY(-2px);
}

.category-nav-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  color: #1664d9;
}

.category-nav-card__body {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.category-nav-card__body strong {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.2;
  color: #1f2f4b;
}

.category-nav-card__body span {
  font-size: 13px;
  color: #5f7392;
}
</style>
