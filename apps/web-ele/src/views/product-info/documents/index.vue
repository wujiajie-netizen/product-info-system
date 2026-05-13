<script lang="ts" setup>
import type {
  CompanyRecord,
  DocumentFileType,
  DocumentKind,
  DocumentRecord,
  ProductRecord,
  QuoteWithRelations,
} from '#/api';
import type { UploadFile } from 'element-plus';

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
  ElMessage,
  ElOption,
  ElSelect,
  ElSpace,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag,
  ElUpload,
} from 'element-plus';

import {
  createDocument,
  createDocumentSignedUrl,
  listCompanies,
  listDocuments,
  listProducts,
  listQuotes,
} from '#/api';

const userStore = useUserStore();
const loading = ref(false);
const uploading = ref(false);
const keyword = ref('');
const documents = ref<DocumentRecord[]>([]);
const products = ref<ProductRecord[]>([]);
const companies = ref<CompanyRecord[]>([]);
const quotes = ref<QuoteWithRelations[]>([]);
const dialogVisible = ref(false);
const selectedFile = ref<File>();

const isAdmin = computed(() => userStore.userRoles.includes('admin'));

const uploadForm = reactive({
  category: '',
  companyId: '',
  documentKind: 'other' as DocumentKind,
  fileType: 'other' as DocumentFileType,
  isPrimary: false,
  productId: '',
  productModel: '',
  quoteBatchId: '',
  seriesId: '',
  sortOrder: 0,
  sourceSheetName: '',
  tagsText: '',
  title: '',
});

const quoteBatchOptions = computed(() => {
  const optionMap = new Map<string, { label: string; value: string }>();
  for (const quote of quotes.value) {
    if (!quote.batch_id || optionMap.has(quote.batch_id)) {
      continue;
    }

    optionMap.set(quote.batch_id, {
      label:
        `${quote.batch_title || quote.quote_no || '未命名批次'} / ` +
        `${quote.product_model || quote.product?.model || '-'} / ` +
        `${quote.company?.name || '-'}`,
      value: quote.batch_id,
    });
  }

  return [...optionMap.values()];
});

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

async function loadDocuments() {
  try {
    loading.value = true;
    documents.value = await listDocuments({ keyword: keyword.value });
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    loading.value = false;
  }
}

async function openUploadDialog() {
  dialogVisible.value = true;
  await loadRelationOptions();
}

function handleFileChange(file: UploadFile) {
  selectedFile.value = file.raw;
  if (!uploadForm.title && file.name) {
    uploadForm.title = file.name;
  }
}

function resetUploadForm() {
  uploadForm.category = '';
  uploadForm.companyId = '';
  uploadForm.documentKind = 'other';
  uploadForm.fileType = 'other';
  uploadForm.isPrimary = false;
  uploadForm.productId = '';
  uploadForm.productModel = '';
  uploadForm.quoteBatchId = '';
  uploadForm.seriesId = '';
  uploadForm.sortOrder = 0;
  uploadForm.sourceSheetName = '';
  uploadForm.tagsText = '';
  uploadForm.title = '';
  selectedFile.value = undefined;
}

