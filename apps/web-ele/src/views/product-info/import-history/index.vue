<script lang="ts" setup>
import type { ImportHistoryRecord, ImportHistoryRowRecord } from '#/api';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElCard,
  ElDialog,
  ElEmpty,
  ElInput,
  ElMessage,
  ElSpace,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { listImportHistories, listImportHistoryRows } from '#/api';

const loading = ref(false);
const rowLoading = ref(false);
const keyword = ref('');
const histories = ref<ImportHistoryRecord[]>([]);
const rows = ref<ImportHistoryRowRecord[]>([]);
const rowDialogVisible = ref(false);
const currentHistory = ref<ImportHistoryRecord>();

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function statusType(status: string) {
  if (status === 'success') return 'success';
  if (status === 'partial_success') return 'warning';
  if (status === 'failed') return 'danger';
  return 'info';
}

function statusLabel(status: string) {
  return {
    draft: '草稿',
    failed: '失败',
    partial_success: '部分成功',
    success: '成功',
  }[status] || status;
}

function rowStatusType(status: string) {
  if (status === 'success') return 'success';
  if (status === 'warning') return 'warning';
  if (status === 'failed') return 'danger';
  return 'info';
}

function actionLabel(action: string) {
  return {
    create: '新建商品',
    failed: '失败',
    quote_only: '只新增报价',
    skip: '跳过',
    update: '更新商品',
  }[action] || action;
}

async function loadHistories() {
  try {
    loading.value = true;
    histories.value = await listImportHistories({ keyword: keyword.value });
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    loading.value = false;
  }
}

async function openRows(row: ImportHistoryRecord) {
  try {
    rowLoading.value = true;
    currentHistory.value = row;
    rows.value = await listImportHistoryRows(row.id);
    rowDialogVisible.value = true;
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    rowLoading.value = false;
  }
}

function downloadFailureLog(row: ImportHistoryRecord) {
  const data = rows.value.length ? rows.value : [];
  const targetRows = data.filter((item) => item.status === 'failed' || item.status === 'warning');
  const lines = [
    ['型号', '动作', '状态', '错误', '警告'],
    ...targetRows.map((item) => [
      item.model_code || '',
      actionLabel(item.action),
      item.status,
      item.error_message || '',
      item.warning_message || '',
    ]),
  ];
  const csv = `\uFEFF${lines.map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${row.file_name}-失败日志.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

onMounted(loadHistories);
</script>

<template>
  <Page description="追踪每次 Excel 导入结果、失败原因和创建对象" title="导入历史与失败日志">
    <ElCard shadow="never">
      <ElSpace class="mb-4" wrap>
        <ElInput v-model="keyword" clearable placeholder="搜索文件名" style="width: 320px" @clear="loadHistories" @keyup.enter="loadHistories" />
        <ElButton @click="loadHistories">查询</ElButton>
      </ElSpace>

      <ElTable v-loading="loading" :data="histories" stripe>
        <ElTableColumn label="导入文件" min-width="220" prop="file_name" />
        <ElTableColumn label="状态" width="120">
          <template #default="{ row }">
            <ElTag :type="statusType(row.status)">{{ statusLabel(row.status) }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="总行数" prop="total_rows" width="90" />
        <ElTableColumn label="新增商品" prop="new_product_count" width="100" />
        <ElTableColumn label="更新商品" prop="update_product_count" width="100" />
        <ElTableColumn label="只增报价" prop="quote_only_count" width="100" />
        <ElTableColumn label="新增报价" prop="new_quote_count" width="100" />
        <ElTableColumn label="失败行" prop="failed_row_count" width="90" />
        <ElTableColumn label="跳过行" prop="skipped_row_count" width="90" />
        <ElTableColumn label="导入时间" width="180">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </ElTableColumn>
        <ElTableColumn fixed="right" label="操作" width="170">
          <template #default="{ row }">
            <ElButton link type="primary" @click="openRows(row)">查看明细</ElButton>
          </template>
        </ElTableColumn>
        <template #empty><ElEmpty description="暂无导入历史" /></template>
      </ElTable>
    </ElCard>

    <ElDialog v-model="rowDialogVisible" :title="`导入明细：${currentHistory?.file_name || ''}`" width="1080px">
      <ElSpace class="mb-3" wrap>
        <ElButton :disabled="!rows.length || !currentHistory" @click="currentHistory && downloadFailureLog(currentHistory)">下载失败日志</ElButton>
      </ElSpace>
      <ElTable v-loading="rowLoading" :data="rows" max-height="520" stripe>
        <ElTableColumn label="行号" prop="row_index" width="80" />
        <ElTableColumn label="型号" prop="model_code" min-width="140" />
        <ElTableColumn label="动作" min-width="120">
          <template #default="{ row }">{{ actionLabel(row.action) }}</template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="100">
          <template #default="{ row }"><ElTag :type="rowStatusType(row.status)">{{ row.status }}</ElTag></template>
        </ElTableColumn>
        <ElTableColumn label="商品ID" prop="variant_id" min-width="220" />
        <ElTableColumn label="报价行ID" prop="quote_line_id" min-width="220" />
        <ElTableColumn label="失败原因" prop="error_message" min-width="220" />
        <ElTableColumn label="警告" prop="warning_message" min-width="220" />
        <template #empty><ElEmpty description="暂无逐行日志" /></template>
      </ElTable>
    </ElDialog>
  </Page>
</template>
