<script lang="ts" setup>
import type { DocumentRecord, ProductRecord } from '#/api';
import type { ExcelImageCandidate } from '../utils/excel-image-extractor';

import { computed, ref } from 'vue';

import {
  ElButton,
  ElCard,
  ElEmpty,
  ElImage,
  ElMessage,
  ElOption,
  ElSelect,
  ElSpace,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { createDocument } from '#/api';

const props = defineProps<{
  candidates: ExcelImageCandidate[];
  products: ProductRecord[];
}>();

const emit = defineEmits<{
  uploaded: [documents: DocumentRecord[]];
}>();

const uploading = ref(false);
const previewUrls = computed(() =>
  Object.fromEntries(props.candidates.map((item) => [item.rowKey, URL.createObjectURL(item.file)])),
);

function handleProductChange(row: ExcelImageCandidate, productId: string) {
  row.matchedProduct = props.products.find((product) => product.id === productId);
  row.status = row.matchedProduct ? 'matched' : 'pending';
  row.warning = row.matchedProduct ? '' : '请选择关联产品';
}

async function uploadImages() {
  const targets = props.candidates.filter((item) => item.matchedProduct);
  if (!targets.length) {
    ElMessage.warning('请先选择要关联的产品');
    return;
  }

  try {
    uploading.value = true;
    const documents: DocumentRecord[] = [];
    for (const candidate of targets) {
      const product = candidate.matchedProduct;
      if (!product) continue;
      const document = await createDocument({
        category: 'product_image',
        companyId: product.company_id || undefined,
        documentKind: 'product_image',
        file: candidate.file,
        fileType: 'image',
        isPrimary: true,
        productId: product.id,
        productModel: product.model,
        seriesId: product.series_id || undefined,
        tags: ['Excel嵌入图片', '自动提取'],
        title: candidate.fileName,
        variantId: product.id,
      });
      documents.push(document);
      candidate.status = 'matched';
      candidate.warning = '已上传并关联';
    }
    ElMessage.success(`已上传 ${documents.length} 张图片`);
    emit('uploaded', documents);
  } catch (error) {
    ElMessage.error((error as Error).message || '图片上传失败');
  } finally {
    uploading.value = false;
  }
}
</script>

<template>
  <ElCard shadow="never">
    <template #header>
      <ElSpace wrap>
        <span>Excel 嵌入图片</span>
        <ElTag type="info">{{ candidates.length }} 张</ElTag>
        <ElButton :disabled="!candidates.length" :loading="uploading" size="small" type="primary" @click="uploadImages">
          上传并关联产品图片
        </ElButton>
      </ElSpace>
    </template>

    <ElTable v-if="candidates.length" :data="candidates" stripe>
      <ElTableColumn label="预览" width="110">
        <template #default="{ row }">
          <ElImage :preview-src-list="[previewUrls[row.rowKey]]" :src="previewUrls[row.rowKey]" fit="cover" style="height: 64px; width: 64px" />
        </template>
      </ElTableColumn>
      <ElTableColumn label="图片文件" min-width="180" prop="fileName" />
      <ElTableColumn label="关联产品" min-width="260">
        <template #default="{ row }">
          <ElSelect
            :model-value="row.matchedProduct?.id || ''"
            filterable
            placeholder="选择关联产品"
            style="width: 100%"
            @change="(value: string) => handleProductChange(row, value)"
          >
            <ElOption v-for="product in products" :key="product.id" :label="`${product.model} / ${product.name}`" :value="product.id" />
          </ElSelect>
        </template>
      </ElTableColumn>
      <ElTableColumn label="状态" width="120">
        <template #default="{ row }">
          <ElTag :type="row.matchedProduct ? 'success' : 'warning'">
            {{ row.matchedProduct ? '已匹配' : '待确认' }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="提示" min-width="220" prop="warning" />
    </ElTable>
    <ElEmpty v-else description="当前 Excel 未提取到嵌入图片" />
  </ElCard>
</template>
