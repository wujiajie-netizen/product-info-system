<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NCard, NEmpty, NInput, NTag } from 'naive-ui';

import {
  formatMoney,
  isUsingDemoData,
  listCompanies,
  listProducts,
} from '#/api/product-info';
import AppIcon from '#/components/AppIcon.vue';
import FrontShell from '#/components/FrontShell.vue';
import {
  getCompanyTypeIcon,
  quickEntryIcons,
  searchIcon,
} from '#/lib/front-icons';
import { useAuthState } from '#/lib/auth';
import { getErrorMessage } from '#/lib/errors';

const auth = useAuthState();
const loading = ref(false);
const errorMessage = ref('');
const keyword = ref('');
const companies = ref<Awaited<ReturnType<typeof listCompanies>>>([]);
const products = ref<Awaited<ReturnType<typeof listProducts>>>([]);

const visibleCompanies = computed(() => {
  const value = keyword.value.trim().toLowerCase();

  return companies.value.filter((item) => {
    if (!value) {
      return true;
    }

    return `${item.name} ${item.type} ${item.description || ''}`
      .toLowerCase()
      .includes(value);
  });
});

function productsForCompany(companyId: string) {
  return products.value.filter(
    (item) => item.latestQuote?.company_id === companyId,
  );
}

async function loadCompanies() {
  loading.value = true;
  errorMessage.value = '';

  try {
    const [companyData, productData] = await Promise.all([
      listCompanies(),
      listProducts(),
    ]);
    companies.value = companyData;
    products.value = productData;
  } catch (error) {
    errorMessage.value = getErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

watch(
  () => [auth.user?.id, isUsingDemoData()],
  ([userId, demoMode]) => {
    if (!userId && !demoMode) {
      companies.value = [];
      products.value = [];
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
