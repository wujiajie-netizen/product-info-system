<script lang="ts" setup>
import type { DocumentRecord, ProductRecord, QuoteWithRelations } from '@/api';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { ElButton, ElCard, ElEmpty, ElMessage, ElSpace, ElTable, ElTableColumn, ElTag } from 'element-plus';

import { listDocuments, listProducts, listQuotes } from '@/api';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const products = ref<ProductRecord[]>([]);
const documents = ref<DocumentRecord[]>([]);
const quotes = ref<QuoteWithRelations[]>([]);

const seriesKey = computed(() => String(route.params.seriesId || ''));
const seriesProducts = computed(() =>
  products.value.filter(
    (product) =>
      product.series_id === seriesKey.value ||
      product.series_code === seriesKey.value ||
      product.id === seriesKey.value ||
      product.model === seriesKey.value,
  ),
);
const primaryProduct = computed(() => seriesProducts.value[0]);
const seriesTitle = computed(() => primaryProduct.value?.series_name || primaryProduct.value?.name || '系列详情');
const productIds = computed(() => new Set(seriesProducts.value.map((item) => item.id)));
const seriesIds = computed(() => new Set(seriesProducts.value.map((item) => item.series_id).filter(Boolean)));
const seriesDocuments = computed(() =>
  documents.value.filter(
    (document) =>
      (document.variant_id && productIds.value.has(document.variant_id)) ||
      (document.series_id && seriesIds.value.has(document.series_id)),
  ),
);
const seriesQuotes = computed(() => quotes.value.filter((quote) => productIds.value.has(quote.product_id)));

function formatDate(value?: null | string) {
  return value ? new Date(value).toLocaleDateString() : '-';
}

async function loadData() {
  try {
    loading.value = true;
    const [productRecords, documentRecords, quoteRecords] = await Promise.all([listProducts(), listDocuments(), listQuotes()]);
    products.value = productRecords;
    documents.value = documentRecords;
    quotes.value = quoteRecords;
  } catch (error) {
    ElMessage.error((error as Error).message || '系列详情加载失败');
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <Page description="系列、变体、资料和报价的后台维护中心雏形" :title="seriesTitle">
    <ElSpace class="mb-4" wrap>
      <ElButton @click="router.push({ name: 'AdminProducts' })">返回产品管理</ElButton>
      <ElTag type="primary">变体 {{ seriesProducts.length }}</ElTag>
      <ElTag type="info">资料 {{ seriesDocuments.length }}</ElTag>
      <ElTag type="warning">报价 {{ seriesQuotes.length }}</ElTag>
    </ElSpace>

    <ElEmpty v-if="!loading && !primaryProduct" description="未找到系列，请从产品管理页进入" />

    <div v-else class="grid gap-4">
      <ElCard v-loading="loading" shadow="never">
        <template #header>系列基础信息</template>
        <div class="grid gap-3 text-sm md:grid-cols-2">
          <div>系列名称：{{ primaryProduct?.series_name || '-' }}</div>
          <div>系列编码：{{ primaryProduct?.series_code || '-' }}</div>
          <div>分类：{{ primaryProduct?.category || '-' }}</div>
          <div>产品类型：{{ primaryProduct?.product_type || '-' }}</div>
          <div class="md:col-span-2">配置摘要：{{ primaryProduct?.summary_config_text || '-' }}</div>
        </div>
      </ElCard>

      <ElCard shadow="never">
        <template #header>变体列表</template>
        <ElTable :data="seriesProducts" stripe>
          <ElTableColumn label="型号" min-width="160" prop="model" />
          <ElTableColumn label="名称" min-width="220" prop="name" />
          <ElTableColumn label="尺寸" width="100" prop="size_inch" />
          <ElTableColumn label="芯片" width="140" prop="chipset" />
          <ElTableColumn label="状态" width="100" prop="status" />
          <ElTableColumn label="更新时间" width="140">
            <template #default="{ row }">{{ formatDate(row.updated_at) }}</template>
          </ElTableColumn>
        </ElTable>
      </ElCard>

      <ElCard shadow="never">
        <template #header>系列资料</template>
        <ElTable v-if="seriesDocuments.length" :data="seriesDocuments" stripe>
          <ElTableColumn label="标题" min-width="240" prop="title" />
          <ElTableColumn label="类型" width="120" prop="file_type" />
          <ElTableColumn label="细类" width="160" prop="document_kind" />
          <ElTableColumn label="关联型号" width="160" prop="product_model" />
        </ElTable>
        <ElEmpty v-else description="暂无系列资料" />
      </ElCard>

      <ElCard shadow="never">
        <template #header>系列报价</template>
        <ElTable v-if="seriesQuotes.length" :data="seriesQuotes" stripe>
          <ElTableColumn label="批次" min-width="220" prop="batch_title" />
          <ElTableColumn label="型号" width="160" prop="product_model" />
          <ElTableColumn label="币种" width="90" prop="currency" />
          <ElTableColumn label="状态" width="100" prop="status" />
          <ElTableColumn label="发布时间" width="140">
            <template #default="{ row }">{{ formatDate(row.published_at) }}</template>
          </ElTableColumn>
        </ElTable>
        <ElEmpty v-else description="暂无系列报价" />
      </ElCard>
    </div>
  </Page>
</template>
