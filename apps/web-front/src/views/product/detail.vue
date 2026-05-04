<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import {
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NEmpty,
  NResult,
  NSpace,
  NSpin,
  NTag,
} from 'naive-ui';
import { RouterLink } from 'vue-router';

import {
  createDocumentSignedUrl,
  formatCompanyType,
  formatDate,
  formatDocumentType,
  formatMoney,
  formatStatus,
  getProductDetail,
  isUsingDemoData,
} from '#/api/product-info';
import AppIcon from '#/components/AppIcon.vue';
import FrontShell from '#/components/FrontShell.vue';
import {
  detailActionIcons,
  getCompanyTypeIcon,
  getDocumentTypeIcon,
  getQuoteMetaIcon,
  quickEntryIcons,
} from '#/lib/front-icons';
import { useAuthState } from '#/lib/auth';
import { getErrorMessage } from '#/lib/errors';

const props = defineProps<{
  productId: string;
}>();

const auth = useAuthState();
const loading = ref(false);
const errorMessage = ref('');
const detail = ref<Awaited<ReturnType<typeof getProductDetail>>>(null);
const isPhoneLayout = ref(false);

const product = computed(() => detail.value?.product || null);
const specColumnCount = computed(() => (isPhoneLayout.value ? 1 : 2));
const imageDocuments = computed(
  () =>
    detail.value?.documents.filter((item) => item.file_type === 'image') || [],
);
const contentDocuments = computed(
  () =>
    detail.value?.documents.filter((item) => item.file_type !== 'image') || [],
);
const primaryDocument = computed(
  () => contentDocuments.value[0] || imageDocuments.value[0] || null,
);

function syncPhoneLayout() {
  isPhoneLayout.value = window.innerWidth < 768;
}

