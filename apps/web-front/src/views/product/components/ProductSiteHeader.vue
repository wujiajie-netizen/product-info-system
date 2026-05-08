<script setup lang="ts">
import { ref } from 'vue';
import { Menu, X } from 'lucide-vue-next';
import { RouterLink, useRoute } from 'vue-router';

import AppIcon from '#/components/AppIcon.vue';
import { productNavItems } from '#/views/product/product-list-data';

const route = useRoute();
const mobileOpen = ref(false);

function isActive(path: string) {
  if (path === '/') {
    return route.path === '/';
  }

  return route.path === path || route.path.startsWith(`${path}/`);
}
</script>

<template>
  <header class="product-site-header">
    <div class="product-site-header__inner">
      <RouterLink class="product-site-header__brand" to="/">
        <span class="product-site-header__mark" aria-hidden="true">
          <svg viewBox="0 0 52 52" class="product-site-header__logo">
            <defs>
              <linearGradient
                id="productBrandBlue"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stop-color="#2a95f7" />
                <stop offset="100%" stop-color="#0b63d4" />
              </linearGradient>
            </defs>
            <path
              d="M16.4 3.5H35.6L48.6 16.4V35.6L35.6 48.5H16.4L3.4 35.6V16.4Z"
              fill="url(#productBrandBlue)"
            />
            <path
              d="M17.7 12.8H33.4L39.9 19.4V21.5H29.8L24.4 16.2H18.9L13.1 22V30L18.9 35.8H24.4L29.8 30.5H39.9V32.6L33.4 39.2H17.7L9.7 31.3V20.7Z"
              fill="#ffffff"
            />
            <path d="M28.5 23.2H41.1V28.8H28.5Z" fill="#ffffff" />
          </svg>
        </span>
        <span class="product-site-header__copy">商品信息平台</span>
      </RouterLink>

      <nav class="product-site-header__nav" aria-label="前台导航">
        <RouterLink
          v-for="item in productNavItems"
          :key="item.to"
          :to="item.to"
          class="product-site-header__nav-link"
          :class="{ 'is-active': isActive(item.to) }"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="product-site-header__actions">
        <button
          class="product-site-header__mobile-toggle"
          type="button"
          aria-label="打开菜单"
          @click="mobileOpen = true"
        >
          <AppIcon :icon="Menu" :size="20" />
        </button>
      </div>
    </div>
  </header>

  <div
    v-if="mobileOpen"
    class="product-site-header__mobile-mask"
    @click="mobileOpen = false"
  ></div>

  <aside
    class="product-site-header__mobile-panel"
    :class="{ 'is-open': mobileOpen }"
    aria-label="移动端导航"
  >
    <div class="product-site-header__mobile-head">
      <RouterLink class="product-site-header__brand" to="/" @click="mobileOpen = false">
        <span class="product-site-header__mark" aria-hidden="true">
          <svg viewBox="0 0 52 52" class="product-site-header__logo">
            <defs>
              <linearGradient
                id="productBrandBlueMobile"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stop-color="#2a95f7" />
                <stop offset="100%" stop-color="#0b63d4" />
              </linearGradient>
            </defs>
            <path
              d="M16.4 3.5H35.6L48.6 16.4V35.6L35.6 48.5H16.4L3.4 35.6V16.4Z"
              fill="url(#productBrandBlueMobile)"
            />
            <path
              d="M17.7 12.8H33.4L39.9 19.4V21.5H29.8L24.4 16.2H18.9L13.1 22V30L18.9 35.8H24.4L29.8 30.5H39.9V32.6L33.4 39.2H17.7L9.7 31.3V20.7Z"
              fill="#ffffff"
            />
            <path d="M28.5 23.2H41.1V28.8H28.5Z" fill="#ffffff" />
          </svg>
        </span>
        <span class="product-site-header__copy">商品信息平台</span>
      </RouterLink>
      <button type="button" aria-label="关闭菜单" @click="mobileOpen = false">
        <AppIcon :icon="X" :size="18" />
      </button>
    </div>

    <nav class="product-site-header__mobile-nav">
      <RouterLink
        v-for="item in productNavItems"
        :key="item.to"
        :to="item.to"
        class="product-site-header__mobile-link"
        :class="{ 'is-active': isActive(item.to) }"
        @click="mobileOpen = false"
      >
        {{ item.label }}
      </RouterLink>
    </nav>
  </aside>
