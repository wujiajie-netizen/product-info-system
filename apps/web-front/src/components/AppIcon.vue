<script setup lang="ts">
import type { Component } from 'vue';

import { NIcon } from 'naive-ui';

withDefaults(
  defineProps<{
    icon: Component;
    size?: number;
  }>(),
  {
    size: 18,
  },
);
</script>

<template>
  <n-icon :size="size" class="app-icon">
    <component :is="icon" />
  </n-icon>
</template>
