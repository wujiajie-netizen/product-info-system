<script lang="ts" setup>
import type { QuoteStatus, QuoteWithRelations } from '@/api';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  ElButton,
  ElCard,
  ElEmpty,
  ElInput,
  ElMessage,
  ElOption,
  ElPopconfirm,
  ElSelect,
  ElSpace,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { listQuotes, setQuoteStatus } from '@/api';

interface QuoteBatchRow {
  batchId: string;
  batchTitle: string;
  companyName: string;
  currency: string;
  effectiveFrom?: null | string;
  latestUpdatedAt: string;
  lineCount: number;
  optionCount: number;
  publishedAt?: null | string;
  quoteLines: QuoteWithRelations[];
  status: QuoteStatus | string;
  tierSummary: string;
}

const quoteStatusOptions: Array<{ label: string; value: QuoteStatus }> = [
  { label: '启用', value: 'active' },
  { label: '草稿', value: 'draft' },
  { label: '已过期', value: 'expired' },
  { label: '已归档', value: 'archived' },
];

const router = useRouter();
const userStore = useUserStore();
const isAdmin = computed(() => userStore.userRoles.includes('admin'));

const loading = ref(false);
const keyword = ref('');
const statusFilter = ref<'' | QuoteStatus>('');
const quotes = ref<QuoteWithRelations[]>([]);

const batchRows = computed(() => {
  const map = new Map<string, QuoteWithRelations[]>();
  for (const quote of quotes.value) {
    const batchId = quote.batch_id || quote.id;
    map.set(batchId, [...(map.get(batchId) || []), quote]);
  }

  const rows = [...map.entries()].map(([batchId, quoteLines]) => {
    const first = quoteLines[0]!;
    const optionIds = new Set(
      quoteLines.flatMap((line) =>
        (line.quote_options || []).map((option) => option.id),
      ),
    );
    const tiers = quoteLines.flatMap((line) => line.quote_tiers || []);
    const minTier = tiers
      .toSorted((left, right) => left.min_quantity - right.min_quantity)
      .at(0);
    const latestUpdatedAt = quoteLines
      .map((line) => line.updated_at)
      .toSorted()
      .at(-1) || first.updated_at;

    return {
      batchId,
      batchTitle: first.batch_title || first.quote_no || '未命名报价批次',
      companyName: first.company?.name || '-',
      currency: first.currency,
      effectiveFrom: first.effective_from || first.valid_from,
      latestUpdatedAt,
      lineCount: quoteLines.length,
      optionCount: optionIds.size,
      publishedAt: first.published_at,
      quoteLines,
      status: first.status,
      tierSummary: minTier
        ? `${minTier.min_quantity}+ / ${minTier.currency} ${minTier.unit_price}`
        : '-',
    } satisfies QuoteBatchRow;
  });

  const normalizedKeyword = keyword.value.trim().toLowerCase();
  return rows
    .filter((row) => {
      if (statusFilter.value && row.status !== statusFilter.value) return false;
      if (!normalizedKeyword) return true;
      return [
        row.batchTitle,
        row.companyName,
        row.currency,
        ...row.quoteLines.flatMap((line) => [
          line.product?.model,
          line.product?.name,
          line.remarks,
        ]),
      ].some((value) => value?.toLowerCase().includes(normalizedKeyword));
    })
    .toSorted((left, right) =>
      right.latestUpdatedAt.localeCompare(left.latestUpdatedAt),
    );
});

function quoteStatusLabel(status: string) {
  return (
    quoteStatusOptions.find((option) => option.value === status)?.label ||
    status
  );
}

function quoteStatusTagType(status: string) {
  if (status === 'active') return 'success';
  if (status === 'archived') return 'info';
  if (status === 'expired') return 'danger';
  return 'warning';
}

function formatDate(value?: null | string) {
  return value ? new Date(value).toLocaleDateString() : '-';
}

async function loadQuotes() {
  try {
    loading.value = true;
    quotes.value = await listQuotes();
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    loading.value = false;
  }
}

function openCreatePage() {
  router.push({ name: 'AdminQuoteCreate' });
}

function openDetailPage(row: QuoteBatchRow) {
  router.push({ name: 'AdminQuoteDetail', params: { batchId: row.batchId } });
}

async function handleStatusChange(row: QuoteBatchRow) {
  const firstLine = row.quoteLines[0];
  if (!firstLine) return;
  const nextStatus: QuoteStatus =
    row.status === 'archived' ? 'active' : 'archived';

  try {
    await setQuoteStatus(firstLine.id, nextStatus);
    ElMessage.success(nextStatus === 'active' ? '报价已启用' : '报价已归档');
    await loadQuotes();
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
}

onMounted(loadQuotes);
</script>

<template>
  <Page
    description="按报价批次集中维护基础信息、报价行、阶梯价、选配项和附件"
    title="报价管理"
  >
    <ElCard shadow="never">
      <ElSpace class="mb-4" wrap>
        <ElInput
          v-model="keyword"
          clearable
          placeholder="搜索批次、商品、公司、备注"
          style="width: 320px"
        />
        <ElSelect
          v-model="statusFilter"
          clearable
          placeholder="报价状态"
          style="width: 160px"
        >
          <ElOption
            v-for="option in quoteStatusOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
        <ElButton @click="loadQuotes">查询</ElButton>
        <ElButton v-if="isAdmin" type="primary" @click="openCreatePage">
          新增报价
        </ElButton>
      </ElSpace>

      <ElTable v-loading="loading" :data="batchRows" stripe>
        <ElTableColumn label="报价批次" min-width="240">
          <template #default="{ row }">
            <ElButton link type="primary" @click="openDetailPage(row)">
              {{ row.batchTitle }}
            </ElButton>
          </template>
        </ElTableColumn>
        <ElTableColumn label="公司" min-width="180" prop="companyName" />
        <ElTableColumn label="报价行" width="100">
          <template #default="{ row }">{{ row.lineCount }} 行</template>
        </ElTableColumn>
        <ElTableColumn label="选配项" width="100">
          <template #default="{ row }">{{ row.optionCount }} 项</template>
        </ElTableColumn>
        <ElTableColumn label="起始阶梯价" min-width="180" prop="tierSummary" />
        <ElTableColumn label="发布时间" width="130">
          <template #default="{ row }">{{ formatDate(row.publishedAt) }}</template>
        </ElTableColumn>
        <ElTableColumn label="生效日期" width="130">
          <template #default="{ row }">{{ formatDate(row.effectiveFrom) }}</template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="110">
          <template #default="{ row }">
            <ElTag :type="quoteStatusTagType(row.status)">
              {{ quoteStatusLabel(row.status) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="更新时间" width="130">
          <template #default="{ row }">{{ formatDate(row.latestUpdatedAt) }}</template>
        </ElTableColumn>
        <ElTableColumn v-if="isAdmin" fixed="right" label="操作" width="170">
          <template #default="{ row }">
            <ElButton link type="primary" @click="openDetailPage(row)">
              详情
            </ElButton>
            <ElPopconfirm
              :title="
                row.status === 'archived'
                  ? '确认启用该报价？'
                  : '确认归档该报价？'
              "
              @confirm="handleStatusChange(row)"
            >
              <template #reference>
                <ElButton link type="primary">
                  {{ row.status === 'archived' ? '启用' : '归档' }}
                </ElButton>
              </template>
            </ElPopconfirm>
          </template>
        </ElTableColumn>
        <template #empty>
          <ElEmpty description="暂无报价批次" />
        </template>
      </ElTable>
    </ElCard>
  </Page>
</template>
