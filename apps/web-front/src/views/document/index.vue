<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NButton, NCard, NEmpty, NInput, NSelect, NTag } from 'naive-ui';
import { RouterLink } from 'vue-router';

import {
  createDocumentSignedUrl,
  formatDate,
  formatDocumentType,
  isUsingDemoData,
  listDocuments,
} from '#/api/product-info';
import AppIcon from '#/components/AppIcon.vue';
import FrontShell from '#/components/FrontShell.vue';
import {
  getDocumentTypeIcon,
  quickEntryIcons,
  searchIcon,
} from '#/lib/front-icons';
import { useAuthState } from '#/lib/auth';
import { getErrorMessage } from '#/lib/errors';

const auth = useAuthState();
const loading = ref(false);
const errorMessage = ref('');
const keyword = ref('');
const fileType = ref<string | null>(null);
const documents = ref<Awaited<ReturnType<typeof listDocuments>>>([]);

const typeOptions = [
  { label: '规格书', value: 'spec' },
  { label: '技术资料', value: 'technical' },
  { label: '图片', value: 'image' },
  { label: '报价附件', value: 'quote' },
  { label: '其他', value: 'other' },
];

const visibleDocuments = computed(() => {
  const value = keyword.value.trim().toLowerCase();

  return documents.value.filter((item) => {
    if (fileType.value && item.file_type !== fileType.value) {
      return false;
    }

    if (!value) {
      return true;
    }

    return `${item.title} ${item.product_model || ''} ${item.category} ${item.tags.join(' ')}`
      .toLowerCase()
      .includes(value);
  });
});

async function openDocument(document: (typeof documents.value)[number]) {
  const url = await createDocumentSignedUrl(document);

  if (url && url !== '#') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

async function loadDocuments() {
  loading.value = true;
  errorMessage.value = '';

  try {
    documents.value = await listDocuments();
  } catch (error) {
    errorMessage.value = getErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

watch(
  () => [auth.user?.id, isUsingDemoData()],
  ([userId, demoMode]) => {
    if (!userId && !demoMode) {
      documents.value = [];
      return;
    }

    void loadDocuments();
  },
  { immediate: true },
);
</script>

<template>
  <FrontShell>
    <section class="content-section shell-container">
      <div class="section-heading">
        <div>
          <h1>资料中心</h1>
          <p>
            集中查看规格书、技术资料、图片与报价附件，资料路径保留 Storage
            对象结构。
          </p>
        </div>
        <n-tag>
          <span class="tag-with-icon">
            <AppIcon :icon="quickEntryIcons.资料" :size="14" />
            {{ visibleDocuments.length }} 份资料
          </span>
        </n-tag>
      </div>

      <div class="toolbar-row">
        <n-input
          v-model:value="keyword"
          clearable
          placeholder="搜索标题、型号、资料分类"
        >
          <template #prefix>
            <AppIcon :icon="searchIcon" :size="16" />
          </template>
        </n-input>
        <n-select
          v-model:value="fileType"
          clearable
          placeholder="资料类型"
          :options="typeOptions"
        />
      </div>

      <n-card v-if="errorMessage">
        <n-empty :description="errorMessage" />
      </n-card>

      <div v-else-if="visibleDocuments.length" class="document-grid">
        <n-card
          v-for="item in visibleDocuments"
          :key="item.id"
          class="document-card"
          hoverable
        >
          <div class="card-badge-row">
            <span class="card-type-icon document-type-icon">
              <AppIcon :icon="getDocumentTypeIcon(item.file_type)" :size="18" />
            </span>
            <n-tag size="small" type="info">{{
              formatDocumentType(item.file_type)
            }}</n-tag>
          </div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.category }} · {{ formatDate(item.updated_at) }}</p>
          <RouterLink
            v-if="item.product_model"
            :to="{
              name: 'product-detail',
              params: { productId: item.product_model },
            }"
          >
            {{ item.product_model }}
          </RouterLink>
          <n-button
            size="small"
            tertiary
            type="primary"
            @click="openDocument(item)"
          >
            打开资料
          </n-button>
        </n-card>
      </div>

      <n-card v-else :loading="loading">
        <n-empty description="暂无资料。" />
      </n-card>
    </section>
  </FrontShell>
</template>
