<script lang="ts" setup>
import type {
  CompanyRecord,
  DocumentRecord,
  ProductRecord,
  QuoteBatchRecord,
  QuoteLineStatus,
  QuoteOptionDeltaType,
  QuoteOptionRecord,
  QuoteOptionScopeType,
  QuoteOptionType,
  QuoteStatus,
  QuoteWithRelations,
  SaveQuoteOptionInput,
  SaveQuoteTierInput,
} from '@/api';

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElCard,
  ElDatePicker,
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
  ElTabPane,
  ElTable,
  ElTableColumn,
  ElTabs,
  ElTag,
} from 'element-plus';

import {
  attachQuoteBatchDocument,
  createDocumentSignedUrl,
  createQuote,
  createQuoteLine,
  createQuoteOption,
  deleteQuote,
  deleteQuoteOption,
  detachQuoteBatchDocument,
  listCompanies,
  listDocuments,
  listProducts,
  listQuoteBatches,
  listQuotes,
  updateQuoteBatch,
  updateQuoteLine,
  updateQuoteOption,
} from '@/api';

type EditableTier = {
  minQuantity?: number;
  unitPrice?: number;
};

const quoteStatusOptions: Array<{ label: string; value: QuoteStatus }> = [
  { label: '启用', value: 'active' },
  { label: '草稿', value: 'draft' },
  { label: '已过期', value: 'expired' },
  { label: '已归档', value: 'archived' },
];

const quoteLineStatusOptions: Array<{ label: string; value: QuoteLineStatus }> = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' },
];

const currencyOptions = ['CNY', 'USD', 'EUR', 'JPY', 'HKD'];

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const isAdmin = computed(() => userStore.userRoles.includes('admin'));
const isCreateMode = computed(() => route.name === 'AdminQuoteCreate');
const batchId = computed(() => route.params.batchId as string | undefined);

const activeTab = ref('lines');
const loading = ref(false);
const saving = ref(false);
const dialogSaving = ref(false);
const lineDialogVisible = ref(false);
const optionDialogVisible = ref(false);
const attachedDocumentId = ref('');

const products = ref<ProductRecord[]>([]);
const companies = ref<CompanyRecord[]>([]);
const allQuoteDocuments = ref<DocumentRecord[]>([]);
const batchDocuments = ref<DocumentRecord[]>([]);
const quoteLines = ref<QuoteWithRelations[]>([]);
const batchRecord = ref<QuoteBatchRecord>();
const editingLine = ref<QuoteWithRelations>();
const editingOption = ref<QuoteOptionRecord>();

const batchForm = reactive({
  batchTitle: '',
  companyId: '',
  currency: 'CNY',
  effectiveFrom: '',
  globalNote: '',
  publishedAt: '',
  status: 'active' as QuoteStatus,
});

const lineForm = reactive({
  firmwareNote: '',
  productId: '',
  remarks: '',
  standardConfigText: '',
  status: 'active' as QuoteLineStatus,
  tiers: [{ minQuantity: 1, unitPrice: undefined }] as EditableTier[],
});

const optionForm = reactive({
  currency: 'USD',
  deltaType: 'increase' as QuoteOptionDeltaType,
  description: '',
  optionName: '',
  optionType: 'accessory' as QuoteOptionType,
  priceDelta: undefined as number | undefined,
  quoteLineId: '',
  scopeType: 'line' as QuoteOptionScopeType,
  sortOrder: 0,
});

const pageTitle = computed(() =>
  isCreateMode.value ? '新建报价' : batchForm.batchTitle || '报价详情',
);

const quoteOptions = computed(() => {
  const map = new Map<string, QuoteOptionRecord>();
  for (const line of quoteLines.value) {
    for (const option of line.quote_options || []) {
      map.set(option.id, option);
    }
  }
  return [...map.values()].toSorted((left, right) => left.sort_order - right.sort_order);
});

