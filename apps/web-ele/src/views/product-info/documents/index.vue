<script lang="ts" setup>
import type { DocumentFileType, DocumentRecord, ProductRecord } from '#/api';
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
  ElTable,
  ElTableColumn,
  ElTag,
  ElUpload,
} from 'element-plus';

import {
  createDocument,
  createDocumentSignedUrl,
  listDocuments,
  listProducts,
} from '#/api';

const userStore = useUserStore();
const loading = ref(false);
const uploading = ref(false);
const keyword = ref('');
const documents = ref<DocumentRecord[]>([]);
const products = ref<ProductRecord[]>([]);
const dialogVisible = ref(false);
const selectedFile = ref<File>();

const isAdmin = computed(() => userStore.userRoles.includes('admin'));

const uploadForm = reactive({
  category: '',
  fileType: 'other' as DocumentFileType,
  productModel: '',
  tagsText: '',
  title: '',
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
  if (products.value.length === 0) {
    products.value = await listProducts();
  }
}

function handleFileChange(file: UploadFile) {
  selectedFile.value = file.raw;
  if (!uploadForm.title && file.name) {
    uploadForm.title = file.name;
  }
}

async function submitUpload() {
  if (!selectedFile.value) {
    ElMessage.warning('请选择要上传的文件');
    return;
  }

  try {
    uploading.value = true;
    await createDocument({
      category: uploadForm.category || '未分类',
      file: selectedFile.value,
      fileType: uploadForm.fileType,
      productModel: uploadForm.productModel || undefined,
      tags: uploadForm.tagsText
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      title: uploadForm.title,
    });
    ElMessage.success('文件已上传');
    dialogVisible.value = false;
    selectedFile.value = undefined;
    await loadDocuments();
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    uploading.value = false;
  }
}

async function openDocument(row: DocumentRecord) {
  try {
    const url = await createDocumentSignedUrl(row);
    window.open(url, '_blank', 'noopener,noreferrer');
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
}

onMounted(loadDocuments);
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
        <ElTableColumn label="文件类型" prop="file_type" width="120">
          <template #default="{ row }">
            <ElTag type="primary">{{ row.file_type }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="分类" prop="category" width="120" />
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

    <ElDialog v-model="dialogVisible" title="上传文件" width="520px">
      <ElForm label-width="88px">
        <ElFormItem label="标题">
          <ElInput v-model="uploadForm.title" placeholder="请输入文件标题" />
        </ElFormItem>
        <ElFormItem label="关联产品">
          <ElSelect
            v-model="uploadForm.productModel"
            clearable
            filterable
            placeholder="选择产品型号"
            style="width: 100%"
          >
            <ElOption
              v-for="product in products"
              :key="product.id"
              :label="`${product.model} - ${product.name}`"
              :value="product.model"
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
        <ElFormItem label="分类">
          <ElInput v-model="uploadForm.category" placeholder="例如 报价资料" />
        </ElFormItem>
        <ElFormItem label="标签">
          <ElInput v-model="uploadForm.tagsText" placeholder="多个标签用英文逗号分隔" />
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
