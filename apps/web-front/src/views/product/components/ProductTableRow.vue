<script setup lang="ts">
import { ChevronRight, Ellipsis, FileText } from 'lucide-vue-next';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import AppIcon from '#/components/AppIcon.vue';
import type { CatalogProduct } from '#/views/product/product-list-data';

const props = defineProps<{
  product: CatalogProduct;
}>();

const detailLink = computed(() => `/products/${props.product.id}`);

function formatScore(value: number) {
  return value.toFixed(1);
}
</script>

<template>
  <article class="product-table-row">
    <div class="product-table-row__check">
      <input type="checkbox" />
    </div>

    <RouterLink class="product-table-row__info" :to="detailLink">
      <div class="product-table-row__thumb">
        <img :src="product.image" :alt="product.name" />
      </div>
      <div class="product-table-row__content">
        <div class="product-table-row__name-line">
          <h3>{{ product.name }}</h3>
          <span class="product-table-row__status">现货</span>
        </div>
        <p>{{ product.model }}</p>
        <span class="product-table-row__summary">{{ product.summary }}</span>
        <div class="product-table-row__tags">
          <span v-for="tag in product.tags" :key="tag">{{ tag }}</span>
        </div>
      </div>
    </RouterLink>

    <div class="product-table-row__specs">
      <p v-for="spec in product.specs" :key="spec.label">
        <span>{{ spec.label }}：</span>
        <strong>{{ spec.value }}</strong>
      </p>
    </div>

    <div class="product-table-row__docs">
      <RouterLink
        v-for="doc in product.docs"
        :key="doc.label"
        to="/documents"
        class="product-table-row__doc-link"
        :class="`is-${doc.tone}`"
      >
        <AppIcon :icon="FileText" :size="14" />
        <span>{{ doc.label }}</span>
      </RouterLink>
      <RouterLink to="/documents" class="product-table-row__more-link">
        <span>查看更多（{{ product.docCount }}）</span>
        <AppIcon :icon="ChevronRight" :size="14" />
      </RouterLink>
    </div>

    <div class="product-table-row__quote">
      <strong>¥ {{ product.price }}</strong>
      <p>起订量：{{ product.minimumOrder }}</p>
      <p>交期：{{ product.leadTime }}</p>
      <RouterLink to="/quotes" class="product-table-row__more-link">
        <span>查看报价详情</span>
        <AppIcon :icon="ChevronRight" :size="14" />
      </RouterLink>
    </div>

    <div class="product-table-row__company">
      <div class="product-table-row__company-line">
        <span>{{ product.companyName }}</span>
        <em>{{ product.quoteRole }}</em>
      </div>
      <div class="product-table-row__rating">
        <span>{{ formatScore(product.companyRating) }}</span>
        <b>★★★★★</b>
      </div>
      <RouterLink to="/companies" class="product-table-row__more-link">
        <span>联系公司</span>
        <AppIcon :icon="ChevronRight" :size="14" />
      </RouterLink>
    </div>

    <div class="product-table-row__updated">
      <span>{{ product.updatedDate }}</span>
      <small>{{ product.updatedAgo }}</small>
    </div>

    <button class="product-table-row__menu" type="button" aria-label="更多操作">
      <AppIcon :icon="Ellipsis" :size="18" />
    </button>
  </article>
</template>

<style scoped>
.product-table-row {
  display: grid;
  grid-template-columns: 34px minmax(0, 2.65fr) minmax(0, 1.55fr) 0.95fr 0.9fr 1.05fr 0.62fr 28px;
  gap: 16px;
  align-items: stretch;
  padding: 12px 14px;
  border-top: 1px solid #edf2f8;
}

.product-table-row:hover {
  background: #fbfdff;
}