const pageSummary = computed(() => ({
  documents: batchDocuments.value.length,
  lines: quoteLines.value.length,
  options: quoteOptions.value.length,
  tiers: quoteLines.value.reduce(
    (total, line) => total + (line.quote_tiers?.length || 0),
    0,
  ),
}));

const attachableQuoteDocuments = computed(() =>
  allQuoteDocuments.value.filter(
    (document) =>
      !document.quote_batch_id || document.quote_batch_id === batchId.value,
  ),
);

function resetBatchForm() {
  batchRecord.value = undefined;
  batchForm.batchTitle = '';
  batchForm.companyId = '';
  batchForm.currency = 'CNY';
  batchForm.effectiveFrom = '';
  batchForm.globalNote = '';
  batchForm.publishedAt = '';
  batchForm.status = 'active';
}

function resetLineForm() {
  editingLine.value = undefined;
  lineForm.firmwareNote = '';
  lineForm.productId = '';
  lineForm.remarks = '';
  lineForm.standardConfigText = '';
  lineForm.status = 'active';
  lineForm.tiers = [{ minQuantity: 1, unitPrice: undefined }];
}

function resetOptionForm() {
  editingOption.value = undefined;
  optionForm.currency = batchForm.currency || 'USD';
  optionForm.deltaType = 'increase';
  optionForm.description = '';
  optionForm.optionName = '';
  optionForm.optionType = 'accessory';
  optionForm.priceDelta = undefined;
  optionForm.quoteLineId = quoteLines.value[0]?.id || '';
  optionForm.scopeType = quoteLines.value.length ? 'line' : 'batch';
  optionForm.sortOrder = 0;
}

function fillBatchForm(batch: QuoteBatchRecord, firstLine?: QuoteWithRelations) {
  batchRecord.value = batch;
  batchForm.batchTitle = batch.batch_title || firstLine?.batch_title || '';
  batchForm.companyId = batch.company_id || firstLine?.company_id || '';
  batchForm.currency = batch.currency || firstLine?.currency || 'CNY';
  batchForm.effectiveFrom = batch.effective_from || firstLine?.valid_from || '';
  batchForm.globalNote = batch.global_note || firstLine?.remarks || '';
  batchForm.publishedAt = batch.published_at || firstLine?.published_at || '';
  batchForm.status = quoteStatusOptions.some((option) => option.value === batch.status)
    ? (batch.status as QuoteStatus)
    : 'active';
}

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

function formatTiers(row: QuoteWithRelations) {
  if (!row.quote_tiers?.length) return '-';
  return row.quote_tiers
    .toSorted((left, right) => left.min_quantity - right.min_quantity)
    .map((tier) => `${tier.min_quantity}+ / ${tier.currency} ${tier.unit_price}`)
    .join(' | ');
}

function quoteLineLabel(id: string) {
  const quote = quoteLines.value.find((item) => item.id === id);
  if (!quote) return id;
  return `${quote.product_model || quote.product?.model || '-'} / ${quote.product?.name || '-'}`;
}

function optionScopeLabel(row: QuoteOptionRecord) {
  if (row.scope_type === 'batch') return '批次级';
  return '报价行级';
}

function optionTargetLabel(row: QuoteOptionRecord) {
  return row.scope_type === 'batch'
    ? batchForm.batchTitle || '当前批次'
    : quoteLineLabel(row.quote_line_id || '');
}

function optionTypeLabel(type: string) {
  return {
    accessory: '配件',
    firmware: '固件包',
    material_change: '材料差价',
    other: '其他',
  }[type] || type;
}

function optionDeltaLabel(type: string) {
  return {
    decrease: '减价',
    increase: '加价',
    text_only: '仅说明',
  }[type] || type;
}

async function loadOptions() {
  const [productRecords, companyRecords, quoteDocumentRecords] = await Promise.all([
    listProducts(),
    listCompanies(),
    listDocuments({ fileType: 'quote' }),
  ]);
  products.value = productRecords;
  companies.value = companyRecords;
  allQuoteDocuments.value = quoteDocumentRecords;
}

