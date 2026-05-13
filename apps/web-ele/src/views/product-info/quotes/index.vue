<script lang="ts" setup>
import type {
  CompanyRecord,
  DocumentRecord,
  ProductRecord,
  QuoteStatus,
  SaveQuoteTierInput,
  QuoteWithRelations,
} from '#/api';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
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
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  attachQuoteDocument,
  createQuote,
  detachQuoteDocument,
  listCompanies,
  listDocuments,
  listQuoteDocuments,
  listProducts,
  listQuotes,
  setQuoteStatus,
  updateQuote,
} from '#/api';

const quoteStatusOptions: Array<{ label: string; value: QuoteStatus }> = [
  { label: '启用', value: 'active' },
  { label: '草稿', value: 'draft' },
  { label: '已过期', value: 'expired' },
  { label: '已归档', value: 'archived' },
];

const currencyOptions = ['CNY', 'USD', 'EUR', 'JPY', 'HKD'];

const userStore = useUserStore();
const loading = ref(false);
const optionsLoading = ref(false);
const saving = ref(false);
const keyword = ref('');
const statusFilter = ref<'' | QuoteStatus>('');
const quotes = ref<QuoteWithRelations[]>([]);
const products = ref<ProductRecord[]>([]);
const companies = ref<CompanyRecord[]>([]);
const documents = ref<DocumentRecord[]>([]);
const dialogVisible = ref(false);
const editingQuote = ref<QuoteWithRelations>();
const editingDocumentId = ref('');

const isAdmin = computed(() => userStore.userRoles.includes('admin'));
const dialogTitle = computed(() =>
  editingQuote.value ? '编辑报价' : '新增报价',
);
type EditableTier = {
  minQuantity?: number;
  unitPrice?: number;
};

const filteredQuotes = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLowerCase();

  if (!normalizedKeyword) {
    return quotes.value;
  }

  return quotes.value.filter((quote) =>
    [
      quote.company?.name,
      quote.company?.slug,
      quote.currency,
      quote.product?.category,
      quote.product?.model,
      quote.product?.name,
      quote.quote_no,
      quote.remarks,
    ].some((value) => value?.toLowerCase().includes(normalizedKeyword)),
  );
});

const form = reactive({
  batchTitle: '',
  companyId: '',
  currency: 'CNY',
  documentId: '',
  firmwareNote: '',
  productId: '',
  publishedAt: '',
  remarks: '',
  standardConfigText: '',
  status: 'active' as QuoteStatus,
  validFrom: '',
  tiers: [{ minQuantity: 1, unitPrice: undefined }] as EditableTier[],
});

function quoteStatusLabel(status: string) {
  return (
    quoteStatusOptions.find((option) => option.value === status)?.label ||
    status
  );
}

function quoteStatusTagType(status: string) {
  if (status === 'active') {
    return 'success';
  }

  if (status === 'archived') {
    return 'info';
  }

  if (status === 'expired') {
    return 'danger';
  }

  return 'warning';
}

function formatDate(value?: null | string) {
  return value ? new Date(value).toLocaleDateString() : '-';
}

function formatMoney(row: QuoteWithRelations) {
  if (!row.quote_tiers?.length) {
    return '-';
  }

  return row.quote_tiers
    .map(
      (tier) =>
        `${tier.min_quantity}+ / ${tier.currency} ${tier.unit_price}`,
    )
    .join(' | ');
}

async function loadQuotes() {
  try {
    loading.value = true;
    quotes.value = await listQuotes({
      status: statusFilter.value || undefined,
    });
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    loading.value = false;
  }
}

async function loadOptions() {
  if (
    products.value.length > 0 &&
    companies.value.length > 0 &&
    documents.value.length > 0
  ) {
    return;
  }

  try {
    optionsLoading.value = true;
    const [productList, companyList, documentList] = await Promise.all([
      listProducts(),
      listCompanies(),
      listDocuments(),
    ]);
    products.value = productList;
    companies.value = companyList;
    documents.value = documentList;
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    optionsLoading.value = false;
  }
}

function resetForm() {
  editingQuote.value = undefined;
  editingDocumentId.value = '';
  form.batchTitle = '';
  form.companyId = '';
  form.currency = 'CNY';
  form.documentId = '';
  form.firmwareNote = '';
  form.productId = '';
  form.publishedAt = '';
  form.remarks = '';
  form.standardConfigText = '';
  form.status = 'active';
  form.validFrom = '';
  form.tiers = [{ minQuantity: 1, unitPrice: undefined }];
}

async function openCreateDialog() {
  resetForm();
  dialogVisible.value = true;
  await loadOptions();
}

