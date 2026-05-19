<script lang="ts" setup>
import type {
  QuoteOptionDeltaType,
  QuoteOptionRecord,
  QuoteOptionScopeType,
  QuoteOptionType,
  QuoteWithRelations,
  SaveQuoteOptionInput,
} from '#/api';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  ElButton,
  ElCard,
  ElDialog,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElPopconfirm,
  ElSelect,
  ElSpace,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  createQuoteOption,
  deleteQuoteOption,
  listQuoteOptionsForAdmin,
  listQuotes,
  updateQuoteOption,
} from '#/api';

const userStore = useUserStore();
const isAdmin = computed(() => userStore.userRoles.includes('admin'));

const loading = ref(false);
const saving = ref(false);
const keyword = ref('');
const options = ref<QuoteOptionRecord[]>([]);
const quotes = ref<QuoteWithRelations[]>([]);
const dialogVisible = ref(false);
const editingOption = ref<QuoteOptionRecord>();

const dialogTitle = computed(() => (editingOption.value ? '编辑报价选配项' : '新增报价选配项'));

const form = reactive({
  currency: 'USD',
  deltaType: 'increase' as QuoteOptionDeltaType,
  description: '',
  optionName: '',
  optionType: 'accessory' as QuoteOptionType,
  priceDelta: undefined as number | undefined,
  quoteBatchId: '',
  quoteLineId: '',
  scopeType: 'line' as QuoteOptionScopeType,
  sortOrder: 0,
});

const batchOptions = computed(() => {
  const map = new Map<string, string>();
  for (const quote of quotes.value) {
    if (quote.batch_id) {
      map.set(quote.batch_id, quote.batch_title || quote.quote_no || quote.batch_id);
    }
  }
  return [...map.entries()].map(([id, title]) => ({ id, title }));
});

function resetForm() {
  editingOption.value = undefined;
  form.currency = 'USD';
  form.deltaType = 'increase';
  form.description = '';
  form.optionName = '';
  form.optionType = 'accessory';
  form.priceDelta = undefined;
  form.quoteBatchId = '';
  form.quoteLineId = '';
  form.scopeType = 'line';
  form.sortOrder = 0;
}

function openCreateDialog() {
  resetForm();
  dialogVisible.value = true;
}

function openEditDialog(row: QuoteOptionRecord) {
  editingOption.value = row;
  form.currency = row.currency || 'USD';
  form.deltaType = row.delta_type as QuoteOptionDeltaType;
  form.description = row.description || '';
  form.optionName = row.option_name;
  form.optionType = row.option_type as QuoteOptionType;
  form.priceDelta = row.price_delta ?? undefined;
  form.quoteBatchId = row.quote_batch_id || '';
  form.quoteLineId = row.quote_line_id || '';
  form.scopeType = row.scope_type as QuoteOptionScopeType;
  form.sortOrder = row.sort_order || 0;
  dialogVisible.value = true;
}

function buildInput(): SaveQuoteOptionInput {
  if (!form.optionName.trim()) throw new Error('请填写选配项名称');
  if (form.scopeType === 'batch' && !form.quoteBatchId) throw new Error('请选择报价批次');
  if (form.scopeType === 'line' && !form.quoteLineId) throw new Error('请选择报价行');
  return {
    currency: form.deltaType === 'text_only' ? undefined : form.currency,
    deltaType: form.deltaType,
    description: form.description,
    optionName: form.optionName,
    optionType: form.optionType,
    priceDelta: form.priceDelta,
    quoteBatchId: form.quoteBatchId || undefined,
    quoteLineId: form.quoteLineId || undefined,
    scopeType: form.scopeType,
    sortOrder: form.sortOrder,
  };
}

async function loadData() {
  try {
    loading.value = true;
    const [optionRecords, quoteRecords] = await Promise.all([
      listQuoteOptionsForAdmin({ keyword: keyword.value }),
      listQuotes(),
    ]);
    options.value = optionRecords;
    quotes.value = quoteRecords;
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    loading.value = false;
  }
}