</template>

<style scoped>
.product-site-header {
  position: sticky;
  top: 0;
  z-index: 40;
  background: rgb(255 255 255 / 96%);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid #e6edf7;
  box-shadow: 0 8px 24px rgb(18 33 61 / 0.035);
}

.product-site-header__inner {
  display: grid;
  grid-template-columns: 156px minmax(0, 1fr) 156px;
  gap: 20px;
  align-items: center;
  max-width: 1520px;
  min-height: 68px;
  padding: 0 24px;
  margin: 0 auto;
}

.product-site-header__brand {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 10px;
  justify-content: flex-start;
  width: 156px;
}

.product-site-header__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
}

.product-site-header__logo {
  width: 100%;
  height: 100%;
}

.product-site-header__copy {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
  color: #5d708d;
  white-space: nowrap;
}

.product-site-header__nav {
  display: flex;
  flex: 0 0 auto;
  gap: 18px;
  align-items: stretch;
  justify-content: center;
  min-width: 0;
}

.product-site-header__nav-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 68px;
  font-size: 16px;
  font-weight: 600;
  color: #14233f;
  transition: color 0.2s ease;
}

.product-site-header__nav-link::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 2px;
  content: '';
  background: #1664d9;
  border-radius: 999px;
  opacity: 0;
  transform: scaleX(0.4);
  transform-origin: center;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.product-site-header__nav-link:hover,
.product-site-header__nav-link.is-active {
  color: #1664d9;
}

.product-site-header__nav-link:hover::after,
.product-site-header__nav-link.is-active::after {
  opacity: 1;
  transform: scaleX(1);
}

.product-site-header__actions {
  display: flex;
  align-items: center;
  justify-self: end;
  justify-content: flex-end;
  width: 156px;
}

.product-site-header__mobile-toggle,
.product-site-header__mobile-head button {
  display: inline-flex;
  align-items: center;
  color: #1f2f4b;
  background: transparent;
  border: 0;
}

.product-site-header__mobile-toggle {
  display: none;
  justify-content: center;
  width: 42px;
  height: 42px;
  color: #12213d;
}

.product-site-header__mobile-mask {
  position: fixed;
  inset: 0;
  z-index: 48;
  background: rgb(18 33 61 / 0.35);
}

.product-site-header__mobile-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 49;
  width: min(86vw, 340px);
  padding: 20px 18px;
  background: #fff;
  box-shadow: -20px 0 50px rgb(18 33 61 / 0.18);
  transform: translateX(100%);
  transition: transform 0.24s ease;
}

.product-site-header__mobile-panel.is-open {
  transform: translateX(0);
}

.product-site-header__mobile-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;
  border-bottom: 1px solid #edf2f8;
}

.product-site-header__mobile-head .product-site-header__brand {
  width: auto;
}

.product-site-header__mobile-nav {
  display: grid;
  gap: 8px;
  padding-top: 18px;
  justify-items: center;
}

.product-site-header__mobile-link {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 46px;
  width: min(100%, 220px);
  padding: 0 18px;
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  border-radius: 12px;
}

.product-site-header__mobile-link.is-active {
  color: #1664d9;
  background: #edf4ff;
}

@media (max-width: 1360px) {
  .product-site-header__inner {
    grid-template-columns: 136px minmax(0, 1fr) 136px;
    gap: 14px;
    padding: 0 18px;
  }

  .product-site-header__brand,
  .product-site-header__actions {
    width: 136px;
  }

  .product-site-header__nav {
    gap: 25px;
  }

  .product-site-header__nav-link {
    font-size: 15px;
  }
}

@media (max-width: 1024px) {
  .product-site-header__inner {
    display: flex;
    min-height: 68px;
  }

  .product-site-header__brand,
  .product-site-header__actions {
    width: auto;
  }

  .product-site-header__nav {
    display: none;
  }

  .product-site-header__mobile-toggle {
    display: inline-flex;
  }
}
</style>
