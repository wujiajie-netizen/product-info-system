<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui';

import { computed, h, ref, watch } from 'vue';
import { NCard, NDataTable, NEmpty, NInput, NTag } from 'naive-ui';
import { RouterLink } from 'vue-router';

import { formatDate, formatStatus, listProducts } from '#/api/product-info';
import FrontShell from '#/components/FrontShell.vue';
import { useAuthState } from '#/lib/auth';
import { getErrorMessage } from '#/lib/errors';

const keyword = ref('');
const auth = useAuthState();
const loading = ref(false);
const errorMessage = ref('');
const products = ref<Awaited<ReturnType<typeof listProducts>>>([]);

const rows = computed(() =>
  products.value.filter((item) => {
    const value = keyword.value.trim().toLowerCase();
    if (!value) {
      return true;
    }

    return `${item.model} ${item.name} ${item.category} ${item.tags.join(' ')}`
      .toLowerCase()
      .includes(value);
  }),
);

const columns: DataTableColumns<(typeof rows.value)[number]> = [
  {
    title: '型号',
    key: 'model',
    render(row) {
      return h(
        RouterLink,
        {
          to: { name: 'product-detail', params: { id: row.model } },
        },
        { default: () => row.model },
      );
    },
  },
  { title: '名称', key: 'name' },
  { title: '分类', key: 'category' },
  {
    title: '状态',
    key: 'status',
    render(row) {
      return h(
        NTag,
        {
          bordered: false,
          type: row.status === 'active' ? 'success' : 'default',
        },
        { default: () => formatStatus(row.status) },
      );
    },
  },
  {
    title: '标签',
    key: 'tag-summary',
    render(row) {
      return row.tags.length > 0 ? row.tags.join(' / ') : '-';
    },
  },
  {
    title: '更新时间',
    key: 'updatedAt',
    render(row) {
      return formatDate(row.updatedAt);
    },
  },
];

async function loadProducts() {
  loading.value = true;
  errorMessage.value = '';

  try {
    products.value = await listProducts();
  } catch (error) {
    errorMessage.value = getErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

watch(
  () => auth.user?.id,
  (userId) => {
    if (!userId) {
      products.value = [];
      return;
    }

    void loadProducts();
  },
  { immediate: true },
);
</script>

<template>
  <FrontShell>
    <section class="content-section shell-container">
      <div class="section-heading">
        <div>
          <h1>商品列表</h1>
          <p>按型号、分类、标签和更新时间快速定位商品资料。</p>
        </div>
      </div>
      <n-card>
        <n-input
          v-model:value="keyword"
          clearable
          placeholder="搜索型号、商品名、分类、标签"
          style="margin-bottom: 16px"
        />
        <n-data-table :columns="columns" :data="rows" :loading="loading" />
        <n-empty v-if="!loading && errorMessage" :description="errorMessage" />
        <n-empty v-else-if="!loading && !rows.length" description="没有匹配到商品。" />
      </n-card>
    </section>
  </FrontShell>
</template>
