<script lang="ts" setup>
import type { UpdateRecord } from '#/api';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  ElCard,
  ElCol,
  ElEmpty,
  ElMessage,
  ElRow,
  ElStatistic,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { getDashboardSummary } from '#/api';

const loading = ref(false);
const productCount = ref(0);
const documentCount = ref(0);
const weekUpdateCount = ref(0);
const pendingDocumentCount = ref(0);
const latestUpdates = ref<UpdateRecord[]>([]);

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

async function loadDashboard() {
  try {
    loading.value = true;
    const summary = await getDashboardSummary();
    productCount.value = summary.productCount;
    documentCount.value = summary.documentCount;
    weekUpdateCount.value = summary.weekUpdateCount;
    pendingDocumentCount.value = summary.pendingDocumentCount;
    latestUpdates.value = summary.latestUpdates;
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    loading.value = false;
  }
}

onMounted(loadDashboard);
</script>

<template>
  <Page description="产品、文件、报价动态和内部权限的统一入口" title="产品资料工作台">
    <ElRow :gutter="16">
      <ElCol :lg="6" :md="12" :xs="24">
        <ElCard class="mb-4" shadow="never">
          <ElStatistic title="产品型号" :value="productCount" />
        </ElCard>
      </ElCol>
      <ElCol :lg="6" :md="12" :xs="24">
        <ElCard class="mb-4" shadow="never">
          <ElStatistic title="文件资料" :value="documentCount" />
        </ElCard>
      </ElCol>
      <ElCol :lg="6" :md="12" :xs="24">
        <ElCard class="mb-4" shadow="never">
          <ElStatistic title="本周动态" :value="weekUpdateCount" />
        </ElCard>
      </ElCol>
      <ElCol :lg="6" :md="12" :xs="24">
        <ElCard class="mb-4" shadow="never">
          <ElStatistic title="待整理资料" :value="pendingDocumentCount" />
        </ElCard>
      </ElCol>
    </ElRow>

    <ElCard shadow="never">
      <template #header>最新动态</template>
      <ElTable v-loading="loading" :data="latestUpdates" stripe>
        <ElTableColumn label="动态标题" min-width="220" prop="title" />
        <ElTableColumn label="关联型号" prop="product_model" width="160" />
        <ElTableColumn label="类型" prop="type" width="140">
          <template #default="{ row }">
            <ElTag type="primary">{{ row.type }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="更新时间" width="140">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </ElTableColumn>
        <template #empty>
          <ElEmpty description="暂无动态" />
        </template>
      </ElTable>
    </ElCard>
  </Page>
</template>
