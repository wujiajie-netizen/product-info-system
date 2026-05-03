<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui';

import { h, ref, watch } from 'vue';
import { NButton, NCard, NDataTable, NEmpty, NTag } from 'naive-ui';
import { RouterLink } from 'vue-router';

import {
  createDocumentSignedUrl,
  formatDate,
  listDocuments,
} from '#/api/product-info';
import FrontShell from '#/components/FrontShell.vue';
import { useAuthState } from '#/lib/auth';
import { getErrorMessage } from '#/lib/errors';

const auth = useAuthState();
const loading = ref(false);
const errorMessage = ref('');
const quotes = ref<Awaited<ReturnType<typeof listDocuments>>>([]);

const columns: DataTableColumns<(typeof quotes.value)[number]> = [
  {
    title: '报价标题',
    key: 'title',
  },
  {
    title: '关联型号',
    key: 'product_model',
    render(row) {
      if (!row.product_model) {
        return '未关联';
      }

      return h(
        RouterLink,
        {
          to: { name: 'product-detail', params: { id: row.product_model } },
        },
        { default: () => row.product_model },
      );
    },
  },
  { title: '资料分类', key: 'category' },
  {
    title: '标签',
    key: 'tags',
    render(row) {
      return row.tags.length > 0
        ? row.tags.map((tag) =>
            h(
              NTag,
              {
                bordered: false,
                size: 'small',
                style: { marginRight: '6px' },
              },
              { default: () => tag },
            ),
          )
        : '-';
    },
  },
  {
    title: '更新时间',
    key: 'updated_at',
    render(row) {
      return formatDate(row.updated_at);
    },
  },
  {
    title: '操作',
    key: 'actions',
    render(row) {
      return h(
        NButton,
        {
          size: 'small',
          tertiary: true,
          type: 'primary',
          onClick: async () => {
            const url = await createDocumentSignedUrl(row);
            window.open(url, '_blank', 'noopener,noreferrer');
          },
        },
        { default: () => '打开文件' },
      );
    },
  },
];

async function loadQuotes() {
  loading.value = true;
  errorMessage.value = '';

  try {
    quotes.value = await listDocuments({ fileType: 'quote' });
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
      quotes.value = [];
      return;
    }

    void loadQuotes();
  },
  { immediate: true },
);
</script>

<template>
  <FrontShell>
    <section class="content-section shell-container">
      <div class="section-heading">
        <div>
          <h1>报价中心</h1>
          <p>集中查看 Supabase 里 file_type = quote 的报价资料。</p>
        </div>
      </div>
      <n-card>
        <n-data-table :columns="columns" :data="quotes" :loading="loading" />
        <n-empty v-if="!loading && errorMessage" :description="errorMessage" />
        <n-empty v-else-if="!loading && !quotes.length" description="暂无报价资料。" />
      </n-card>
    </section>
  </FrontShell>
</template>
