<script lang="ts" setup>
import type {
  CompanyRecord,
  DocumentFileType,
  DocumentKind,
  ProductRecord,
} from '@/api';
import type { UploadFile } from 'element-plus';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElCard,
  ElEmpty,
  ElMessage,
  ElOption,
  ElSelect,
  ElSpace,
  ElTable,
  ElTableColumn,
  ElTag,
  ElUpload,
} from 'element-plus';

import { createDocument, listCompanies, listProducts } from '@/api';

interface FileDraft {
  companyId: string;
  documentKind: DocumentKind;
  file: File;
  fileType: DocumentFileType;
  matchedProduct?: ProductRecord;
  productId: string;
  productModel: string;
  rowKey: string;
  status: 'failed' | 'pending' | 'uploaded';
  title: string;
  warning: string;
}

const userStore = useUserStore();
const isAdmin = computed(() => userStore.userRoles.includes('admin'));

const uploading = ref(false);
const products = ref<ProductRecord[]>([]);
const companies = ref<CompanyRecord[]>([]);
const drafts = ref<FileDraft[]>([]);

const uploadSummary = computed(() => ({
  matched: drafts.value.filter((item) => item.productId).length,
  pending: drafts.value.filter((item) => item.status === 'pending').length,
  total: drafts.value.length,
  uploaded: drafts.value.filter((item) => item.status === 'uploaded').length,
}));

function inferFileType(fileName: string): DocumentFileType {
  const lowerName = fileName.toLowerCase();
  if (/\.(png|jpe?g|webp|gif|bmp)$/i.test(fileName)) return 'image';
  if (lowerName.includes('quote') || lowerName.includes('报价')) return 'quote';
  if (lowerName.includes('spec') || lowerName.includes('规格')) return 'spec';
  if (lowerName.includes('manual') || lowerName.includes('说明书') || lowerName.includes('技术')) return 'technical';
  return 'other';
}

function inferDocumentKind(fileName: string, fileType: DocumentFileType): DocumentKind {
  const lowerName = fileName.toLowerCase();
  if (fileType === 'image') return 'product_image';
  if (fileType === 'quote') return 'quote_workbook';
  if (lowerName.includes('draw') || lowerName.includes('图纸')) return 'drawing';
  if (lowerName.includes('cert') || lowerName.includes('证书')) return 'certificate';
  if (lowerName.includes('manual') || lowerName.includes('说明书')) return 'manual';
  if (fileType === 'spec') return 'spec_sheet';
  if (fileType === 'technical') return 'technical';
  return 'other';
}

function findProductByFileName(fileName: string) {
  const normalized = fileName.toLowerCase();
  return products.value.find((product) =>
    product.model && normalized.includes(product.model.toLowerCase()),
  );
}

async function loadOptions() {
  const [productRecords, companyRecords] = await Promise.all([
    listProducts(),
    listCompanies(),
  ]);
  products.value = productRecords;
  companies.value = companyRecords;
}