async function loadDetail() {
  loading.value = true;
  errorMessage.value = '';

  try {
    detail.value = await getProductDetail(props.productId);
  } catch (error) {
    detail.value = null;
    errorMessage.value = getErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function openDocument(
  document: NonNullable<typeof detail.value>['documents'][number],
) {
  const url = await createDocumentSignedUrl(document);

  if (url && url !== '#') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

async function openPrimaryDocument() {
  if (!primaryDocument.value) {
    return;
  }

  await openDocument(primaryDocument.value);
}

function scrollToSection(id: 'companies' | 'documents' | 'quotes' | 'specs') {
  document.getElementById(id)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

function findCompanyName(companyId: string) {
  return (
    detail.value?.companies.find((item) => item.id === companyId)?.name ||
    '未关联公司'
  );
}

function companyQuoteCount(companyId: string) {
  return (
    detail.value?.quotes.filter((item) => item.company_id === companyId)
      .length || 0
  );
}

function companyLatestQuote(companyId: string) {
  return (
    detail.value?.quotes.find((item) => item.company_id === companyId) || null
  );
}

watch(
  () => [auth.user?.id, props.productId, isUsingDemoData()],
  ([userId, _productId, demoMode]) => {
    if (!userId && !demoMode) {
      detail.value = null;
      return;
    }

    void loadDetail();
  },
  { immediate: true },
);

onMounted(() => {
  syncPhoneLayout();
  window.addEventListener('resize', syncPhoneLayout);
});

onUnmounted(() => {
  window.removeEventListener('resize', syncPhoneLayout);
});
</script>

<template>
  <FrontShell>
    <section class="content-section shell-container product-detail-page">
      <n-spin :show="loading">
        <n-card v-if="errorMessage">
          <n-empty :description="errorMessage" />
        </n-card>
        <n-result
          v-else-if="!product"
          description="没有找到该型号对应的商品记录。"
          status="404"
          title="商品不存在"
        />
        <template v-else>
          <nav class="detail-breadcrumbs" aria-label="商品详情面包屑">
            <RouterLink to="/products">产品</RouterLink>
            <span>/</span>
            <RouterLink
              :to="{
                name: 'categories',
                params: { slug: product.categorySlug || product.category },
              }"
            >
              {{ product.category }}
            </RouterLink>
            <span>/</span>
            <span>{{ product.name }}</span>
          </nav>

          <div class="detail-hero">
            <div class="detail-image-panel">
              <img :src="product.imageUrl" :alt="product.name" />
              <div v-if="imageDocuments.length" class="detail-thumb-strip">
                <button
                  v-for="item in imageDocuments"
                  :key="item.id"
                  type="button"
                  @click="openDocument(item)"
                >
                  {{ formatDocumentType(item.file_type) }}
                </button>
              </div>
            </div>

            <div class="detail-main-panel">
              <div class="detail-header">
                <h1>{{ product.name }}</h1>
                <n-tag
                  :type="product.status === 'active' ? 'success' : 'default'"
                >
                  {{ formatStatus(product.status) }}
                </n-tag>
              </div>
              <div class="detail-action-row">
                <button type="button">
                  <AppIcon :icon="detailActionIcons.compare" :size="16" />
                  对比
                </button>
                <button type="button">
                  <AppIcon :icon="detailActionIcons.favorite" :size="16" />
                  收藏
                </button>
                <button type="button">
                  <AppIcon :icon="detailActionIcons.share" :size="16" />
                  分享
                </button>
              </div>
              <p class="detail-model">
                {{ product.model }} · {{ product.brand || product.category }}
              </p>
              <p class="detail-summary">{{ product.summary }}</p>
              <n-space size="small">
                <n-tag v-for="tag in product.tags" :key="tag" size="small">{{
                  tag
                }}</n-tag>
              </n-space>

              <div class="spec-kpi-grid">
                <div
                  v-for="entry in product.specEntries.slice(0, 4)"
                  :key="entry.key"
                >
                  <strong>{{ entry.value }}</strong>
                  <span>{{ entry.label }}</span>
                </div>
              </div>
            </div>

            <aside class="detail-side-panel">
              <n-card title="快速操作">
                <div class="detail-quick-actions">
                  <n-button
                    block
                    type="primary"
                    :disabled="!primaryDocument"
                    @click="openPrimaryDocument"
                  >
                    <template #icon>
                      <AppIcon :icon="detailActionIcons.download" :size="16" />
                    </template>
                    下载资料
                  </n-button>
                  <div class="detail-quick-action-row">
                    <n-button secondary @click="scrollToSection('quotes')">
                      <template #icon>
                        <AppIcon :icon="quickEntryIcons.报价" :size="16" />
                      </template>
                      查看报价
                    </n-button>
                    <n-button secondary @click="scrollToSection('companies')">
                      <template #icon>
                        <AppIcon :icon="quickEntryIcons.公司库" :size="16" />
                      </template>
                      关联公司
                    </n-button>
                  </div>
                </div>
              </n-card>
              <n-card title="报价摘要">
                <strong class="price-large inline-info">
                  <AppIcon :icon="quickEntryIcons.报价" :size="18" />
                  {{ formatMoney(product.latestQuote) }}
                </strong>
                <p>
                  {{
                    product.latestQuote?.valid_until
                      ? `有效期至 ${product.latestQuote.valid_until}`
                      : '暂无有效期'
                  }}
                </p>
              </n-card>
              <n-card title="资料统计">
                <div class="detail-stat-grid">
                  <div>
                    <span class="stat-icon">
                      <AppIcon :icon="quickEntryIcons.资料" :size="18" />
                    </span>
                    <strong>{{ product.documentCount }}</strong>
                    <span>资料</span>
                  </div>
                  <div>
                    <span class="stat-icon">
                      <AppIcon :icon="quickEntryIcons.报价" :size="18" />
                    </span>
                    <strong>{{ product.quoteCount }}</strong>
                    <span>报价</span>
                  </div>
                </div>
              </n-card>
            </aside>
          </div>

          <div class="detail-section-tabs">
            <button type="button" @click="scrollToSection('specs')">
              规格参数
            </button>
            <button type="button" @click="scrollToSection('documents')">
              相关资料
            </button>
            <button type="button" @click="scrollToSection('quotes')">
              报价记录
            </button>
            <button type="button" @click="scrollToSection('companies')">
              关联公司
            </button>
          </div>

          <div class="detail-content-grid">
            <main>
              <n-card id="specs" title="规格参数" class="detail-block">
                <n-descriptions
                  label-placement="left"
                  :column="specColumnCount"
                  bordered
                >
                  <n-descriptions-item
                    v-for="entry in product.specEntries"
                    :key="entry.key"
                    :label="entry.label"
                  >
                    {{ entry.value }}
                  </n-descriptions-item>
                </n-descriptions>
              </n-card>

              <n-card id="documents" title="相关资料" class="detail-block">
                <div v-if="contentDocuments.length" class="document-list">
                  <div
                    v-for="item in contentDocuments"
                    :key="item.id"
                    class="document-row"
                  >
                    <div>
                      <strong class="inline-info">
                        <AppIcon
                          :icon="getDocumentTypeIcon(item.file_type)"
                          :size="18"
                        />
                        {{ item.title }}
                      </strong>
                      <p>
                        <n-tag
                          size="small"
                          :type="
                            item.file_type === 'quote' ? 'warning' : 'info'
                          "
                        >
                          {{ formatDocumentType(item.file_type) }}
                        </n-tag>
                        <span>更新 {{ formatDate(item.updated_at) }}</span>
                      </p>
                    </div>
                    <n-button
                      size="small"
                      tertiary
                      type="primary"
                      @click="openDocument(item)"
                    >
                      打开
                    </n-button>
                  </div>
                </div>
                <n-empty v-else description="当前没有相关资料。" />
              </n-card>
            </main>

            <aside>
              <n-card id="quotes" title="报价记录" class="detail-block">
                <div
                  v-if="detail?.quotes.length"
                  class="quote-mini-list detail-quote-list"
                >
                  <div v-for="item in detail.quotes" :key="item.id">
                    <header>
                      <span class="inline-info">
                        <AppIcon :icon="quickEntryIcons.报价" :size="16" />
                        {{ item.quote_no || '报价记录' }}
                      </span>
                      <strong class="inline-info">
                        <AppIcon :icon="quickEntryIcons.报价" :size="16" />
                        {{ formatMoney(item) }}
                      </strong>
                    </header>
                    <p class="inline-info wrap-inline-info">
                      <AppIcon :icon="getQuoteMetaIcon('company')" :size="14" />
                      {{ findCompanyName(item.company_id) }} · 起订
                      {{ item.min_order_quantity || '-' }} ·
                      {{
                        item.valid_until
                          ? `有效期至 ${item.valid_until}`
                          : '长期有效'
                      }}
                    </p>
                    <p v-if="item.remarks">{{ item.remarks }}</p>
                    <div
                      v-if="item.attachments.length"
                      class="quote-attachment-list"
                    >
                      <n-button
                        v-for="attachment in item.attachments"
                        :key="attachment.id"
                        size="tiny"
                        tertiary
                        type="primary"
                        @click="openDocument(attachment)"
                      >
                        {{ formatDocumentType(attachment.file_type) }}
                      </n-button>
                    </div>
                  </div>
                </div>
                <n-empty v-else description="暂无报价记录。" />
              </n-card>

              <n-card id="companies" title="关联公司" class="detail-block">
                <div v-if="detail?.companies.length" class="company-mini-list">
                  <div v-for="item in detail.companies" :key="item.id">
                    <strong class="inline-info">
                      <AppIcon
                        :icon="getCompanyTypeIcon(item.type)"
                        :size="16"
                      />
                      {{ item.name }}
                    </strong>
                    <span>
                      {{ formatCompanyType(item.type) }} ·
                      {{ item.description || '暂无说明' }}
                    </span>
                    <span>
                      报价 {{ companyQuoteCount(item.id) }} 条 · 最新
                      {{ formatMoney(companyLatestQuote(item.id)) }}
                    </span>
                  </div>
                </div>
                <n-empty v-else description="暂无关联公司。" />
              </n-card>
            </aside>
          </div>
        </template>
      </n-spin>
    </section>
  </FrontShell>
</template>