async function loadData() {
  resetLineForm();
  resetOptionForm();
  quoteLines.value = [];
  batchDocuments.value = [];
  attachedDocumentId.value = '';

  if (isCreateMode.value) {
    resetBatchForm();
    return;
  }

  if (!batchId.value) return;

  try {
    loading.value = true;
    const [quotes, batches, documents] = await Promise.all([
      listQuotes(),
      listQuoteBatches(),
      listDocuments({ quoteBatchId: batchId.value }),
    ]);
    quoteLines.value = quotes.filter((quote) => quote.batch_id === batchId.value);
    batchDocuments.value = documents;
    attachedDocumentId.value = documents[0]?.id || '';

    const batch = batches.find((item) => item.id === batchId.value);
    if (batch) {
      fillBatchForm(batch, quoteLines.value[0]);
    } else if (quoteLines.value[0]) {
      fillBatchForm(
        {
          batch_title: quoteLines.value[0].batch_title || '',
          company_id: quoteLines.value[0].company_id,
          created_at: quoteLines.value[0].created_at,
          created_by: quoteLines.value[0].created_by,
          currency: quoteLines.value[0].currency,
          effective_from: quoteLines.value[0].effective_from || quoteLines.value[0].valid_from,
          entry_mode: 'manual',
          global_note: quoteLines.value[0].remarks,
          id: batchId.value,
          published_at: quoteLines.value[0].published_at || null,
          source_document_id: null,
          status: quoteLines.value[0].status,
          updated_at: quoteLines.value[0].updated_at,
        },
        quoteLines.value[0],
      );
    } else {
      ElMessage.warning('报价批次不存在或已被删除');
      router.push({ name: 'AdminQuotes' });
    }
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    loading.value = false;
  }
}

function buildTiers(): SaveQuoteTierInput[] {
  return lineForm.tiers
    .filter(
      (tier) =>
        typeof tier.minQuantity === 'number' &&
        typeof tier.unitPrice === 'number',
    )
    .map((tier) => ({
      currency: batchForm.currency,
      minQuantity: tier.minQuantity as number,
      unitPrice: tier.unitPrice as number,
    }))
    .toSorted((left, right) => left.minQuantity - right.minQuantity);
}

function validateBatchForm() {
  if (!batchForm.batchTitle.trim()) throw new Error('请填写报价批次标题');
  if (!batchForm.companyId) throw new Error('请选择公司');
}

function validateLineForm() {
  if (!lineForm.productId) throw new Error('请选择商品');
  if (buildTiers().length === 0) throw new Error('请至少填写一条有效阶梯价');
}

async function saveBatch() {
  try {
    saving.value = true;
    validateBatchForm();

    if (isCreateMode.value) {
      validateLineForm();
      const savedQuote = await createQuote({
        batchTitle: batchForm.batchTitle,
        companyId: batchForm.companyId,
        currency: batchForm.currency,
        firmwareNote: lineForm.firmwareNote,
        productId: lineForm.productId,
        publishedAt: batchForm.publishedAt,
        remarks: lineForm.remarks || batchForm.globalNote,
        standardConfigText: lineForm.standardConfigText,
        status: batchForm.status,
        tiers: buildTiers(),
        validFrom: batchForm.effectiveFrom,
      });
      ElMessage.success('报价已创建');
      await router.replace({
        name: 'AdminQuoteDetail',
        params: { batchId: savedQuote.batch_id },
      });
      return;
    }

    await updateQuoteBatch(batchId.value!, {
      batchTitle: batchForm.batchTitle,
      companyId: batchForm.companyId,
      currency: batchForm.currency,
      effectiveFrom: batchForm.effectiveFrom,
      globalNote: batchForm.globalNote,
      publishedAt: batchForm.publishedAt,
      status: batchForm.status,
    });
    ElMessage.success('报价批次已保存');
    await loadData();
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    saving.value = false;
  }
}

function addTier() {
  lineForm.tiers.push({
    minQuantity: (lineForm.tiers.at(-1)?.minQuantity || 0) + 50 || 1,
    unitPrice: undefined,
  });
}