async function openEditDialog(row: QuoteWithRelations) {
  editingQuote.value = row;
  editingDocumentId.value = '';
  form.batchTitle = row.batch_title || '';
  form.companyId = row.company_id;
  form.currency = row.currency || 'CNY';
  form.firmwareNote = row.firmware_note || '';
  form.productId = row.product_id;
  form.publishedAt = row.published_at || '';
  form.remarks = row.remarks || '';
  form.standardConfigText = row.standard_config_text || '';
  form.status = quoteStatusOptions.some((option) => option.value === row.status)
    ? (row.status as QuoteStatus)
    : 'active';
  form.validFrom = row.valid_from || '';
  form.tiers =
    row.quote_tiers?.length
      ? row.quote_tiers.map((tier) => ({
          minQuantity: tier.min_quantity,
          unitPrice: tier.unit_price,
        }))
      : [{ minQuantity: row.min_order_quantity ?? 1, unitPrice: row.unit_price ?? undefined }];
  dialogVisible.value = true;
  await loadOptions();
  await loadQuoteDocument(row.id);
}

async function loadQuoteDocument(quoteId: string) {
  try {
    const quoteDocuments = await listQuoteDocuments(quoteId);
    editingDocumentId.value = quoteDocuments[0]?.document_id || '';
    form.documentId = editingDocumentId.value;
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
}

function buildQuoteInput() {
  if (!form.productId || !form.companyId) {
    throw new Error('请选择关联商品和公司');
  }

  const tiers = form.tiers
    .map((tier) => ({
      currency: form.currency,
      minQuantity: tier.minQuantity,
      unitPrice: tier.unitPrice,
    }))
    .filter((tier) => typeof tier.minQuantity === 'number' && typeof tier.unitPrice === 'number')
    .map(
      (tier) =>
        ({
          currency: tier.currency,
          minQuantity: tier.minQuantity as number,
          unitPrice: tier.unitPrice as number,
        }) satisfies SaveQuoteTierInput,
    )
    .sort((left, right) => left.minQuantity - right.minQuantity);

  if (tiers.length === 0) {
    throw new Error('请至少填写一条有效的阶梯价');
  }

  return {
    batchTitle: form.batchTitle.trim() || undefined,
    companyId: form.companyId,
    currency: form.currency.trim().toUpperCase(),
    firmwareNote: form.firmwareNote.trim() || undefined,
    productId: form.productId,
    publishedAt: form.publishedAt || undefined,
    remarks: form.remarks.trim(),
    standardConfigText: form.standardConfigText.trim() || undefined,
    status: form.status,
    validFrom: form.validFrom,
    tiers,
  };
}

function addTier() {
  form.tiers.push({
    minQuantity:
      (form.tiers[form.tiers.length - 1]?.minQuantity || 0) + 50 || 1,
    unitPrice: undefined,
  });
}

function removeTier(index: number) {
  if (form.tiers.length === 1) {
    form.tiers[0] = { minQuantity: 1, unitPrice: undefined };
    return;
  }

  form.tiers.splice(index, 1);
}

async function submitQuote() {
  try {
    saving.value = true;
    const input = buildQuoteInput();
    const savedQuote = editingQuote.value
      ? await updateQuote(editingQuote.value.id, input)
      : await createQuote(input);

    if (form.documentId && form.documentId !== editingDocumentId.value) {
      await attachQuoteDocument(savedQuote.id, form.documentId);
    }

    if (
      editingDocumentId.value &&
      editingDocumentId.value !== form.documentId
    ) {
      await detachQuoteDocument(savedQuote.id, editingDocumentId.value);
    }

    if (editingQuote.value) {
      ElMessage.success('报价已更新');
    } else {
      ElMessage.success('报价已新增');
    }

    dialogVisible.value = false;
    await loadQuotes();
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    saving.value = false;
  }
}

async function handleStatusChange(row: QuoteWithRelations) {
  const nextStatus: QuoteStatus =
    row.status === 'archived' ? 'active' : 'archived';

  try {
    await setQuoteStatus(row.id, nextStatus);
    ElMessage.success(nextStatus === 'active' ? '报价已启用' : '报价已归档');
    await loadQuotes();
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
}

onMounted(async () => {
  await Promise.all([loadQuotes(), loadOptions()]);
});
</script>

<template>
  <Page description="维护产品报价、客户公司、有效期和报价状态" title="报价管理">
    <ElCard shadow="never">
      <ElSpace class="mb-4" wrap>
        <ElInput
          v-model="keyword"
          clearable
          placeholder="搜索报价号、商品、公司、备注"
          style="width: 320px"
        />
        <ElSelect
          v-model="statusFilter"
          clearable
          placeholder="报价状态"
          style="width: 160px"
          @change="loadQuotes"
          @clear="loadQuotes"
        >
          <ElOption
            v-for="option in quoteStatusOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
        <ElButton @click="loadQuotes">查询</ElButton>
        <ElButton v-if="isAdmin" type="primary" @click="openCreateDialog">
          新增报价
        </ElButton>
      </ElSpace>
      <ElTable v-loading="loading" :data="filteredQuotes" stripe>
        <ElTableColumn label="批次标题" min-width="220">
          <template #default="{ row }">
            {{ row.batch_title || row.quote_no || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="商品" min-width="220">
          <template #default="{ row }">
            {{
              row.product ? `${row.product.model} - ${row.product.name}` : '-'
            }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="公司" min-width="180">
          <template #default="{ row }">
            {{ row.company?.name || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="阶梯价" min-width="280">
          <template #default="{ row }">
            {{ formatMoney(row) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="批次时间" width="220">
          <template #default="{ row }">
            {{ formatDate(row.published_at) }} 发布 /
            {{ formatDate(row.effective_from || row.valid_from) }} 生效
          </template>
        </ElTableColumn>
        <ElTableColumn label="MOQ" prop="min_order_quantity" width="100">
          <template #default="{ row }">
            {{ row.min_order_quantity ?? '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" prop="status" width="110">
          <template #default="{ row }">
            <ElTag :type="quoteStatusTagType(row.status)">
              {{ quoteStatusLabel(row.status) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="备注" min-width="180" prop="remarks" />
        <ElTableColumn label="更新时间" width="140">
          <template #default="{ row }">
            {{ formatDate(row.updated_at) }}
          </template>
        </ElTableColumn>
        <ElTableColumn v-if="isAdmin" fixed="right" label="操作" width="150">
          <template #default="{ row }">
            <ElButton link type="primary" @click="openEditDialog(row)">
              编辑
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
          <ElEmpty description="暂无报价资料" />
        </template>
      </ElTable>
    </ElCard>

    <ElDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="640px"
      @closed="resetForm"
    >
      <ElForm label-width="88px">
        <ElFormItem label="批次标题">
          <ElInput
            v-model="form.batchTitle"
            placeholder="例如 TAB-R10-4G 渠道价 2026Q2"
          />
        </ElFormItem>
        <ElFormItem label="商品">
          <ElSelect
            v-model="form.productId"
            :loading="optionsLoading"
            filterable
            placeholder="选择关联商品"
            style="width: 100%"
          >
            <ElOption
              v-for="product in products"
              :key="product.id"
              :label="`${product.model} - ${product.name}`"
              :value="product.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="公司">
          <ElSelect
            v-model="form.companyId"
            :loading="optionsLoading"
            filterable
            placeholder="选择关联公司"
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
          <ElSelect v-model="form.currency" filterable style="width: 100%">
            <ElOption
              v-for="currency in currencyOptions"
              :key="currency"
              :label="currency"
              :value="currency"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="发布时间">
          <ElDatePicker
            v-model="form.publishedAt"
            placeholder="发布时间"
            type="date"
            value-format="YYYY-MM-DD"
          />
        </ElFormItem>
        <ElFormItem label="生效日期">
          <ElDatePicker
            v-model="form.validFrom"
            placeholder="生效日期"
            type="date"
            value-format="YYYY-MM-DD"
          />
        </ElFormItem>
        <ElFormItem label="阶梯价">
          <div style="display: grid; gap: 12px; width: 100%">
            <ElSpace
              v-for="(tier, index) in form.tiers"
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
              <ElButton @click="removeTier(index)">
                删除
              </ElButton>
            </ElSpace>
            <ElButton plain type="primary" @click="addTier">
              新增阶梯
            </ElButton>
          </div>
        </ElFormItem>
        <ElFormItem label="报价附件">
          <ElSelect
            v-model="form.documentId"
            :loading="optionsLoading"
            clearable
            filterable
            placeholder="选择已上传的报价单或资料附件"
            style="width: 100%"
          >
            <ElOption
              v-for="document in documents"
              :key="document.id"
              :label="`${document.title} - ${document.product_model || document.category}`"
              :value="document.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="标准配置">
          <ElInput
            v-model="form.standardConfigText"
            :rows="3"
            placeholder="例如 Android 13 / 4GB + 64GB / Wi-Fi 6"
            type="textarea"
          />
        </ElFormItem>
        <ElFormItem label="固件备注">
          <ElInput
            v-model="form.firmwareNote"
            placeholder="例如 出厂固件 V2.3，支持 OTA"
          />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="form.status" style="width: 100%">
            <ElOption
              v-for="option in quoteStatusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput
            v-model="form.remarks"
            :rows="4"
            placeholder="请输入报价备注"
            type="textarea"
          />
        </ElFormItem>
        <ElFormItem label="时间预览">
          <ElSpace wrap>
            <ElTag type="info">{{ form.publishedAt || '未设置发布时间' }}</ElTag>
            <ElTag type="success">{{ form.validFrom || '未设置生效日期' }}</ElTag>
            <ElTag type="warning">{{ form.tiers.length }} 个阶梯</ElTag>
          </ElSpace>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton :loading="saving" type="primary" @click="submitQuote">
          保存
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
