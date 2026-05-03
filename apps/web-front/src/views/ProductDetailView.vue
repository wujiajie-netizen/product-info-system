<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NEmpty,
  NGrid,
  NGridItem,
  NResult,
  NSpace,
  NSpin,
  NTag,
} from 'naive-ui';

import {
  createDocumentSignedUrl,
  formatDate,
  formatDocumentType,
  formatStatus,
  formatUpdateType,
  getProductDetail,
} from '#/api/product-info';
import FrontShell from '#/components/FrontShell.vue';
import { useAuthState } from '#/lib/auth';
import { getErrorMessage } from '#/lib/errors';

const props = defineProps<{
  id: string;
}>();

const auth = useAuthState();
const loading = ref(false);
const errorMessage = ref('');
const detail = ref<Awaited<ReturnType<typeof getProductDetail>>>(null);

const product = computed(() => detail.value?.product || null);
const relatedQuotes = computed(() =>
  (detail.value?.documents || []).filter((item) => item.file_type === 'quote'),
);
const relatedDocuments = computed(() =>
  (detail.value?.documents || []).filter((item) => item.file_type !== 'quote'),
);

async function loadDetail() {
  loading.value = true;
  errorMessage.value = '';

  try {
    detail.value = await getProductDetail(props.id);
  } catch (error) {
    detail.value = null;
    errorMessage.value = getErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function openDocument(document: NonNullable<typeof detail.value>['documents'][number]) {
  const url = await createDocumentSignedUrl(document);
  window.open(url, '_blank', 'noopener,noreferrer');
}

watch(
  () => [auth.user?.id, props.id],
  ([userId]) => {
    if (!userId) {
      detail.value = null;
      return;
    }

    void loadDetail();
  },
  { immediate: true },
);
</script>

<template>
  <FrontShell>
    <section class="content-section shell-container">
      <n-spin :show="loading">
        <n-card v-if="errorMessage">
          <n-empty :description="errorMessage" />
        </n-card>
        <n-result
          v-else-if="!product"
          description="没有找到该型号对应的商品记录。"
          status="404"
          title="商品不存在"
        />
        <template v-else>
          <div class="section-heading">
            <div>
              <div class="detail-header">
                <h1>{{ product.model }}</h1>
                <n-tag :type="product.status === 'active' ? 'success' : 'default'">
                  {{ formatStatus(product.status) }}
                </n-tag>
                <n-tag>{{ product.category }}</n-tag>
              </div>
              <p class="detail-summary">{{ product.name }} · {{ product.summary }}</p>
              <div class="inline-meta">
                <span class="meta-chip">更新时间：{{ formatDate(product.updatedAt) }}</span>
                <span class="meta-chip">标签：{{ product.tags.join(' / ') || '暂无' }}</span>
              </div>
            </div>
          </div>

          <n-grid :cols="2" :x-gap="16" :y-gap="16">
            <n-grid-item>
              <n-card title="基础信息">
                <n-descriptions label-placement="left" :column="1" bordered>
                  <n-descriptions-item label="型号">{{ product.model }}</n-descriptions-item>
                  <n-descriptions-item label="名称">{{ product.name }}</n-descriptions-item>
                  <n-descriptions-item label="分类">{{ product.category }}</n-descriptions-item>
                  <n-descriptions-item label="状态">
                    {{ formatStatus(product.status) }}
                  </n-descriptions-item>
                  <n-descriptions-item label="更新时间">
                    {{ formatDate(product.updatedAt) }}
                  </n-descriptions-item>
                </n-descriptions>
              </n-card>
            </n-grid-item>
            <n-grid-item>
              <n-card title="规格参数">
                <div v-if="product.specEntries.length" class="spec-grid">
                  <div v-for="entry in product.specEntries" :key="entry.key" class="spec-row">
                    <strong>{{ entry.label }}</strong>
                    <span>{{ entry.value }}</span>
                  </div>
                </div>
                <n-empty v-else description="该商品暂未补充规格参数。" />
              </n-card>
            </n-grid-item>
            <n-grid-item>
              <n-card title="关联报价">
                <div v-if="relatedQuotes.length" class="quote-grid">
                  <div v-for="item in relatedQuotes" :key="item.id" class="quote-row">
                    <strong>{{ item.title }}</strong>
                    <p>{{ item.tags.join(' / ') || '报价资料' }}</p>
                    <div class="table-actions">
                      <span>{{ formatDate(item.updated_at) }}</span>
                      <n-button size="small" tertiary type="primary" @click="openDocument(item)">
                        打开文件
                      </n-button>
                    </div>
                  </div>
                </div>
                <n-empty v-else description="当前没有报价文件。" />
              </n-card>
            </n-grid-item>
            <n-grid-item>
              <n-card title="资料文件">
                <div v-if="relatedDocuments.length" class="quote-grid">
                  <div v-for="item in relatedDocuments" :key="item.id" class="quote-row">
                    <strong>{{ item.title }}</strong>
                    <p>{{ formatDocumentType(item.file_type) }} · {{ item.category }}</p>
                    <div class="table-actions">
                      <span>{{ formatDate(item.updated_at) }}</span>
                      <n-button size="small" tertiary type="primary" @click="openDocument(item)">
                        打开文件
                      </n-button>
                    </div>
                  </div>
                </div>
                <n-empty v-else description="当前没有补充资料文件。" />
              </n-card>
            </n-grid-item>
            <n-grid-item :span="2">
              <n-card title="相关动态">
                <div v-if="detail?.updates.length" class="quote-grid">
                  <div v-for="item in detail?.updates" :key="item.id" class="quote-row">
                    <n-space justify="space-between">
                      <strong>{{ item.title }}</strong>
                      <n-tag :type="item.type === 'price_update' ? 'error' : 'info'">
                        {{ formatUpdateType(item.type) }}
                      </n-tag>
                    </n-space>
                    <p>{{ item.content || '暂无补充说明' }}</p>
                    <span>{{ formatDate(item.created_at) }}</span>
                  </div>
                </div>
                <n-empty v-else description="当前没有相关动态。" />
              </n-card>
            </n-grid-item>
          </n-grid>
        </template>
      </n-spin>
    </section>
  </FrontShell>
</template>
