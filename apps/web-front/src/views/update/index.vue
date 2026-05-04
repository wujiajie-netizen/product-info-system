<script setup lang="ts">
import { ref, watch } from 'vue';
import { NCard, NEmpty, NTag } from 'naive-ui';

import { formatDate, formatUpdateType, listUpdates } from '#/api/product-info';
import AppIcon from '#/components/AppIcon.vue';
import FrontShell from '#/components/FrontShell.vue';
import { getUpdateTypeIcon } from '#/lib/front-icons';
import { useAuthState } from '#/lib/auth';
import { getErrorMessage } from '#/lib/errors';

const auth = useAuthState();
const loading = ref(false);
const errorMessage = ref('');
const updates = ref<Awaited<ReturnType<typeof listUpdates>>>([]);

async function loadUpdates() {
  loading.value = true;
  errorMessage.value = '';

  try {
    updates.value = await listUpdates();
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
      updates.value = [];
      return;
    }

    void loadUpdates();
  },
  { immediate: true },
);
</script>

<template>
  <FrontShell>
    <section class="content-section shell-container">
      <div class="section-heading">
        <div>
          <h1>更新动态</h1>
          <p>统一查看新产品、报价变更、资料上传和内部通知。</p>
        </div>
      </div>
      <n-card v-if="errorMessage">
        <n-empty :description="errorMessage" />
      </n-card>
      <n-card v-else-if="!loading && !updates.length">
        <n-empty description="暂无更新动态。" />
      </n-card>
      <n-card
        v-for="item in updates"
        v-else
        :key="item.id"
        class="stack-card"
        hoverable
      >
        <div class="update-row">
          <div>
            <strong>{{ item.title }}</strong>
            <p>{{ item.content || '暂无补充说明' }}</p>
            <span>{{ formatDate(item.created_at) }}</span>
          </div>
          <n-tag :type="item.type === 'price_update' ? 'error' : 'info'">
            <span class="tag-with-icon">
              <AppIcon :icon="getUpdateTypeIcon(item.type)" :size="14" />
              {{ formatUpdateType(item.type) }}
            </span>
          </n-tag>
        </div>
      </n-card>
    </section>
  </FrontShell>
</template>