async function submitOption() {
  try {
    saving.value = true;
    const input = buildInput();
    if (editingOption.value) {
      await updateQuoteOption(editingOption.value.id, input);
      ElMessage.success('选配项已更新');
    } else {
      await createQuoteOption(input);
      ElMessage.success('选配项已新增');
    }
    dialogVisible.value = false;
    await loadData();
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row: QuoteOptionRecord) {
  try {
    await deleteQuoteOption(row.id);
    ElMessage.success('选配项已删除');
    await loadData();
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
}

function scopeLabel(scope: string) {
  return scope === 'batch' ? '批次级' : '报价行级';
}

function typeLabel(type: string) {
  return {
    accessory: '配件',
    firmware: '固件包',
    material_change: '材料差价',
    other: '其他',
  }[type] || type;
}

function deltaLabel(type: string) {
  return {
    decrease: '减价',
    increase: '加价',
    text_only: '仅说明',
  }[type] || type;
}

function quoteLineLabel(id: string) {
  const quote = quotes.value.find((item) => item.id === id);
  return quote ? `${quote.product_model || quote.product?.model || '-'} / ${quote.batch_title || quote.quote_no || '-'}` : id;
}

function batchLabel(id: string) {
  return batchOptions.value.find((item) => item.id === id)?.title || id;
}

onMounted(loadData);
</script>

<template>
  <Page description="维护报价批次或报价行上的配件、固件包、材料差价和文本说明" title="报价选配项管理">
    <ElCard shadow="never">
      <ElSpace class="mb-4" wrap>
        <ElInput v-model="keyword" clearable placeholder="搜索选配项名称或说明" style="width: 320px" @clear="loadData" @keyup.enter="loadData" />
        <ElButton @click="loadData">查询</ElButton>
        <ElButton v-if="isAdmin" type="primary" @click="openCreateDialog">新增选配项</ElButton>
      </ElSpace>

      <ElTable v-loading="loading" :data="options" stripe>
        <ElTableColumn label="选配项" min-width="180" prop="option_name" />
        <ElTableColumn label="类型" width="120"><template #default="{ row }">{{ typeLabel(row.option_type) }}</template></ElTableColumn>
        <ElTableColumn label="范围" width="120"><template #default="{ row }"><ElTag>{{ scopeLabel(row.scope_type) }}</ElTag></template></ElTableColumn>
        <ElTableColumn label="关联对象" min-width="260">
          <template #default="{ row }">{{ row.scope_type === 'batch' ? batchLabel(row.quote_batch_id) : quoteLineLabel(row.quote_line_id) }}</template>
        </ElTableColumn>
        <ElTableColumn label="价格类型" width="120"><template #default="{ row }">{{ deltaLabel(row.delta_type) }}</template></ElTableColumn>
        <ElTableColumn label="差价" width="130"><template #default="{ row }">{{ row.price_delta ?? '-' }} {{ row.currency || '' }}</template></ElTableColumn>
        <ElTableColumn label="说明" min-width="220" prop="description" />
        <ElTableColumn v-if="isAdmin" fixed="right" label="操作" width="130">
          <template #default="{ row }">
            <ElButton link type="primary" @click="openEditDialog(row)">编辑</ElButton>
            <ElPopconfirm title="确认删除该选配项？" @confirm="handleDelete(row)">
              <template #reference><ElButton link type="danger">删除</ElButton></template>
            </ElPopconfirm>
          </template>
        </ElTableColumn>
        <template #empty><ElEmpty description="暂无报价选配项" /></template>
      </ElTable>
    </ElCard>

    <ElDialog v-model="dialogVisible" :title="dialogTitle" width="640px" @closed="resetForm">
      <ElForm label-width="96px">
        <ElFormItem label="选配名称"><ElInput v-model="form.optionName" /></ElFormItem>
        <ElFormItem label="选配类型">
          <ElSelect v-model="form.optionType" style="width: 100%">
            <ElOption label="配件" value="accessory" />
            <ElOption label="固件包" value="firmware" />
            <ElOption label="材料差价" value="material_change" />
            <ElOption label="其他" value="other" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="作用范围">
          <ElSelect v-model="form.scopeType" style="width: 100%">
            <ElOption label="批次级" value="batch" />
            <ElOption label="报价行级" value="line" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem v-if="form.scopeType === 'batch'" label="报价批次">
          <ElSelect v-model="form.quoteBatchId" filterable style="width: 100%">
            <ElOption v-for="batch in batchOptions" :key="batch.id" :label="batch.title" :value="batch.id" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem v-else label="报价行">
          <ElSelect v-model="form.quoteLineId" filterable style="width: 100%">
            <ElOption v-for="quote in quotes" :key="quote.id" :label="quoteLineLabel(quote.id)" :value="quote.id" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="价格类型">
          <ElSelect v-model="form.deltaType" style="width: 100%">
            <ElOption label="加价" value="increase" />
            <ElOption label="减价" value="decrease" />
            <ElOption label="仅文本说明" value="text_only" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem v-if="form.deltaType !== 'text_only'" label="差价">
          <ElSpace>
            <ElInputNumber v-model="form.priceDelta" :precision="4" />
            <ElSelect v-model="form.currency" style="width: 100px"><ElOption label="USD" value="USD" /><ElOption label="CNY" value="CNY" /><ElOption label="EUR" value="EUR" /></ElSelect>
          </ElSpace>
        </ElFormItem>
        <ElFormItem label="排序"><ElInputNumber v-model="form.sortOrder" :min="0" /></ElFormItem>
        <ElFormItem label="说明"><ElInput v-model="form.description" :rows="3" type="textarea" /></ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton :loading="saving" type="primary" @click="submitOption">保存</ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