function removeTier(index: number) {
  if (lineForm.tiers.length === 1) {
    lineForm.tiers[0] = { minQuantity: 1, unitPrice: undefined };
    return;
  }
  lineForm.tiers.splice(index, 1);
}

function openCreateLineDialog() {
  resetLineForm();
  lineDialogVisible.value = true;
}

function openEditLineDialog(row: QuoteWithRelations) {
  editingLine.value = row;
  lineForm.firmwareNote = row.firmware_note || '';
  lineForm.productId = row.product_id;
  lineForm.remarks = row.remarks || '';
  lineForm.standardConfigText = row.standard_config_text || '';
  lineForm.status = row.line_status === 'inactive' ? 'inactive' : 'active';
  lineForm.tiers = row.quote_tiers?.length
    ? row.quote_tiers.map((tier) => ({
        minQuantity: tier.min_quantity,
        unitPrice: tier.unit_price,
      }))
    : [{ minQuantity: row.min_order_quantity || 1, unitPrice: row.unit_price || undefined }];
  lineDialogVisible.value = true;
}

async function submitLine() {
  if (!batchId.value) return;

  try {
    dialogSaving.value = true;
    validateLineForm();
    const input = {
      batchId: batchId.value,
      firmwareNote: lineForm.firmwareNote,
      productId: lineForm.productId,
      remarks: lineForm.remarks,
      standardConfigText: lineForm.standardConfigText,
      status: lineForm.status,
      tiers: buildTiers(),
    };

    if (editingLine.value) {
      await updateQuoteLine(editingLine.value.id, input);
      ElMessage.success('报价行已更新');
    } else {
      await createQuoteLine(input);
      ElMessage.success('报价行已新增');
    }

    lineDialogVisible.value = false;
    await loadData();
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    dialogSaving.value = false;
  }
}