.product-table-row__check {
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-table-row__check input {
  width: 14px;
  height: 14px;
  margin: 0;
}

.product-table-row__info {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  min-width: 0;
}

.product-table-row__thumb {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  overflow: hidden;
  background: linear-gradient(180deg, #f2f7ff 0%, #e5efff 100%);
  border: 1px solid #dbe5f4;
  border-radius: 8px;
}

.product-table-row__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-table-row__content {
  min-width: 0;
  padding-top: 2px;
}

.product-table-row__name-line {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 8px;
}

.product-table-row__name-line h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1664d9;
}

.product-table-row__status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 22px;
  padding: 0 8px;
  font-size: 12px;
  color: #2fa75d;
  background: #eff9f2;
  border: 1px solid #d2efdb;
  border-radius: 4px;
}

.product-table-row__content p,
.product-table-row__summary,
.product-table-row__specs p,
.product-table-row__quote p,
.product-table-row__updated small {
  font-size: 13px;
  color: #52627d;
}

.product-table-row__content p {
  margin: 0 0 8px;
}

.product-table-row__summary {
  display: block;
  margin-bottom: 10px;
}

.product-table-row__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.product-table-row__tags span {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  font-size: 12px;
  color: #56667f;
  background: #f5f8fd;
  border: 1px solid #e6edf7;
  border-radius: 4px;
}

.product-table-row__specs,
.product-table-row__docs,
.product-table-row__quote,
.product-table-row__company {
  display: grid;
  align-content: flex-start;
}

.product-table-row__specs {
  gap: 6px;
}

.product-table-row__specs p {
  margin: 0;
  line-height: 1.45;
}

.product-table-row__specs span {
  color: #687895;
}

.product-table-row__specs strong {
  font-weight: 500;
  color: #33445f;
}

.product-table-row__docs {
  gap: 9px;
}

.product-table-row__doc-link,
.product-table-row__more-link {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
}

.product-table-row__doc-link.is-red {
  color: #ef5b4b;
}

.product-table-row__doc-link.is-blue,
.product-table-row__more-link {
  color: #1664d9;
}

.product-table-row__quote strong {
  margin-bottom: 10px;
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  color: #f05a1a;
}

.product-table-row__quote p {
  margin: 0 0 6px;
}

.product-table-row__company {
  gap: 10px;
}

.product-table-row__company-line {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.product-table-row__company-line span {
  font-size: 14px;
  color: #233450;
}

.product-table-row__company-line em {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 20px;
  padding: 0 6px;
  font-size: 12px;
  font-style: normal;
  color: #1664d9;
  background: #edf4ff;
  border-radius: 4px;
}

.product-table-row__rating {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
  color: #33445f;
}

.product-table-row__rating b {
  font-size: 12px;
  color: #ff8b1f;
  letter-spacing: 1px;
}

.product-table-row__updated {
  display: grid;
  gap: 10px;
  align-content: flex-start;
  padding-top: 4px;
}

.product-table-row__updated span {
  font-size: 13px;
  color: #60708d;
}

.product-table-row__updated small {
  line-height: 1.4;
}

.product-table-row__menu {
  display: inline-flex;
  align-items: flex-start;
  justify-content: center;
  padding: 6px 0 0;
  color: #60708d;
  cursor: pointer;
  background: transparent;
  border: 0;
}

@media (max-width: 1100px) {
  .product-table-row {
    grid-template-columns: 34px minmax(0, 1fr);
    gap: 14px;
  }

  .product-table-row__info,
  .product-table-row__specs,
  .product-table-row__docs,
  .product-table-row__quote,
  .product-table-row__company,
  .product-table-row__updated,
  .product-table-row__menu {
    grid-column: 2;
  }

  .product-table-row__menu {
    display: none;
  }
}

@media (max-width: 680px) {
  .product-table-row {
    padding: 14px 12px;
  }

  .product-table-row__info {
    flex-direction: column;
  }

  .product-table-row__thumb {
    width: 100%;
    max-width: 280px;
    height: auto;
    aspect-ratio: 1 / 1;
  }

  .product-table-row__quote strong {
    font-size: 24px;
  }
}
</style>
