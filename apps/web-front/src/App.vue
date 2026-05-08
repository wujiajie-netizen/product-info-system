<script setup lang="ts">
import type { GlobalThemeOverrides } from 'naive-ui';
import { computed } from 'vue';
import { NConfigProvider, NGlobalStyle, NMessageProvider } from 'naive-ui';
import { useRoute } from 'vue-router';

import ProductSiteHeader from '#/views/product/components/ProductSiteHeader.vue';

const route = useRoute();
const showSiteHeader = computed(() => route.meta.siteHeader !== false);

const themeOverrides: GlobalThemeOverrides = {
  common: {
    baseColor: '#ffffff',
    bodyColor: '#f4f7fb',
    borderColor: '#d9e3f0',
    cardColor: '#ffffff',
    errorColor: '#d84a4a',
    errorColorHover: '#e05f5f',
    errorColorPressed: '#b93a3a',
    errorColorSuppl: '#d84a4a',
    infoColor: '#1677ff',
    infoColorHover: '#4096ff',
    infoColorPressed: '#0958d9',
    infoColorSuppl: '#1677ff',
    inputColor: '#ffffff',
    modalColor: '#ffffff',
    popoverColor: '#ffffff',
    primaryColor: '#1677ff',
    primaryColorHover: '#4096ff',
    primaryColorPressed: '#0958d9',
    primaryColorSuppl: '#1677ff',
    placeholderColor: '#8b9ab4',
    successColor: '#0f9488',
    successColorHover: '#16a394',
    successColorPressed: '#0b7d74',
    successColorSuppl: '#0f9488',
    textColor1: '#12213d',
    textColor2: '#52627d',
    textColor3: '#60708d',
    warningColor: '#f58a1f',
    warningColorHover: '#f7a548',
    warningColorPressed: '#d96e0f',
    warningColorSuppl: '#f58a1f',
  },
};
</script>

<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-global-style />
    <n-message-provider>
      <ProductSiteHeader v-if="showSiteHeader" />
      <router-view />
    </n-message-provider>
  </n-config-provider>
</template>
