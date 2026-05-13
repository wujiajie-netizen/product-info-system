<script lang="ts" setup>
import type { ProductRecord, QuoteWithRelations, UpdateRecord, UpdateType } from '#/api';

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
} from 'element-plus';

import { createUpdate, listProducts, listQuotes, listUpdates } from '#/api';

const userStore = useUserStore();
const loading = ref(false);
const saving = ref(false);
const keyword = ref('');
const updates = ref<UpdateRecord[]>([]);
const products = ref<ProductRecord[]>([]);
const quotes = ref<QuoteWithRelations[]>([]);
const dialogVisible = ref(false);

const isAdmin = computed(() => userStore.userRoles.includes('admin'));
const quoteBatchOptions = computed(() => {
  const optionMap = new Map<string, { label: string; value: string }>();
  for (const quote of quotes.value) {
    const value = quote.batch_id || quote.id;
    if (optionMap.has(value)) {
      continue;
    }

    optionMap.set(value, {
      label:
        `${quote.batch_title || quote.quote_no || '未命名批次'} / ` +
        `${quote.product_model || quote.product?.model || '-'} / ` +
        `${quote.company?.name || '-'}`,
      value,
    });
  }

  return [...optionMap.values()];
});

const form = reactive({
  content: '',
  productModel: '',
  quoteBatchId: '',
  seriesId: '',
  title: '',
  type: 'notice' as UpdateType,
  variantId: '',
});

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

async function loadUpdates() {
  try {
    loading.value = true;
    updates.value = await listUpdates({ keyword: keyword.value });
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    loading.value = false;
  }
}

async function loadOptions() {
  try {
    const [productData, quoteData] = await Promise.all([
      listProducts(),
      listQuotes(),
    ]);
    products.value = productData;
    quotes.value = quoteData;
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
}

async function submitUpdate() {
  try {
    saving.value = true;
    await createUpdate({
      content: form.content,
      productModel: form.productModel || undefined,
      quoteBatchId: form.quoteBatchId || undefined,
      seriesId: form.seriesId || undefined,
      title: form.title,
      type: form.type,
      variantId: form.variantId || undefined,
    });
    ElMessage.success('动态已发布');
    dialogVisible.value = false;
    await loadUpdates();
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    saving.value = false;
  }
}

function handleProductChange(productId?: string) {
  const product = products.value.find((item) => item.id === productId);
  form.productModel = product?.model || '';
  form.seriesId = product?.series_id || '';
}

onMounted(async () => {
  await Promise.all([loadUpdates(), loadOptions()]);
});
</script>

<template>
  <Page description="同步报价更新、新品发布和内部通知" title="动态管理">
    <ElCard shadow="never">
      <ElSpace class="mb-4" wrap>
        <ElInput
          v-model="keyword"
          clearable
          placeholder="搜索动态、型号、内容"
          style="width: 320px"
          @clear="loadUpdates"
          @keyup.enter="loadUpdates"
        />
        <ElButton @click="loadUpdates">查询</ElButton>
        <ElButton v-if="isAdmin" type="primary" @click="dialogVisible = true">
          发布动态
        </ElButton>
      </ElSpace>
      <ElTable v-loading="loading" :data="updates" stripe>
        <ElTableColumn label="动态标题" min-width="220" prop="title" />
        <ElTableColumn label="类型" prop="type" width="140">
          <template #default="{ row }">
            <ElTag type="warning">{{ row.type }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="关联型号" prop="product_model" width="160" />
        <ElTableColumn label="内容摘要" min-width="220" prop="content" />
        <ElTableColumn label="更新时间" width="140">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </ElTableColumn>
        <template #empty>
          <ElEmpty description="暂无动态" />
        </template>
      </ElTable>
    </ElCard>

    <ElDialog v-model="dialogVisible" title="发布动态" width="520px">
      <ElForm label-width="88px">
        <ElFormItem label="标题">
          <ElInput v-model="form.title" placeholder="请输入动态标题" />
        </ElFormItem>
        <ElFormItem label="类型">
          <ElSelect v-model="form.type" style="width: 100%">
            <ElOption label="内部通知" value="notice" />
            <ElOption label="价格更新" value="price_update" />
            <ElOption label="产品动态" value="product" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="关联型号">
          <ElSelect
            v-model="form.variantId"
            clearable
            filterable
            placeholder="选择关联型号"
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
        <ElFormItem label="报价批次">
          <ElSelect
            v-model="form.quoteBatchId"
            clearable
            filterable
            placeholder="可选：关联报价批次"
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
        <ElFormItem label="内容">
          <ElInput
            v-model="form.content"
            :rows="4"
            placeholder="请输入动态内容"
            type="textarea"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton :loading="saving" type="primary" @click="submitUpdate">
          发布
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
