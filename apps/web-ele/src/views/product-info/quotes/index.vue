<script lang="ts" setup>
import type {
  CompanyRecord,
  DocumentRecord,
  ProductRecord,
  QuoteStatus,
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
  companyId: '',
  currency: 'CNY',
  minOrderQuantity: undefined as number | undefined,
  productId: '',
  documentId: '',
  quoteNo: '',
  remarks: '',
  status: 'active' as QuoteStatus,
  unitPrice: undefined as number | undefined,
  validFrom: '',
  validUntil: '',
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
  if (row.unit_price === null || row.unit_price === undefined) {
    return '-';
  }

  return `${row.currency} ${row.unit_price}`;
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
  form.companyId = '';
  form.currency = 'CNY';
  form.minOrderQuantity = undefined;
  form.productId = '';
  form.documentId = '';
  form.quoteNo = '';
  form.remarks = '';
  form.status = 'active';
  form.unitPrice = undefined;
  form.validFrom = '';
  form.validUntil = '';
}

async function openCreateDialog() {
  resetForm();
  dialogVisible.value = true;
  await loadOptions();
}

async function openEditDialog(row: QuoteWithRelations) {
  editingQuote.value = row;
  editingDocumentId.value = '';
  form.companyId = row.company_id;
  form.currency = row.currency || 'CNY';
  form.minOrderQuantity = row.min_order_quantity ?? undefined;
  form.productId = row.product_id;
  form.quoteNo = row.quote_no || '';
  form.remarks = row.remarks || '';
  form.status = quoteStatusOptions.some((option) => option.value === row.status)
    ? (row.status as QuoteStatus)
    : 'active';
  form.unitPrice = row.unit_price ?? undefined;
  form.validFrom = row.valid_from || '';
  form.validUntil = row.valid_until || '';
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

  if (
    form.validFrom &&
    form.validUntil &&
    new Date(form.validFrom) > new Date(form.validUntil)
  ) {
    throw new Error('有效期开始日期不能晚于结束日期');
  }

  return {
    companyId: form.companyId,
    currency: form.currency.trim().toUpperCase(),
    minOrderQuantity: form.minOrderQuantity,
    productId: form.productId,
    quoteNo: form.quoteNo.trim(),
    remarks: form.remarks.trim(),
    status: form.status,
    unitPrice: form.unitPrice,
    validFrom: form.validFrom,
    validUntil: form.validUntil,
  };
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
        <ElTableColumn label="报价号" min-width="150" prop="quote_no" />
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
        <ElTableColumn label="单价" width="130">
          <template #default="{ row }">
            {{ formatMoney(row) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="MOQ" prop="min_order_quantity" width="100">
          <template #default="{ row }">
            {{ row.min_order_quantity ?? '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="有效期" width="220">
          <template #default="{ row }">
            {{ formatDate(row.valid_from) }} 至
            {{ formatDate(row.valid_until) }}
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
        <ElFormItem label="报价号">
          <ElInput v-model="form.quoteNo" placeholder="例如 Q-202605-001" />
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
        <ElFormItem label="单价">
          <ElInputNumber
            v-model="form.unitPrice"
            :min="0"
            :precision="2"
            controls-position="right"
            placeholder="请输入单价"
            style="width: 100%"
          />
        </ElFormItem>
        <ElFormItem label="MOQ">
          <ElInputNumber
            v-model="form.minOrderQuantity"
            :min="0"
            :precision="0"
            controls-position="right"
            placeholder="请输入最小起订量"
            style="width: 100%"
          />
        </ElFormItem>
        <ElFormItem label="有效期">
          <ElSpace wrap>
            <ElDatePicker
              v-model="form.validFrom"
              placeholder="开始日期"
              type="date"
              value-format="YYYY-MM-DD"
            />
            <ElDatePicker
              v-model="form.validUntil"
              placeholder="结束日期"
              type="date"
              value-format="YYYY-MM-DD"
            />
          </ElSpace>
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
