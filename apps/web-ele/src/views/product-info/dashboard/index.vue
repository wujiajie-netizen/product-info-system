<script lang="ts" setup>
import type {
  AdminDashboardData,
  AdminDashboardDistributionItem,
  AdminDashboardPendingVariant,
  AdminDashboardTrendTab,
} from '@/api';
import type { AnalysisOverviewItem } from '@vben/common-ui';

import { computed, onMounted, ref } from 'vue';

import {
  AnalysisChartCard,
  AnalysisChartsTabs,
  AnalysisOverview,
  Page,
} from '@vben/common-ui';
import type { TabOption } from '@vben/types';

import {
  ElCard,
  ElEmpty,
  ElMessage,
  ElSkeleton,
  ElSkeletonItem,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { getAdminDashboard } from '@/api';

import DashboardChart from './components/dashboard-chart.vue';

type DashboardChartOption = Record<string, any>;

const loading = ref(false);
const dashboard = ref<AdminDashboardData | null>(null);
const showDashboardSkeleton = computed(() => loading.value && !dashboard.value);
const overviewSkeletonCards = Array.from({ length: 4 }, (_, index) => index);
const distributionSkeletonCards = Array.from({ length: 3 }, (_, index) => index);
const tableSkeletonRows = Array.from({ length: 5 }, (_, index) => index);
const fallbackTrendTabs: TabOption[] = [
  { label: '业务新增趋势', value: 'business' },
  { label: '动态类型趋势', value: 'updates' },
];

const overviewItems = computed<AnalysisOverviewItem[]>(() => {
  const overview = dashboard.value?.overview;
  if (!overview) {
    return [];
  }

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

const chartTabs = computed<TabOption[]>(
  () =>
    dashboard.value?.trendTabs.map((item) => ({
      label: item.label,
      value: item.value,
    })) || fallbackTrendTabs,
);

const businessTrend = computed(() => findTrendTab('business'));
const updateTrend = computed(() => findTrendTab('updates'));

const businessTrendOption = computed(() =>
  createLineChartOption(businessTrend.value, true),
);
const updateTrendOption = computed(() =>
  createLineChartOption(updateTrend.value, false),
);
const categoryCoverageOption = computed(() =>
  createBarChartOption(dashboard.value?.categoryCoverage || []),
);
const documentKindDistributionOption = computed(() =>
  createDonutChartOption(dashboard.value?.documentKindDistribution || []),
);
const quoteCompanyDistributionOption = computed(() =>
  createPieChartOption(dashboard.value?.quoteCompanyDistribution || []),
);

function findTrendTab(value: string) {
  return dashboard.value?.trendTabs.find((item) => item.value === value) || null;
}

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

  if (row.missingImage) {
    labels.push('图片');
  }
  if (row.missingSpec) {
    labels.push('规格资料');
  }
  if (row.missingQuote) {
    labels.push('报价');
  }

  return labels;
}

function hasDistributionData(items: AdminDashboardDistributionItem[]) {
  return items.some((item) => item.value > 0);
}

function hasTrendData(tab: AdminDashboardTrendTab | null) {
  return tab?.series.some((series) => series.data.some((value) => value > 0)) || false;
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

function createBarChartOption(
  items: AdminDashboardDistributionItem[],
): DashboardChartOption {
  return {
    grid: {
      bottom: 50,
      containLabel: true,
      left: '2%',
      right: '2%',
      top: 20,
    },
    series: [
      {
        barMaxWidth: 56,
        data: items.map((item) => item.value),
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: '#5ab1ef',
        },
        type: 'bar',
      },
    ],
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      axisLabel: {
        interval: 0,
        rotate: items.some((item) => item.name.length > 6) ? 20 : 0,
      },
      data: items.map((item) => item.name),
      type: 'category',
    },
    yAxis: {
      minInterval: 1,
      splitNumber: 4,
      type: 'value',
    },
  };
}

function createDonutChartOption(
  items: AdminDashboardDistributionItem[],
): DashboardChartOption {
  return {
    legend: {
      bottom: 0,
      left: 'center',
      type: 'scroll',
    },
    series: [
      {
        avoidLabelOverlap: false,
        color: ['#5ab1ef', '#019680', '#f59e0b', '#8b5cf6', '#f87171', '#22c55e'],
        data: items,
        emphasis: {
          label: {
            fontSize: 12,
            fontWeight: 'bold',
            show: true,
          },
        },
        label: {
          formatter: '{b}\n{c}',
        },
        name: '资料类型',
        radius: ['42%', '68%'],
        type: 'pie',
      },
    ],
    tooltip: {
      trigger: 'item',
    },
  };
}

function createLineChartOption(
  tab: AdminDashboardTrendTab | null,
  useArea: boolean,
): DashboardChartOption {
  const categories = tab?.categories || [];
  const series = tab?.series || [];

  return {
    grid: {
      bottom: 16,
      containLabel: true,
      left: '1%',
      right: '1%',
      top: 48,
    },
    legend: {
      top: 8,
    },
    series: series.map((item) => ({
      areaStyle: useArea ? { opacity: 0.2 } : undefined,
      data: item.data,
      itemStyle: {
        color: item.color,
      },
      lineStyle: {
        color: item.color,
        width: 2,
      },
      name: item.name,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      type: 'line',
    })),
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      axisTick: {
        show: false,
      },
      boundaryGap: false,
      data: categories,
      splitLine: {
        show: true,
      },
      type: 'category',
    },
    yAxis: {
      minInterval: 1,
      splitArea: {
        show: true,
      },
      splitNumber: 4,
      type: 'value',
    },
  };
}

