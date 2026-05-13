<script setup lang="ts">
import type { Component } from 'vue';

import AppIcon from '#/components/AppIcon.vue';

defineProps<{
  accent: 'blue' | 'orange' | 'teal';
  count: string;
  description: string;
  icon: Component;
  title: string;
  to: string;
  unit: string;
}>();
</script>

<template>
  <RouterLink
    :to="to"
    class="home-side-card"
    :class="`home-side-card--${accent}`"
  >
    <div class="home-side-card__body">
      <strong>{{ title }}</strong>
      <p>{{ description }}</p>
      <div class="home-side-card__meta">
        <span>{{ count }}</span>
        <em>{{ unit }}</em>
      </div>
    </div>
    <span class="home-side-card__icon">
      <AppIcon :icon="icon" :size="28" />
    </span>
    <span class="home-side-card__arrow" aria-hidden="true">›</span>
  </RouterLink>
</template>

<style scoped>
.home-side-card {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 68px 16px;
  align-items: center;
  min-height: 110px;
  padding: 16px 18px 16px 20px;
  overflow: hidden;
  background: linear-gradient(180deg, #fff 0%, #fbfcff 100%);
  border: 1px solid #e7edf6;
  border-radius: 16px;
  box-shadow: 0 12px 28px rgb(18 33 61 / 0.05);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.home-side-card:hover {
  border-color: #d5e3f8;
  box-shadow: 0 20px 38px rgb(18 33 61 / 0.08);
  transform: translateY(-2px);
}

.home-side-card__body strong {
  display: block;
  margin-bottom: 4px;
  font-size: 17px;
  line-height: 1.2;
  color: #12213d;
}

.home-side-card__body p {
  margin: 0 0 10px;
  font-size: 12px;
  line-height: 1.45;
  color: #60708d;
}

.home-side-card__meta {
  display: flex;
  gap: 4px;
  align-items: baseline;
}

.home-side-card__meta span {
  font-size: 16px;
  font-weight: 800;
}

.home-side-card__meta em {
  font-style: normal;
  color: #60708d;
}

.home-side-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
}

.home-side-card__arrow {
  font-size: 20px;
  line-height: 1;
  color: #9aa7bc;
}

.home-side-card--blue .home-side-card__icon {
  color: #1664d9;
  background: linear-gradient(180deg, #eef5ff 0%, #e4efff 100%);
}

.home-side-card--blue .home-side-card__meta span {
  color: #1664d9;
}

.home-side-card--orange .home-side-card__icon {
  color: #f05a1a;
  background: linear-gradient(180deg, #fff3eb 0%, #ffecdd 100%);
}

.home-side-card--orange .home-side-card__meta span {
  color: #f05a1a;
}

.home-side-card--teal .home-side-card__icon {
  color: #169e95;
  background: linear-gradient(180deg, #ecfbf8 0%, #dff7f2 100%);
}

.home-side-card--teal .home-side-card__meta span {
  color: #169e95;
}

@media (max-width: 768px) {
  .home-side-card {
    grid-template-columns: minmax(0, 1fr) 56px 18px;
    min-height: 112px;
    padding: 18px;
    border-radius: 16px;
  }

  .home-side-card__body strong {
    font-size: 18px;
  }

  .home-side-card__body p {
    margin-bottom: 12px;
    font-size: 13px;
  }

  .home-side-card__icon {
    width: 52px;
    height: 52px;
    border-radius: 16px;
  }
}
</style>
