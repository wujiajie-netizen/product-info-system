<script lang="ts" setup>
import type { UpdateRecord, UpdateType } from '#/api';

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

import { createUpdate, listUpdates } from '#/api';

const userStore = useUserStore();
const loading = ref(false);
const saving = ref(false);
const keyword = ref('');
const updates = ref<UpdateRecord[]>([]);
const dialogVisible = ref(false);

const isAdmin = computed(() => userStore.userRoles.includes('admin'));

const form = reactive({
  content: '',
  productModel: '',
  title: '',
  type: 'notice' as UpdateType,
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

async function submitUpdate() {
  try {
    saving.value = true;
    await createUpdate({
      content: form.content,
      productModel: form.productModel || undefined,
      title: form.title,
      type: form.type,
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

onMounted(loadUpdates);
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
          <ElInput v-model="form.productModel" placeholder="可选" />
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