function createPieChartOption(
  items: AdminDashboardDistributionItem[],
): DashboardChartOption {
  return {
    legend: {
      bottom: 0,
      left: 'center',
      type: 'scroll',
    },
    series: [
      {
        color: ['#019680', '#5ab1ef', '#f59e0b', '#8b5cf6', '#f87171', '#22c55e'],
        data: items,
        label: {
          formatter: '{b}: {c}',
        },
        radius: '72%',
        roseType: 'radius',
        type: 'pie',
      },
    ],
    tooltip: {
      trigger: 'item',
    },
  };
}
</script>

<template>
  <Page
    description="面向管理员的产品、资料、报价和动态统一运营入口"
    title="业务运营看板"
  >
    <div v-if="showDashboardSkeleton">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ElCard
          v-for="item in overviewSkeletonCards"
          :key="`overview-skeleton-${item}`"
          shadow="never"
        >
          <ElSkeleton animated>
            <template #template>
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <ElSkeletonItem class="!h-6 !w-24" variant="h3" />
                  <ElSkeletonItem class="!h-7 !w-10" variant="button" />
                </div>
                <ElSkeletonItem class="!h-9 !w-32" variant="h1" />
                <div class="flex items-center justify-between">
                  <ElSkeletonItem class="!h-4 !w-20" variant="text" />
                  <ElSkeletonItem class="!h-5 !w-16" variant="text" />
                </div>
              </div>
            </template>
          </ElSkeleton>
        </ElCard>
      </div>

      <div class="card-box mt-5 w-full px-4 pt-3 pb-5">
        <div class="flex gap-2">
          <ElSkeletonItem class="!h-8 !w-28" variant="button" />
          <ElSkeletonItem class="!h-8 !w-28" variant="button" />
        </div>
        <ElSkeleton animated class="mt-6">
          <template #template>
            <div class="h-[420px] space-y-4 pt-8">
              <ElSkeletonItem class="!h-4 !w-full" variant="p" />
              <ElSkeletonItem class="!h-4 !w-full" variant="p" />
              <ElSkeletonItem class="!h-4 !w-full" variant="p" />
              <ElSkeletonItem class="!h-4 !w-3/5" variant="p" />
            </div>
          </template>
        </ElSkeleton>
      </div>

      <div class="mt-5 w-full md:flex md:gap-4">
        <ElCard
          v-for="item in distributionSkeletonCards"
          :key="`distribution-skeleton-${item}`"
          class="mt-5 md:mt-0 md:w-1/3"
          shadow="never"
        >
          <ElSkeleton animated>
            <template #template>
              <div class="space-y-6">
                <ElSkeletonItem class="!h-7 !w-28" variant="h3" />
                <div class="h-[320px] space-y-4 pt-8">
                  <ElSkeletonItem class="!h-4 !w-full" variant="p" />
                  <ElSkeletonItem class="!h-4 !w-full" variant="p" />
                  <ElSkeletonItem class="!h-4 !w-full" variant="p" />
                  <ElSkeletonItem class="!h-4 !w-3/5" variant="p" />
                </div>
              </div>
            </template>
          </ElSkeleton>
        </ElCard>
      </div>

      <div class="mt-5 grid gap-4 xl:grid-cols-2">
        <ElCard v-for="card in 2" :key="`table-skeleton-${card}`" shadow="never">
          <ElSkeleton animated>
            <template #template>
              <div class="space-y-4">
                <ElSkeletonItem class="!h-6 !w-28" variant="h3" />
                <div class="space-y-3">
                  <div
                    v-for="row in tableSkeletonRows"
                    :key="`table-skeleton-${card}-${row}`"
                    class="grid grid-cols-[1.4fr_0.6fr_1fr_0.8fr] gap-3"
                  >
                    <ElSkeletonItem class="!h-5" variant="text" />
                    <ElSkeletonItem class="!h-5" variant="text" />
                    <ElSkeletonItem class="!h-5" variant="text" />
                    <ElSkeletonItem class="!h-5" variant="text" />
                  </div>
                </div>
              </div>
            </template>
          </ElSkeleton>
        </ElCard>
      </div>
    </div>

    <template v-else>
      <AnalysisOverview :items="overviewItems" />

      <AnalysisChartsTabs :tabs="chartTabs" class="mt-5">
        <template #business>
          <div class="h-[420px]">
            <DashboardChart
              v-if="hasTrendData(businessTrend)"
              :option="businessTrendOption"
              class="h-full"
            />
            <div v-else class="flex h-full items-center justify-center">
              <ElEmpty description="暂无业务新增趋势数据" />
            </div>
          </div>
        </template>
        <template #updates>
          <div class="h-[420px]">
            <DashboardChart
              v-if="hasTrendData(updateTrend)"
              :option="updateTrendOption"
              class="h-full"
            />
            <div v-else class="flex h-full items-center justify-center">
              <ElEmpty description="暂无动态趋势数据" />
            </div>
          </div>
        </template>
      </AnalysisChartsTabs>

      <div class="mt-5 w-full md:flex md:gap-4">
        <AnalysisChartCard class="md:w-1/3" title="分类覆盖">
          <div class="h-[320px]">
            <DashboardChart
              v-if="hasDistributionData(dashboard?.categoryCoverage || [])"
              :option="categoryCoverageOption"
              class="h-full"
            />
            <div v-else class="flex h-full items-center justify-center">
              <ElEmpty description="暂无分类覆盖数据" />
            </div>
          </div>
        </AnalysisChartCard>
        <AnalysisChartCard class="mt-5 md:mt-0 md:w-1/3" title="资料类型分布">
          <div class="h-[320px]">
            <DashboardChart
              v-if="hasDistributionData(dashboard?.documentKindDistribution || [])"
              :option="documentKindDistributionOption"
              class="h-full"
            />
            <div v-else class="flex h-full items-center justify-center">
              <ElEmpty description="暂无资料类型数据" />
            </div>
          </div>
        </AnalysisChartCard>
        <AnalysisChartCard class="mt-5 md:mt-0 md:w-1/3" title="报价来源公司">
          <div class="h-[320px]">
            <DashboardChart
              v-if="hasDistributionData(dashboard?.quoteCompanyDistribution || [])"
              :option="quoteCompanyDistributionOption"
              class="h-full"
            />
            <div v-else class="flex h-full items-center justify-center">
              <ElEmpty description="暂无报价来源公司数据" />
            </div>
          </div>
        </AnalysisChartCard>
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
              <template #default="{ row }">
                {{ row.referenceLabel }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="更新时间" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.createdAt) }}
              </template>
            </ElTableColumn>
            <template #empty>
              <ElEmpty description="暂无动态" />
            </template>
          </ElTable>
        </ElCard>

        <ElCard shadow="never">
          <template #header>待补齐清单</template>
          <ElTable v-loading="loading" :data="dashboard?.pendingVariants || []" stripe>
            <ElTableColumn label="型号" min-width="160" prop="model" />
            <ElTableColumn label="系列" min-width="180" prop="seriesName" />
            <ElTableColumn label="分类" min-width="120" prop="category" />
            <ElTableColumn label="缺失项" min-width="220">
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
            <ElTableColumn label="最近更新" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.updatedAt) }}
              </template>
            </ElTableColumn>
            <template #empty>
              <ElEmpty description="暂无待补齐型号" />
            </template>
          </ElTable>
        </ElCard>
      </div>
    </template>
  </Page>
</template>
