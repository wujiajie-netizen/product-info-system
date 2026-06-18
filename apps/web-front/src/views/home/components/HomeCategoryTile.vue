<script setup lang="ts">
import type { Component } from 'vue';

import AppIcon from '@/components/AppIcon.vue';

defineProps<{
  count: string;
  icon: Component;
  label: string;
  to: string;
}>();
</script>

<template>
  <RouterLink :to="to" class="home-category-tile">
    <span class="home-category-tile__icon">
      <AppIcon :icon="icon" :size="28" />
    </span>
    <strong>{{ label }}</strong>
    <span class="home-category-tile__count">{{ count }}</span>
  </RouterLink>
</template>

<style scoped>
.home-category-tile {
  display: grid;
  gap: 6px;
  justify-items: center;
  min-height: 114px;
  padding: 16px 8px 12px;
  text-align: center;
  background: linear-gradient(180deg, #fff 0%, #fbfcff 100%);
  border: 1px solid #e7edf6;
  border-radius: 14px;
  box-shadow: 0 8px 20px rgb(18 33 61 / 0.03);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.home-category-tile:hover {
  border-color: #cfe0f8;
  box-shadow: 0 16px 32px rgb(22 100 217 / 0.08);
  transform: translateY(-2px);
}

.home-category-tile__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  color: #1664d9;
}

.home-category-tile strong {
  font-size: 14px;
  line-height: 1.35;
  color: #12213d;
}

.home-category-tile__count {
  font-size: 12px;
  color: #60708d;
}

@media (max-width: 768px) {
  .home-category-tile {
    min-height: 118px;
    padding: 18px 10px 16px;
  }

  .home-category-tile__icon {
    width: 46px;
    height: 46px;
    border-radius: 12px;
  }
}
</style>
