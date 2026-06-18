<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NCard, NEmpty, NInput, NTag } from 'naive-ui';
import { RouterLink, useRoute } from 'vue-router';

import {
  formatDate,
  formatMoney,
  isUsingDemoData,
  listAllProducts,
  listCompanies,
  listQuotes,
} from '@/api/product-info';
import AppIcon from '@/components/AppIcon.vue';
import FrontShell from '@/components/FrontShell.vue';
import {
  getQuoteMetaIcon,
  quickEntryIcons,
  searchIcon,
} from '@/lib/front-icons';
import { useAuthState } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';

const auth = useAuthState();
const route = useRoute();
const loading = ref(false);
const errorMessage = ref('');
const keyword = ref(typeof route.query.keyword === 'string' ? route.query.keyword : '');
const quotes = ref<Awaited<ReturnType<typeof listQuotes>>>([]);
const products = ref<Awaited<ReturnType<typeof listAllProducts>>>([]);
const companies = ref<Awaited<ReturnType<typeof listCompanies>>>([]);

const visibleQuotes = computed(() => {
  const value = keyword.value.trim().toLowerCase();
  const selectedProductModel =
    typeof route.query.productModel === 'string'
      ? route.query.productModel
      : '';

  return quotes.value.filter((quote) => {
    const product = products.value.find((item) => item.id === quote.product_id);
    const company = companies.value.find(
      (item) => item.id === quote.company_id,
    );

    if (selectedProductModel && product?.model !== selectedProductModel) {
      return false;
    }

    if (!value) {
      return true;
    }

    return `${quote.quote_no || ''} ${quote.remarks || ''} ${product?.name || ''} ${product?.model || ''} ${company?.name || ''}`
      .toLowerCase()
      .includes(value);
  });
});

function getProduct(productId: string) {
  return products.value.find((item) => item.id === productId);
}

function getCompany(companyId: string) {
  return companies.value.find((item) => item.id === companyId);
}

async function loadQuotes() {
  loading.value = true;
  errorMessage.value = '';

  try {
    const productId =
      typeof route.query.productId === 'string'
        ? route.query.productId
        : undefined;
    const [quoteData, productData, companyData] = await Promise.all([
      listQuotes({ productId }),
      listAllProducts(),
      listCompanies(),
    ]);
    quotes.value = quoteData;
    products.value = productData;
    companies.value = companyData;
  } catch (error) {
    errorMessage.value = getErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

watch(
  () => route.query.keyword,
  (value) => {
    keyword.value = typeof value === 'string' ? value : '';
  },
  { immediate: true },
);

watch(
  () => [auth.initialized, isUsingDemoData(), route.fullPath],
  ([initialized, demoMode]) => {
    if (!initialized && !demoMode) {
      return;
    }

    void loadQuotes();
  },
  { immediate: true },
);
</script>

<template>
  <FrontShell>
    <section class="content-section shell-container">
      <div class="section-heading">
        <div>
          <h1>报价中心</h1>
          <p>报价作为独立业务对象，按商品、公司、金额和有效期查看。</p>
        </div>
        <n-tag>
          <span class="tag-with-icon">
            <AppIcon :icon="quickEntryIcons.报价" :size="14" />
            {{ visibleQuotes.length }} 条报价
          </span>
        </n-tag>
      </div>

      <div class="toolbar-row">
        <n-input
          v-model:value="keyword"
          clearable
          placeholder="搜索报价编号、产品、公司"
        >
          <template #prefix>
            <AppIcon :icon="searchIcon" :size="16" />
          </template>
        </n-input>
      </div>

      <n-card v-if="errorMessage">
        <n-empty :description="errorMessage" />
      </n-card>

      <div v-else-if="visibleQuotes.length" class="quote-list-page">
        <RouterLink
          v-for="quote in visibleQuotes"
          :key="quote.id"
          :to="{
            name: 'product-detail',
            params: {
              productId:
                getProduct(quote.product_id)?.model || quote.product_id,
            },
          }"
          class="quote-list-card"
        >
          <div>
            <strong class="inline-info">
              <AppIcon :icon="quickEntryIcons.产品" :size="16" />
              {{ getProduct(quote.product_id)?.name || '未关联产品' }}
            </strong>
            <p>{{ getProduct(quote.product_id)?.model || quote.product_id }}</p>
          </div>
          <div>
            <span class="inline-info">
              <AppIcon :icon="getQuoteMetaIcon('company')" :size="16" />
              {{ getCompany(quote.company_id)?.name || '未关联公司' }}
            </span>
            <n-tag size="small">{{ quote.status }}</n-tag>
          </div>
          <div>
            <strong class="price-text inline-info">
              <AppIcon :icon="quickEntryIcons.报价" :size="16" />
              {{ formatMoney(quote) }}
            </strong>
            <p>{{ quote.remarks || '暂无备注' }}</p>
            <p v-if="quote.quote_tiers?.length">
              {{
                quote.quote_tiers
                  .map((tier) => `${tier.min_quantity}+ / ${tier.currency} ${tier.unit_price}`)
                  .join(' · ')
              }}
            </p>
          </div>
          <div>
            <span class="inline-info">
              <AppIcon :icon="getQuoteMetaIcon('valid')" :size="16" />
              批次/有效期
            </span>
            <strong>{{ quote.batch_title || quote.valid_until || '-' }}</strong>
            <p class="inline-info">
              <AppIcon :icon="getQuoteMetaIcon('updated')" :size="14" />
              更新于 {{ formatDate(quote.updated_at) }}
            </p>
          </div>
        </RouterLink>
      </div>

      <n-card v-else :loading="loading">
        <n-empty description="暂无报价。" />
      </n-card>
    </section>
  </FrontShell>
</template>
