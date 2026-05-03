<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NButton, NCard, NEmpty, NGrid, NGridItem, NInput, NSpace, NSpin, NTag } from 'naive-ui';
import { RouterLink } from 'vue-router';

import {
  formatDate,
  formatUpdateType,
  getDashboardSummary,
} from '#/api/product-info';
import FrontShell from '#/components/FrontShell.vue';
import { useAuthState } from '#/lib/auth';
import { getErrorMessage } from '#/lib/errors';

const keyword = ref('');
const auth = useAuthState();
const loading = ref(false);
const errorMessage = ref('');
const summary = ref<Awaited<ReturnType<typeof getDashboardSummary>> | null>(null);

const filteredProducts = computed(() =>
  (summary.value?.products || []).filter((item) => {
    const value = keyword.value.trim().toLowerCase();
    if (!value) {
      return true;
    }

    return (
      item.model.toLowerCase().includes(value) ||
      item.name.toLowerCase().includes(value) ||
      item.category.toLowerCase().includes(value) ||
      item.tags.some((tag) => tag.toLowerCase().includes(value))
    );
  }),
);

async function loadDashboard() {
  loading.value = true;
  errorMessage.value = '';

  try {
    summary.value = await getDashboardSummary();
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
      summary.value = null;
      return;
    }

    void loadDashboard();
  },
  { immediate: true },
);
</script>

<template>
  <FrontShell>
    <section class="hero-section">
      <div class="shell-container hero-grid">
        <div>
          <n-tag type="warning" size="small">内部资料前台</n-tag>
          <h1>把商品、资料文件和更新动态，集中在一个可检索的前台入口。</h1>
          <p>
            面向销售、产品、采购和管理层，直接读取 Supabase
            里的真实商品数据，不再维护一套单独的 mock 接口。
          </p>
          <n-space vertical size="large">
            <n-input
              v-model:value="keyword"
              clearable
              placeholder="搜索型号、分类、标签、商品名称"
              size="large"
            />
            <n-space>
              <RouterLink to="/products">
                <n-button type="primary" size="large">查看商品库</n-button>
              </RouterLink>
              <RouterLink to="/quotes">
                <n-button secondary size="large">查看报价</n-button>
              </RouterLink>
            </n-space>
          </n-space>
        </div>
        <n-card class="hero-panel" embedded>
          <n-spin :show="loading">
            <dl v-if="summary" class="metric-list">
              <div>
                <dt>商品条目</dt>
                <dd>{{ summary.products.length }}</dd>
              </div>
              <div>
                <dt>资料文件</dt>
                <dd>{{ summary.documentCount }}</dd>
              </div>
              <div>
                <dt>报价资料</dt>
                <dd>{{ summary.quoteCount }}</dd>
              </div>
              <div>
                <dt>更新动态</dt>
                <dd>{{ summary.updateCount }}</dd>
              </div>
            </dl>
            <n-empty v-else description="登录后即可查看实时统计。" />
          </n-spin>
        </n-card>
      </div>
    </section>

    <section class="content-section shell-container" v-if="errorMessage">
      <n-card>
        <n-empty :description="errorMessage" />
      </n-card>
    </section>

    <section v-else class="content-section shell-container">
      <div class="section-heading">
        <h2>分类入口</h2>
        <RouterLink to="/categories">查看全部</RouterLink>
      </div>
      <n-grid :cols="3" :x-gap="16" :y-gap="16" v-if="summary?.categories.length">
        <n-grid-item v-for="item in summary.categories" :key="item.name">
          <RouterLink
            :to="{ name: 'categories', params: { slug: item.name } }"
            class="block-link"
          >
            <n-card hoverable class="category-card lift-card">
              <strong>{{ item.name }}</strong>
              <p>最近更新：{{ item.latestUpdatedAtLabel }}</p>
              <span>{{ item.count }} 个商品条目</span>
              <ul class="data-points tight">
                <li v-for="model in item.sampleModels" :key="model">{{ model }}</li>
              </ul>
            </n-card>
          </RouterLink>
        </n-grid-item>
      </n-grid>
      <n-card v-else>
        <n-empty description="当前还没有分类数据。" />
      </n-card>
    </section>

    <section class="content-section shell-container">
      <div class="section-heading">
        <h2>商品速览</h2>
        <RouterLink to="/products">进入列表</RouterLink>
      </div>
      <n-grid :cols="3" :x-gap="16" :y-gap="16" v-if="filteredProducts.length">
        <n-grid-item v-for="item in filteredProducts" :key="item.id">
          <RouterLink
            :to="{ name: 'product-detail', params: { id: item.model } }"
            class="block-link"
          >
            <n-card hoverable class="lift-card">
              <n-space justify="space-between">
                <strong>{{ item.model }}</strong>
                <n-tag size="small" :type="item.status === 'active' ? 'success' : 'default'">
                  {{ item.category }}
                </n-tag>
              </n-space>
              <h3 class="card-title">{{ item.name }}</h3>
              <p>{{ item.summary }}</p>
              <ul class="data-points tight">
                <li v-for="entry in item.specEntries.slice(0, 3)" :key="entry.key">
                  {{ entry.label }}：{{ entry.value }}
                </li>
              </ul>
            </n-card>
          </RouterLink>
        </n-grid-item>
      </n-grid>
      <n-card v-else>
        <n-empty description="没有匹配到商品。" />
      </n-card>
    </section>

    <section class="content-section shell-container two-column">
      <div>
        <div class="section-heading">
          <h2>最新报价</h2>
          <RouterLink to="/quotes">更多</RouterLink>
        </div>
        <n-card
          v-for="item in summary?.latestQuotes || []"
          :key="item.id"
          class="stack-card"
          hoverable
        >
          <n-space justify="space-between">
            <strong>{{ item.title }}</strong>
            <n-tag size="small">{{ item.product_model || '未关联型号' }}</n-tag>
          </n-space>
          <p>{{ item.category }}</p>
          <span>{{ formatDate(item.updated_at) }} · {{ item.tags.join(' / ') || '报价资料' }}</span>
        </n-card>
        <n-card v-if="!summary?.latestQuotes.length">
          <n-empty description="暂无报价资料。" />
        </n-card>
      </div>
      <div>
        <div class="section-heading">
          <h2>更新动态</h2>
          <RouterLink to="/updates">更多</RouterLink>
        </div>
        <n-card
          v-for="item in summary?.latestUpdates || []"
          :key="item.id"
          class="stack-card"
          hoverable
        >
          <n-space justify="space-between">
            <strong>{{ item.title }}</strong>
            <n-tag size="small" :type="item.type === 'price_update' ? 'error' : 'info'">
              {{ formatUpdateType(item.type) }}
            </n-tag>
          </n-space>
          <span>{{ formatDate(item.created_at) }}</span>
        </n-card>
        <n-card v-if="!summary?.latestUpdates.length">
          <n-empty description="暂无更新动态。" />
        </n-card>
      </div>
    </section>
  </FrontShell>
</template>
