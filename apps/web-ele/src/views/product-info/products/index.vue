<script lang="ts" setup>
import type { ProductRecord } from '#/api';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  ElButton,
  ElCard,
  ElEmpty,
  ElInput,
  ElMessage,
  ElSpace,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { listProducts } from '#/api';

const userStore = useUserStore();
const loading = ref(false);
const keyword = ref('');
const products = ref<ProductRecord[]>([]);

const isAdmin = computed(() => userStore.userRoles.includes('admin'));

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

async function loadProducts() {
  try {
    loading.value = true;
    products.value = await listProducts({ keyword: keyword.value });
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    loading.value = false;
  }
}

onMounted(loadProducts);
</script>

<template>
  <Page description="维护产品分类、型号、名称和规格参数" title="产品管理">
    <ElCard shadow="never">
      <ElSpace class="mb-4" wrap>
        <ElInput
          v-model="keyword"
          clearable
          placeholder="搜索型号、名称、分类"
          style="width: 320px"
          @clear="loadProducts"
          @keyup.enter="loadProducts"
        />
        <ElButton @click="loadProducts">查询</ElButton>
        <ElButton v-if="isAdmin" type="primary">新增产品</ElButton>
      </ElSpace>
      <ElTable v-loading="loading" :data="products" stripe>
        <ElTableColumn label="产品型号" prop="model" width="160" />
        <ElTableColumn label="产品名称" min-width="220" prop="name" />
        <ElTableColumn label="分类" prop="category" width="120" />
        <ElTableColumn label="状态" prop="status" width="100">
          <template #default="{ row }">
            <ElTag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '启用' : '停用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="标签" min-width="180">
          <template #default="{ row }">
            <ElSpace wrap>
              <ElTag v-for="tag in row.tags" :key="tag" type="info">
                {{ tag }}
              </ElTag>
            </ElSpace>
          </template>
        </ElTableColumn>
        <ElTableColumn label="更新时间" width="140">
          <template #default="{ row }">
            {{ formatDate(row.updated_at) }}
          </template>
        </ElTableColumn>
        <template #empty>
          <ElEmpty description="暂无产品资料" />
        </template>
      </ElTable>
    </ElCard>
  </Page>
</template>