async function handleDeleteLine(row: QuoteWithRelations) {
  try {
    await deleteQuote(row.id);
    ElMessage.success('报价行已删除');
    if (quoteLines.value.length <= 1) {
      await router.push({ name: 'AdminQuotes' });
      return;
    }
    await loadData();
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
}

function openCreateOptionDialog() {
  resetOptionForm();
  optionDialogVisible.value = true;
}

function openEditOptionDialog(row: QuoteOptionRecord) {
  editingOption.value = row;
  optionForm.currency = row.currency || batchForm.currency || 'USD';
  optionForm.deltaType = row.delta_type as QuoteOptionDeltaType;
  optionForm.description = row.description || '';
  optionForm.optionName = row.option_name;
  optionForm.optionType = row.option_type as QuoteOptionType;
  optionForm.priceDelta = row.price_delta ?? undefined;
  optionForm.quoteLineId = row.quote_line_id || '';
  optionForm.scopeType = row.scope_type as QuoteOptionScopeType;
  optionForm.sortOrder = row.sort_order || 0;
  optionDialogVisible.value = true;
}

function buildOptionInput(): SaveQuoteOptionInput {
  if (!batchId.value) throw new Error('请先保存报价批次');
  if (!optionForm.optionName.trim()) throw new Error('请填写选配项名称');
  if (optionForm.scopeType === 'line' && !optionForm.quoteLineId) {
    throw new Error('请选择报价行');
  }

  return {
    currency: optionForm.deltaType === 'text_only' ? undefined : optionForm.currency,
    deltaType: optionForm.deltaType,
    description: optionForm.description,
    optionName: optionForm.optionName,
    optionType: optionForm.optionType,
    priceDelta: optionForm.priceDelta,
    quoteBatchId: optionForm.scopeType === 'batch' ? batchId.value : undefined,
    quoteLineId: optionForm.scopeType === 'line' ? optionForm.quoteLineId : undefined,
    scopeType: optionForm.scopeType,
    sortOrder: optionForm.sortOrder,
  };
}

async function submitOption() {
  try {
    dialogSaving.value = true;
    const input = buildOptionInput();
    if (editingOption.value) {
      await updateQuoteOption(editingOption.value.id, input);
      ElMessage.success('选配项已更新');
    } else {
      await createQuoteOption(input);
      ElMessage.success('选配项已新增');
    }
    optionDialogVisible.value = false;
    await loadData();
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    dialogSaving.value = false;
  }
}

async function handleDeleteOption(row: QuoteOptionRecord) {
  try {
    await deleteQuoteOption(row.id);
    ElMessage.success('选配项已删除');
    await loadData();
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
}

async function attachDocument() {
  if (!batchId.value || !attachedDocumentId.value) return;
  try {
    await attachQuoteBatchDocument(batchId.value, attachedDocumentId.value);
    ElMessage.success('报价附件已关联');
    await loadData();
    await loadOptions();
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
}

async function detachDocument(row: DocumentRecord) {
  try {
    await detachQuoteBatchDocument(row.id);
    ElMessage.success('报价附件已移除');
    await loadData();
    await loadOptions();
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
}

async function openDocument(row: DocumentRecord) {
  try {
    const url = await createDocumentSignedUrl(row);
    window.open(url, '_blank', 'noopener,noreferrer');
  } catch (error) {
    ElMessage.error((error as Error).message || '打开附件失败');
  }
}

onMounted(async () => {
  await Promise.all([loadOptions(), loadData()]);
});

watch(
  () => route.fullPath,
  async () => {
    await loadData();
  },
);
</script>

<template>
  <Page
    :description="
      isCreateMode
        ? '先录入一个报价批次和首条报价行，保存后继续维护选配项和附件'
        : '在同一个工作区维护批次信息、报价行、阶梯价、选配项和报价附件'
    "
    :title="pageTitle"
  >
    <ElSpace class="mb-4" wrap>
      <ElButton @click="router.push({ name: 'AdminQuotes' })">返回列表</ElButton>
      <ElTag v-if="!isCreateMode" :type="quoteStatusTagType(batchForm.status)">
        {{ quoteStatusLabel(batchForm.status) }}
      </ElTag>
      <ElTag v-if="!isCreateMode">报价行 {{ pageSummary.lines }}</ElTag>
      <ElTag v-if="!isCreateMode">阶梯价 {{ pageSummary.tiers }}</ElTag>
      <ElTag v-if="!isCreateMode">选配项 {{ pageSummary.options }}</ElTag>
      <ElTag v-if="!isCreateMode">附件 {{ pageSummary.documents }}</ElTag>
    </ElSpace>

    <ElCard shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span>批次基础信息</span>
          <ElButton
            v-if="isAdmin"
            :loading="saving"
            type="primary"
            @click="saveBatch"
          >
            {{ isCreateMode ? '创建报价' : '保存批次' }}
          </ElButton>
        </div>
      </template>

      <ElForm label-width="96px">
        <div class="grid gap-4 md:grid-cols-2">
          <ElFormItem label="批次标题">
            <ElInput v-model="batchForm.batchTitle" placeholder="例如 TAB-R10 2026Q2 报价" />
          </ElFormItem>
          <ElFormItem label="公司">
            <ElSelect
              v-model="batchForm.companyId"
              filterable
              placeholder="选择客户或供应商公司"
              style="width: 100%"
            >
              <ElOption
                v-for="company in companies"
                :key="company.id"
                :label="company.name"
                :value="company.id"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="币种">
            <ElSelect v-model="batchForm.currency" filterable style="width: 100%">
              <ElOption
                v-for="currency in currencyOptions"
                :key="currency"
                :label="currency"
                :value="currency"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="状态">
            <ElSelect v-model="batchForm.status" style="width: 100%">
              <ElOption
                v-for="option in quoteStatusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="发布时间">
            <ElDatePicker
              v-model="batchForm.publishedAt"
              placeholder="发布时间"
              type="date"
              value-format="YYYY-MM-DD"
            />
          </ElFormItem>
          <ElFormItem label="生效日期">
            <ElDatePicker
              v-model="batchForm.effectiveFrom"
              placeholder="生效日期"
              type="date"
              value-format="YYYY-MM-DD"
            />
          </ElFormItem>
        </div>
        <ElFormItem label="批次备注">
          <ElInput v-model="batchForm.globalNote" :rows="3" type="textarea" />
        </ElFormItem>
      </ElForm>
    </ElCard>

    <ElCard class="mt-4" shadow="never">
      <ElTabs v-model="activeTab">
        <ElTabPane label="报价行与阶梯价" name="lines">
          <template v-if="isCreateMode">
            <ElAlert
              class="mb-4"
              :closable="false"
              show-icon
              title="创建模式下需要先填写首条报价行，保存后才能维护更多报价行、选配项和附件。"
              type="info"
            />
            <ElForm label-width="96px">
              <ElFormItem label="商品">
                <ElSelect v-model="lineForm.productId" filterable style="width: 100%">
                  <ElOption
                    v-for="product in products"
                    :key="product.id"
                    :label="`${product.model} - ${product.name}`"
                    :value="product.id"
                  />
                </ElSelect>
              </ElFormItem>
              <ElFormItem label="阶梯价">
                <div style="display: grid; gap: 12px; width: 100%">
                  <ElSpace
                    v-for="(tier, index) in lineForm.tiers"
                    :key="index"
                    alignment="start"
                    wrap
                  >
                    <ElInputNumber
                      v-model="tier.minQuantity"
                      :min="1"
                      :precision="0"
                      controls-position="right"
                      placeholder="起订量"
                      style="width: 150px"
                    />
                    <ElInputNumber
                      v-model="tier.unitPrice"
                      :min="0"
                      :precision="2"
                      controls-position="right"
                      placeholder="单价"
                      style="width: 180px"
                    />
                    <ElButton @click="removeTier(index)">删除</ElButton>
                  </ElSpace>
                  <ElButton plain type="primary" @click="addTier">新增阶梯</ElButton>
                </div>
              </ElFormItem>
              <ElFormItem label="标准配置">
                <ElInput v-model="lineForm.standardConfigText" :rows="3" type="textarea" />
              </ElFormItem>
              <ElFormItem label="固件备注">
                <ElInput v-model="lineForm.firmwareNote" />
              </ElFormItem>
              <ElFormItem label="行备注">
                <ElInput v-model="lineForm.remarks" :rows="3" type="textarea" />
              </ElFormItem>
            </ElForm>
          </template>

          <template v-else>
            <ElSpace class="mb-4" wrap>
              <ElButton v-if="isAdmin" type="primary" @click="openCreateLineDialog">
                新增报价行
              </ElButton>
            </ElSpace>
            <ElTable :data="quoteLines" stripe>
              <ElTableColumn label="商品" min-width="240">
                <template #default="{ row }">
                  {{ row.product ? `${row.product.model} - ${row.product.name}` : '-' }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="阶梯价" min-width="280">
                <template #default="{ row }">{{ formatTiers(row) }}</template>
              </ElTableColumn>
              <ElTableColumn label="标准配置" min-width="220" prop="standard_config_text" />
              <ElTableColumn label="固件备注" min-width="180" prop="firmware_note" />
              <ElTableColumn label="状态" width="100">
                <template #default="{ row }">
                  <ElTag :type="row.line_status === 'inactive' ? 'info' : 'success'">
                    {{ row.line_status === 'inactive' ? '停用' : '启用' }}
                  </ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn label="更新时间" width="130">
                <template #default="{ row }">{{ formatDate(row.updated_at) }}</template>
              </ElTableColumn>
              <ElTableColumn v-if="isAdmin" fixed="right" label="操作" width="140">
                <template #default="{ row }">
                  <ElButton link type="primary" @click="openEditLineDialog(row)">
                    编辑
                  </ElButton>
                  <ElPopconfirm title="确认删除该报价行？" @confirm="handleDeleteLine(row)">
                    <template #reference>
                      <ElButton link type="danger">删除</ElButton>
                    </template>
                  </ElPopconfirm>
                </template>
              </ElTableColumn>
              <template #empty>
                <ElEmpty description="暂无报价行" />
              </template>
            </ElTable>
          </template>
        </ElTabPane>

        <ElTabPane :disabled="isCreateMode" label="选配项" name="options">
          <ElSpace class="mb-4" wrap>
            <ElButton
              v-if="isAdmin"
              :disabled="!quoteLines.length"
              type="primary"
              @click="openCreateOptionDialog"
            >
              新增选配项
            </ElButton>
          </ElSpace>
          <ElTable :data="quoteOptions" stripe>
            <ElTableColumn label="选配项" min-width="180" prop="option_name" />
            <ElTableColumn label="类型" width="120">
              <template #default="{ row }">{{ optionTypeLabel(row.option_type) }}</template>
            </ElTableColumn>
            <ElTableColumn label="范围" width="110">
              <template #default="{ row }"><ElTag>{{ optionScopeLabel(row) }}</ElTag></template>
            </ElTableColumn>
            <ElTableColumn label="关联对象" min-width="240">
              <template #default="{ row }">{{ optionTargetLabel(row) }}</template>
            </ElTableColumn>
            <ElTableColumn label="价格类型" width="110">
              <template #default="{ row }">{{ optionDeltaLabel(row.delta_type) }}</template>
            </ElTableColumn>
            <ElTableColumn label="差价" width="130">
              <template #default="{ row }">
                {{ row.price_delta ?? '-' }} {{ row.currency || '' }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="说明" min-width="220" prop="description" />
            <ElTableColumn v-if="isAdmin" fixed="right" label="操作" width="130">
              <template #default="{ row }">
                <ElButton link type="primary" @click="openEditOptionDialog(row)">
                  编辑
                </ElButton>
                <ElPopconfirm title="确认删除该选配项？" @confirm="handleDeleteOption(row)">
                  <template #reference>
                    <ElButton link type="danger">删除</ElButton>
                  </template>
                </ElPopconfirm>
              </template>
            </ElTableColumn>
            <template #empty>
              <ElEmpty description="暂无选配项" />
            </template>
          </ElTable>
        </ElTabPane>

        <ElTabPane :disabled="isCreateMode" label="报价附件" name="documents">
          <ElSpace class="mb-4" wrap>
            <ElSelect
              v-model="attachedDocumentId"
              clearable
              filterable
              placeholder="选择已上传的报价附件"
              style="width: 360px"
            >
              <ElOption
                v-for="document in attachableQuoteDocuments"
                :key="document.id"
                :label="document.title"
                :value="document.id"
              />
            </ElSelect>
            <ElButton v-if="isAdmin" type="primary" @click="attachDocument">
              关联附件
            </ElButton>
          </ElSpace>
          <ElTable :data="batchDocuments" stripe>
            <ElTableColumn label="附件标题" min-width="240" prop="title" />
            <ElTableColumn label="资料类型" width="130" prop="document_kind" />
            <ElTableColumn label="关联型号" min-width="160" prop="product_model" />
            <ElTableColumn label="更新时间" width="130">
              <template #default="{ row }">{{ formatDate(row.updated_at) }}</template>
            </ElTableColumn>
            <ElTableColumn v-if="isAdmin" fixed="right" label="操作" width="150">
              <template #default="{ row }">
                <ElButton link type="primary" @click="openDocument(row)">打开</ElButton>
                <ElPopconfirm title="确认移除该附件关联？" @confirm="detachDocument(row)">
                  <template #reference>
                    <ElButton link type="danger">移除</ElButton>
                  </template>
                </ElPopconfirm>
              </template>
            </ElTableColumn>
            <template #empty>
              <ElEmpty description="暂无报价附件" />
            </template>
          </ElTable>
        </ElTabPane>
      </ElTabs>
    </ElCard>

    <ElDialog
      v-model="lineDialogVisible"
      :title="editingLine ? '编辑报价行' : '新增报价行'"
      width="720px"
      @closed="resetLineForm"
    >
      <ElForm label-width="96px">
        <ElFormItem label="商品">
          <ElSelect v-model="lineForm.productId" filterable style="width: 100%">
            <ElOption
              v-for="product in products"
              :key="product.id"
              :label="`${product.model} - ${product.name}`"
              :value="product.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="lineForm.status" style="width: 100%">
            <ElOption
              v-for="option in quoteLineStatusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="阶梯价">
          <div style="display: grid; gap: 12px; width: 100%">
            <ElSpace
              v-for="(tier, index) in lineForm.tiers"
              :key="index"
              alignment="start"
              wrap
            >
              <ElInputNumber
                v-model="tier.minQuantity"
                :min="1"
                :precision="0"
                controls-position="right"
                placeholder="起订量"
                style="width: 150px"
              />
              <ElInputNumber
                v-model="tier.unitPrice"
                :min="0"
                :precision="2"
                controls-position="right"
                placeholder="单价"
                style="width: 180px"
              />
              <ElButton @click="removeTier(index)">删除</ElButton>
            </ElSpace>
            <ElButton plain type="primary" @click="addTier">新增阶梯</ElButton>
          </div>
        </ElFormItem>
        <ElFormItem label="标准配置">
          <ElInput v-model="lineForm.standardConfigText" :rows="3" type="textarea" />
        </ElFormItem>
        <ElFormItem label="固件备注">
          <ElInput v-model="lineForm.firmwareNote" />
        </ElFormItem>
        <ElFormItem label="行备注">
          <ElInput v-model="lineForm.remarks" :rows="3" type="textarea" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="lineDialogVisible = false">取消</ElButton>
        <ElButton :loading="dialogSaving" type="primary" @click="submitLine">
          保存
        </ElButton>
      </template>
    </ElDialog>

    <ElDialog
      v-model="optionDialogVisible"
      :title="editingOption ? '编辑选配项' : '新增选配项'"
      width="640px"
      @closed="resetOptionForm"
    >
      <ElForm label-width="96px">
        <ElFormItem label="选配名称">
          <ElInput v-model="optionForm.optionName" />
        </ElFormItem>
        <ElFormItem label="选配类型">
          <ElSelect v-model="optionForm.optionType" style="width: 100%">
            <ElOption label="配件" value="accessory" />
            <ElOption label="固件包" value="firmware" />
            <ElOption label="材料差价" value="material_change" />
            <ElOption label="其他" value="other" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="作用范围">
          <ElSelect v-model="optionForm.scopeType" style="width: 100%">
            <ElOption label="批次级" value="batch" />
            <ElOption label="报价行级" value="line" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem v-if="optionForm.scopeType === 'line'" label="报价行">
          <ElSelect v-model="optionForm.quoteLineId" filterable style="width: 100%">
            <ElOption
              v-for="quote in quoteLines"
              :key="quote.id"
              :label="quoteLineLabel(quote.id)"
              :value="quote.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="价格类型">
          <ElSelect v-model="optionForm.deltaType" style="width: 100%">
            <ElOption label="加价" value="increase" />
            <ElOption label="减价" value="decrease" />
            <ElOption label="仅文本说明" value="text_only" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem v-if="optionForm.deltaType !== 'text_only'" label="差价">
          <ElSpace>
            <ElInputNumber v-model="optionForm.priceDelta" :precision="4" />
            <ElSelect v-model="optionForm.currency" style="width: 100px">
              <ElOption label="USD" value="USD" />
              <ElOption label="CNY" value="CNY" />
              <ElOption label="EUR" value="EUR" />
            </ElSelect>
          </ElSpace>
        </ElFormItem>
        <ElFormItem label="排序">
          <ElInputNumber v-model="optionForm.sortOrder" :min="0" />
        </ElFormItem>
        <ElFormItem label="说明">
          <ElInput v-model="optionForm.description" :rows="3" type="textarea" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="optionDialogVisible = false">取消</ElButton>
        <ElButton :loading="dialogSaving" type="primary" @click="submitOption">
          保存
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