async function submitUpload() {
  if (!selectedFile.value) {
    ElMessage.warning('请选择要上传的文件');
    return;
  }

  if (!uploadForm.title.trim()) {
    ElMessage.warning('请填写文件标题');
    return;
  }

  try {
    uploading.value = true;
    await createDocument({
      category: uploadForm.category || '未分类',
      companyId: uploadForm.companyId || undefined,
      documentKind: uploadForm.documentKind,
      file: selectedFile.value,
      fileType: uploadForm.fileType,
      isPrimary: uploadForm.isPrimary,
      productId: uploadForm.productId || undefined,
      productModel: uploadForm.productModel || undefined,
      quoteBatchId: uploadForm.quoteBatchId || undefined,
      seriesId: uploadForm.seriesId || undefined,
      sortOrder: uploadForm.sortOrder,
      sourceSheetName: uploadForm.sourceSheetName.trim() || undefined,
      tags: uploadForm.tagsText
        .split(/[,，]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
      title: uploadForm.title,
    });
    ElMessage.success('文件已上传');
    dialogVisible.value = false;
    await loadDocuments();
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    uploading.value = false;
  }
}

async function loadRelationOptions() {
  const requests: Array<Promise<unknown>> = [];

  if (products.value.length === 0) {
    requests.push(listProducts().then((records) => (products.value = records)));
  }

  if (companies.value.length === 0) {
    requests.push(
      listCompanies().then((records) => (companies.value = records)),
    );
  }

  if (quotes.value.length === 0) {
    requests.push(listQuotes().then((records) => (quotes.value = records)));
  }

  await Promise.all(requests);
}

function handleProductChange(productId?: string) {
  const product = products.value.find((item) => item.id === productId);
  uploadForm.productModel = product?.model || '';
  uploadForm.seriesId = product?.series_id || '';
}

async function openDocument(row: DocumentRecord) {
  try {
    const url = await createDocumentSignedUrl(row);
    window.open(url, '_blank', 'noopener,noreferrer');
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
}

onMounted(async () => {
  await Promise.all([loadRelationOptions(), loadDocuments()]);
});
</script>

<template>
  <Page description="统一管理报价单、规格书、图片和技术资料" title="文件资料">
    <ElCard shadow="never">
      <ElSpace class="mb-4" wrap>
        <ElInput
          v-model="keyword"
          clearable
          placeholder="搜索标题、型号、分类"
          style="width: 320px"
          @clear="loadDocuments"
          @keyup.enter="loadDocuments"
        />
        <ElButton @click="loadDocuments">查询</ElButton>
        <ElButton v-if="isAdmin" type="primary" @click="openUploadDialog">
          上传文件
        </ElButton>
      </ElSpace>
      <ElTable v-loading="loading" :data="documents" stripe>
        <ElTableColumn label="文件标题" min-width="260" prop="title" />
        <ElTableColumn label="关联型号" prop="product_model" width="160" />
        <ElTableColumn label="资料类型" width="140">
          <template #default="{ row }">
            <ElTag type="info">{{ row.document_kind || '-' }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="关联公司" width="180">
          <template #default="{ row }">
            {{
              companies.find((company) => company.id === row.company_id)
                ?.name || '-'
            }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="关联批次" min-width="220">
          <template #default="{ row }">
            {{
              quoteBatchOptions.find((quote) => quote.value === row.quote_batch_id)
                ?.label || '-'
            }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="文件类型" prop="file_type" width="120">
          <template #default="{ row }">
            <ElTag type="primary">{{ row.file_type }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="主资料" width="90">
          <template #default="{ row }">
            <ElTag :type="row.is_primary ? 'success' : 'info'">
              {{ row.is_primary ? '是' : '否' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="分类" prop="category" width="120" />
        <ElTableColumn label="来源" prop="source_sheet_name" width="140" />
        <ElTableColumn label="更新时间" width="140">
          <template #default="{ row }">
            {{ formatDate(row.updated_at) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" fixed="right" width="100">
          <template #default="{ row }">
            <ElButton link type="primary" @click="openDocument(row)">
              打开
            </ElButton>
          </template>
        </ElTableColumn>
        <template #empty>
          <ElEmpty description="暂无文件资料" />
        </template>
      </ElTable>
    </ElCard>

    <ElDialog
      v-model="dialogVisible"
      title="上传文件"
      width="520px"
      @closed="resetUploadForm"
    >
      <ElForm label-width="88px">
        <ElFormItem label="标题">
          <ElInput v-model="uploadForm.title" placeholder="请输入文件标题" />
        </ElFormItem>
        <ElFormItem label="关联产品">
          <ElSelect
            v-model="uploadForm.productId"
            clearable
            filterable
            placeholder="选择产品型号"
            style="width: 100%"
            @change="handleProductChange"
          >
            <ElOption
              v-for="product in products"
              :key="product.id"
              :label="`${product.model} - ${product.name}`"
              :value="product.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="关联公司">
          <ElSelect
            v-model="uploadForm.companyId"
            clearable
            filterable
            placeholder="选择供应商、制造商或报价来源"
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
        <ElFormItem label="关联批次">
          <ElSelect
            v-model="uploadForm.quoteBatchId"
            clearable
            filterable
            placeholder="选择报价批次，可挂报价附件"
            style="width: 100%"
          >
            <ElOption
              v-for="quote in quoteBatchOptions"
              :key="quote.value"
              :label="quote.label"
              :value="quote.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="文件类型">
          <ElSelect v-model="uploadForm.fileType" style="width: 100%">
            <ElOption label="报价单" value="quote" />
            <ElOption label="规格书" value="spec" />
            <ElOption label="图片" value="image" />
            <ElOption label="技术资料" value="technical" />
            <ElOption label="其他" value="other" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="资料类型">
          <ElSelect v-model="uploadForm.documentKind" style="width: 100%">
            <ElOption label="主图" value="product_image" />
            <ElOption label="规格书" value="spec_sheet" />
            <ElOption label="技术资料" value="technical" />
            <ElOption label="说明书" value="manual" />
            <ElOption label="图纸" value="drawing" />
            <ElOption label="报价附件" value="quote_workbook" />
            <ElOption label="证书" value="certificate" />
            <ElOption label="其他" value="other" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="分类">
          <ElInput v-model="uploadForm.category" placeholder="例如 报价资料" />
        </ElFormItem>
        <ElFormItem label="主资料">
          <ElSwitch v-model="uploadForm.isPrimary" />
        </ElFormItem>
        <ElFormItem label="排序值">
          <ElInput
            v-model.number="uploadForm.sortOrder"
            placeholder="越小越靠前"
            type="number"
          />
        </ElFormItem>
        <ElFormItem label="来源表">
          <ElInput
            v-model="uploadForm.sourceSheetName"
            placeholder="例如 demo_catalog / quote_sheet_a"
          />
        </ElFormItem>
        <ElFormItem label="标签">
          <ElInput
            v-model="uploadForm.tagsText"
            placeholder="多个标签用英文逗号分隔"
          />
        </ElFormItem>
        <ElFormItem label="文件">
          <ElUpload
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
          >
            <ElButton>选择文件</ElButton>
          </ElUpload>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton :loading="uploading" type="primary" @click="submitUpload">
          保存
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
