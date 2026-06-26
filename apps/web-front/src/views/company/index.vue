<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NCard, NEmpty, NInput, NSkeleton, NTag } from 'naive-ui';
import { useRoute } from 'vue-router';

import {
  formatMoney,
  isUsingDemoData,
  listAllProducts,
  listCompanies,
  listQuotes,
  listUpdates,
} from '@/api/product-info';
import AppIcon from '@/components/AppIcon.vue';
import FrontShell from '@/components/FrontShell.vue';
import {
  getCompanyTypeIcon,
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
const companies = ref<Awaited<ReturnType<typeof listCompanies>>>([]);
const products = ref<Awaited<ReturnType<typeof listAllProducts>>>([]);
const quotes = ref<Awaited<ReturnType<typeof listQuotes>>>([]);
const updates = ref<Awaited<ReturnType<typeof listUpdates>>>([]);
const skeletonCompanies = Array.from({ length: 6 }, (_, index) => index);

const visibleCompanies = computed(() => {
  const value = keyword.value.trim().toLowerCase();
  const selectedCompanyId =
    typeof route.query.companyId === 'string' ? route.query.companyId : '';
  const selectedProductId =
    typeof route.query.productId === 'string' ? route.query.productId : '';
  const selectedProductModel =
    typeof route.query.productModel === 'string' ? route.query.productModel : '';

  return companies.value.filter((item) => {
    if (selectedCompanyId && item.id !== selectedCompanyId) {
      return false;
    }

    if (selectedProductId || selectedProductModel) {
      const relatedProducts = productsForCompany(item.id);
      const matchesProduct = relatedProducts.some(
        (product) =>
          (!selectedProductId || product.id === selectedProductId) &&
          (!selectedProductModel || product.model === selectedProductModel),
      );

      if (!matchesProduct) {
        return false;
      }
    }

    if (!value) {
      return true;
    }

    return `${item.name} ${item.type} ${item.description || ''}`
      .toLowerCase()
      .includes(value);
  });
});
const showInitialSkeleton = computed(
  () =>
    loading.value &&
    !companies.value.length &&
    !products.value.length &&
    !quotes.value.length &&
    !updates.value.length &&
    !errorMessage.value,
);

function productsForCompany(companyId: string) {
  return products.value.filter(
    (item) =>
      item.companyId === companyId || item.latestQuote?.company_id === companyId,
  );
}

function quotesForCompany(companyId: string) {
  return quotes.value.filter((item) => item.company_id === companyId);
}

function updatesForCompany(companyId: string) {
  const models = new Set(productsForCompany(companyId).map((item) => item.model));
  return updates.value.filter((item) => item.product_model && models.has(item.product_model));
}

async function loadCompanies() {
  loading.value = true;
  errorMessage.value = '';

  try {
    const [companyData, productData, quoteData, updateData] = await Promise.all([
      listCompanies(),
      listAllProducts(),
      listQuotes(),
      listUpdates(),
    ]);
    companies.value = companyData;
    products.value = productData;
    quotes.value = quoteData;
    updates.value = updateData;
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

    void loadCompanies();
  },
  { immediate: true },
);
</script>

<template>
  <FrontShell>
    <section class="content-section shell-container">
      <div class="section-heading">
        <div>
          <h1>公司库</h1>
          <p>供应商、制造商、品牌方和报价来源公司的统一入口。</p>
        </div>
        <n-tag>
          <span class="tag-with-icon">
            <AppIcon :icon="quickEntryIcons.公司库" :size="14" />
            {{ visibleCompanies.length }} 家公司
          </span>
        </n-tag>
      </div>

      <div class="toolbar-row">
        <n-input
          v-model:value="keyword"
          clearable
          placeholder="搜索公司、类型、说明"
        >
          <template #prefix>
            <AppIcon :icon="searchIcon" :size="16" />
          </template>
        </n-input>
      </div>

      <n-card v-if="errorMessage">
        <n-empty :description="errorMessage" />
      </n-card>

      <div v-else-if="showInitialSkeleton" class="company-grid page-skeleton-grid" aria-hidden="true">
        <div
          v-for="item in skeletonCompanies"
          :key="`company-skeleton-${item}`"
          class="page-skeleton-card page-skeleton-card--company"
        >
          <div class="page-skeleton-card__head">
            <n-skeleton text class="page-skeleton-line page-skeleton-line--medium" />
            <n-skeleton class="page-skeleton-pill" />
          </div>
          <n-skeleton text class="page-skeleton-line page-skeleton-line--wide" />
          <n-skeleton text class="page-skeleton-line page-skeleton-line--medium" />
          <div class="page-skeleton-mini-list">
            <n-skeleton class="page-skeleton-mini-line" />
            <n-skeleton class="page-skeleton-mini-line" />
            <n-skeleton class="page-skeleton-mini-line" />
          </div>
        </div>
      </div>

      <div v-else-if="visibleCompanies.length" class="company-grid">
        <n-card
          v-for="company in visibleCompanies"
          :key="company.id"
          class="company-card"
          hoverable
        >
          <div class="company-card-head">
            <strong class="inline-info">
              <AppIcon :icon="getCompanyTypeIcon(company.type)" :size="18" />
              {{ company.name }}
            </strong>
            <n-tag size="small">{{ company.type }}</n-tag>
          </div>
          <p>{{ company.description || '暂无公司说明' }}</p>
          <div class="quote-mini-list">
            <div>
              <span>关联产品</span>
              <strong>{{ productsForCompany(company.id).length }} 个</strong>
            </div>
            <div>
              <span>关联报价</span>
              <strong>{{ quotesForCompany(company.id).length }} 条</strong>
            </div>
            <div>
              <span>相关动态</span>
              <strong>{{ updatesForCompany(company.id).length }} 条</strong>
            </div>
            <div
              v-for="product in productsForCompany(company.id).slice(0, 3)"
              :key="product.id"
            >
              <span>{{ product.model }}</span>
              <strong>{{ formatMoney(product.latestQuote) }}</strong>
            </div>
            <span v-if="!productsForCompany(company.id).length"
              >暂无关联报价</span
            >
          </div>
        </n-card>
      </div>

      <n-card v-else :loading="loading">
        <n-empty description="暂无公司数据。" />
      </n-card>
    </section>
  </FrontShell>
</template>