function handleFilesChange(file: UploadFile) {
  const rawFile = file.raw;
  if (!rawFile) return;
  const matchedProduct = findProductByFileName(rawFile.name);
  const fileType = inferFileType(rawFile.name);
  drafts.value.push({
    companyId: matchedProduct?.company_id || '',
    documentKind: inferDocumentKind(rawFile.name, fileType),
    file: rawFile,
    fileType,
    matchedProduct,
    productId: matchedProduct?.id || '',
    productModel: matchedProduct?.model || '',
    rowKey: `${rawFile.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    status: 'pending',
    title: rawFile.name,
    warning: matchedProduct ? '' : '未按文件名匹配到商品，请手动选择',
  });
}

function removeDraft(index: number) {
  drafts.value.splice(index, 1);
}

function handleProductChange(row: FileDraft) {
  const product = products.value.find((item) => item.id === row.productId);
  row.matchedProduct = product;
  row.productModel = product?.model || '';
  row.companyId = row.companyId || product?.company_id || '';
  row.warning = product ? '' : '未选择商品';
}

async function uploadAll() {
  if (!isAdmin.value) {
    ElMessage.warning('只有管理员可以上传资料');
    return;
  }

  const targets = drafts.value.filter((item) => item.status !== 'uploaded');
  if (!targets.length) {
    ElMessage.info('没有待上传资料');
    return;
  }

  try {
    uploading.value = true;
    for (const draft of targets) {
      try {
        await createDocument({
          category: draft.documentKind,
          companyId: draft.companyId || undefined,
          documentKind: draft.documentKind,
          file: draft.file,
          fileType: draft.fileType,
          isPrimary: draft.documentKind === 'product_image',
          productId: draft.productId || undefined,
          productModel: draft.productModel || undefined,
          seriesId: draft.matchedProduct?.series_id || undefined,
          tags: ['资料补齐', draft.fileType, draft.documentKind],
          title: draft.title,
          variantId: draft.productId || undefined,
        });
        draft.status = 'uploaded';
        draft.warning = '';
      } catch (error) {
        draft.status = 'failed';
        draft.warning = (error as Error).message || '上传失败';
      }
    }
    ElMessage.success('资料补齐处理完成');
  } finally {
    uploading.value = false;
  }
}

function statusType(status: FileDraft['status']) {
  if (status === 'uploaded') return 'success';
  if (status === 'failed') return 'danger';
  return 'warning';
}

function statusLabel(status: FileDraft['status']) {
  return {
    failed: '失败',
    pending: '待上传',
    uploaded: '已上传',
  }[status];
}

onMounted(loadOptions);
</script>

<template>
  <Page description="批量上传图片、规格书、说明书、图纸、证书和报价附件，并按文件名匹配商品" title="多文件资料补齐工作台">
    <ElAlert class="mb-4" :closable="false" show-icon title="文件名包含商品型号时会自动关联商品；未匹配文件会保留在待确认列表中，管理员可手动选择商品后批量上传。" type="info" />

    <ElCard shadow="never">
      <ElUpload :auto-upload="false" :on-change="handleFilesChange" multiple drag>
        <div class="py-6">
          <div class="text-base font-medium">拖拽或选择多份资料文件</div>
          <div class="mt-2 text-sm text-gray-500">支持产品图片、规格书、说明书、图纸、证书、报价附件等</div>
        </div>
      </ElUpload>
    </ElCard>

    <ElCard class="mt-4" shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span>资料补齐确认</span>
          <ElSpace>
            <ElTag>总数 {{ uploadSummary.total }}</ElTag>
            <ElTag type="success">已匹配 {{ uploadSummary.matched }}</ElTag>
            <ElTag type="warning">待上传 {{ uploadSummary.pending }}</ElTag>
            <ElTag type="success">已上传 {{ uploadSummary.uploaded }}</ElTag>
            <ElButton :disabled="!isAdmin || !drafts.length" :loading="uploading" type="primary" @click="uploadAll">批量确认上传</ElButton>
          </ElSpace>
        </div>
      </template>

      <ElTable v-if="drafts.length" :data="drafts" max-height="620" stripe>
        <ElTableColumn label="状态" width="90">
          <template #default="{ row }"><ElTag :type="statusType(row.status)">{{ statusLabel(row.status) }}</ElTag></template>
        </ElTableColumn>
        <ElTableColumn label="文件标题" min-width="240">
          <template #default="{ row }"><input v-model="row.title" class="w-full rounded border px-2 py-1" /></template>
        </ElTableColumn>
        <ElTableColumn label="资料类型" min-width="150">
          <template #default="{ row }">
            <ElSelect v-model="row.fileType" style="width: 100%">
              <ElOption label="主图/图片" value="image" />
              <ElOption label="规格书" value="spec" />
              <ElOption label="技术资料" value="technical" />
              <ElOption label="报价附件" value="quote" />
              <ElOption label="其他" value="other" />
            </ElSelect>
          </template>
        </ElTableColumn>
        <ElTableColumn label="资料细类" min-width="180">
          <template #default="{ row }">
            <ElSelect v-model="row.documentKind" style="width: 100%">
              <ElOption label="主图/产品图" value="product_image" />
              <ElOption label="规格书" value="spec_sheet" />
              <ElOption label="技术资料" value="technical" />
              <ElOption label="说明书" value="manual" />
              <ElOption label="图纸" value="drawing" />
              <ElOption label="证书" value="certificate" />
              <ElOption label="报价工作簿" value="quote_workbook" />
              <ElOption label="其他" value="other" />
            </ElSelect>
          </template>
        </ElTableColumn>
        <ElTableColumn label="关联商品" min-width="260">
          <template #default="{ row }">
            <ElSelect v-model="row.productId" clearable filterable style="width: 100%" @change="handleProductChange(row)">
              <ElOption v-for="product in products" :key="product.id" :label="`${product.model} / ${product.name}`" :value="product.id" />
            </ElSelect>
          </template>
        </ElTableColumn>
        <ElTableColumn label="关联公司" min-width="220">
          <template #default="{ row }">
            <ElSelect v-model="row.companyId" clearable filterable style="width: 100%">
              <ElOption v-for="company in companies" :key="company.id" :label="company.name" :value="company.id" />
            </ElSelect>
          </template>
        </ElTableColumn>
        <ElTableColumn label="提示" min-width="260">
          <template #default="{ row }"><span class="text-xs text-gray-500">{{ row.warning || '-' }}</span></template>
        </ElTableColumn>
        <ElTableColumn fixed="right" label="操作" width="90">
          <template #default="{ $index }"><ElButton link type="danger" @click="removeDraft($index)">移除</ElButton></template>
        </ElTableColumn>
      </ElTable>
      <ElEmpty v-else description="请先上传资料文件" />
    </ElCard>
  </Page>
</template>
