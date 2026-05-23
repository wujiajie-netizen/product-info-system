<script lang="ts" setup>
import type {
  AdminDashboardData,
  AdminDashboardPendingVariant,
} from '#/api';
import type { AnalysisOverviewItem } from '@vben/common-ui';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { AnalysisOverview, Page } from '@vben/common-ui';

import {
  ElButton,
  ElCard,
  ElEmpty,
  ElMessage,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { getAdminDashboard } from '#/api';

const router = useRouter();
const loading = ref(false);
const dashboard = ref<AdminDashboardData | null>(null);

const quickActions = [
  {
    description: '上传结构化 Excel，预检后批量创建商品和报价',
    path: '/admin/product-info/workbench',
    title: 'Excel 导入商品',
  },
  {
    description: '无 Excel 时录入单个型号、规格和报价阶梯',
    path: '/admin/product-info/workbench?tab=manual-entry',
    title: '手动新建商品',
  },
  {
    description: '批量上传图片、规格书、说明书和报价附件',
    path: '/admin/product-info/document-fill',
    title: '补齐资料',
  },
  {
    description: '维护报价批次、报价行、阶梯价和状态',
    path: '/admin/quotes',
    title: '发布报价',
  },
];

const overviewItems = computed<AnalysisOverviewItem[]>(() => {
  const overview = dashboard.value?.overview;
  if (!overview) return [];

  return [
    {
      icon: 'lucide:boxes',
      title: overview.activeModels.title,
      totalTitle: overview.activeModels.totalTitle,
      totalValue: overview.activeModels.totalValue,
      value: overview.activeModels.value,
    },
    {
      icon: 'lucide:files',
      title: overview.documents.title,
      totalTitle: overview.documents.totalTitle,
      totalValue: overview.documents.totalValue,
      value: overview.documents.value,
    },
    {
      icon: 'lucide:badge-dollar-sign',
      title: overview.activeQuotes.title,
      totalTitle: overview.activeQuotes.totalTitle,
      totalValue: overview.activeQuotes.totalValue,
      value: overview.activeQuotes.value,
    },
    {
      icon: 'lucide:shield-alert',
      title: overview.pendingModels.title,
      totalTitle: overview.pendingModels.totalTitle,
      totalValue: overview.pendingModels.totalValue,
      value: overview.pendingModels.value,
    },
  ];
});

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
  });
}

function getMissingLabels(row: AdminDashboardPendingVariant) {
  const labels: string[] = [];
  if (row.missingImage) labels.push('图片');
  if (row.missingSpec) labels.push('规格资料');
  if (row.missingQuote) labels.push('报价');
  return labels;
}

function getFillPath(row: AdminDashboardPendingVariant) {
  if (row.missingImage || row.missingSpec) return '/admin/product-info/document-fill';
  if (row.missingQuote) return '/admin/quotes';
  return '/admin/product-info/workbench';
}

function go(path: string) {
  router.push(path);
}

async function loadDashboard() {
  try {
    loading.value = true;
    dashboard.value = await getAdminDashboard();
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    loading.value = false;
  }
}

onMounted(loadDashboard);
</script>

<template>
  <Page
    description="面向管理员的产品、资料、报价和动态统一运营入口"
    title="业务运营看板"
  >
    <AnalysisOverview :items="overviewItems" />

    <div class="mt-5 grid gap-4 md:grid-cols-4">
      <ElCard v-for="action in quickActions" :key="action.path" shadow="never">
        <div class="text-base font-medium">{{ action.title }}</div>
        <p class="mt-2 min-h-10 text-sm text-gray-500">{{ action.description }}</p>
        <ElButton class="mt-3" type="primary" @click="go(action.path)">
          进入处理
        </ElButton>
      </ElCard>
    </div>

    <div class="mt-5 grid gap-4 xl:grid-cols-2">
      <ElCard shadow="never">
        <template #header>最新动态</template>
        <ElTable v-loading="loading" :data="dashboard?.latestUpdates || []" stripe>
          <ElTableColumn label="动态标题" min-width="220" prop="title" />
          <ElTableColumn label="类型" width="120">
            <template #default="{ row }">
              <ElTag type="warning">{{ row.typeLabel }}</ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="关联对象" min-width="220">
            <template #default="{ row }">{{ row.referenceLabel }}</template>
          </ElTableColumn>
          <ElTableColumn label="更新时间" width="180">
            <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
          </ElTableColumn>
          <template #empty><ElEmpty description="暂无动态" /></template>
        </ElTable>
      </ElCard>

      <ElCard shadow="never">
        <template #header>待补齐清单</template>
        <ElTable v-loading="loading" :data="dashboard?.pendingVariants || []" stripe>
          <ElTableColumn label="型号" min-width="150" prop="model" />
          <ElTableColumn label="系列" min-width="160" prop="seriesName" />
          <ElTableColumn label="分类" min-width="110" prop="category" />
          <ElTableColumn label="缺失项" min-width="200">
            <template #default="{ row }">
              <div class="flex flex-wrap gap-2">
                <ElTag
                  v-for="label in getMissingLabels(row)"
                  :key="label"
                  type="danger"
                >
                  {{ label }}
                </ElTag>
              </div>
            </template>
          </ElTableColumn>
          <ElTableColumn label="进入工作台" width="120">
            <template #default="{ row }">
              <ElButton link type="primary" @click="go(getFillPath(row))">
                处理
              </ElButton>
            </template>
          </ElTableColumn>
          <ElTableColumn label="最近更新" width="160">
            <template #default="{ row }">{{ formatDateTime(row.updatedAt) }}</template>
          </ElTableColumn>
          <template #empty><ElEmpty description="暂无待补齐型号" /></template>
        </ElTable>
      </ElCard>
    </div>
  </Page>
</template>
