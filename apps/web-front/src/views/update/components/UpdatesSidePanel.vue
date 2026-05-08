<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next';
import { RouterLink } from 'vue-router';

import AppIcon from '#/components/AppIcon.vue';

withDefaults(
  defineProps<{
    linkLabel?: string;
    title: string;
    to?: string;
  }>(),
  {
    linkLabel: '查看全部',
    to: '/updates',
  },
);
</script>

<template>
  <section class="updates-side-panel">
    <header class="updates-side-panel__header">
      <h2>{{ title }}</h2>
      <RouterLink v-if="to" :to="to" class="updates-side-panel__link">
        <span>{{ linkLabel }}</span>
        <AppIcon :icon="ChevronRight" :size="14" />
      </RouterLink>
    </header>
    <div class="updates-side-panel__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.updates-side-panel {
  background: linear-gradient(180deg, #fff 0%, #fbfdff 100%);
  border: 1px solid #e7edf6;
  border-radius: 18px;
  box-shadow: 0 12px 30px rgb(18 33 61 / 0.04);
}

.updates-side-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px 12px;
}

.updates-side-panel__header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #12213d;
}

.updates-side-panel__link {
  display: inline-flex;
  gap: 2px;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #1664d9;
}

.updates-side-panel__body {
  padding: 0 18px 18px;
}
</style>
