<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NCard, NEmpty, NGrid, NGridItem, NSpin, NTag } from 'naive-ui';
import { RouterLink } from 'vue-router';

import { listProducts } from '#/api/product-info';
import FrontShell from '#/components/FrontShell.vue';
import { useAuthState } from '#/lib/auth';
import { getErrorMessage } from '#/lib/errors';

const props = defineProps<{
  slug?: string;
}>();

const auth = useAuthState();
const loading = ref(false);
const errorMessage = ref('');
const products = ref<Awaited<ReturnType<typeof listProducts>>>([]);

const categories = computed(() => {
  const grouped = new Map<string, typeof products.value>();

  for (const product of products.value) {
    const group = grouped.get(product.category) || [];
    group.push(product);
    grouped.set(product.category, group);
  }

  return [...grouped.entries()]
    .map(([name, items]) => ({
      count: items.length,
      name,
      products: items,
    }))
    .sort((left, right) => right.count - left.count);
});

const currentCategory = computed(() =>
  categories.value.find((item) => item.name === props.slug),
);

const visibleProducts = computed(() => {
  if (!props.slug) {
    return products.value;
  }

  return products.value.filter((item) => item.category === props.slug);
});

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
      <n-spin :show="loading">
        <div class="section-heading">
          <div>
            <h1>{{ currentCategory?.name ?? '全部分类' }}</h1>
            <p>
              {{
                currentCategory
                  ? '按分类浏览当前商品和关键参数。'
                  : '从 Supabase 商品表中按 category 自动汇总分类。'
              }}
            </p>
          </div>
          <n-tag>{{ visibleProducts.length }} 个商品</n-tag>
        </div>

        <n-card v-if="errorMessage">
          <n-empty :description="errorMessage" />
        </n-card>

        <template v-else>
          <div v-if="!props.slug" class="content-section" style="padding: 0 0 24px">
            <div class="section-heading">
              <h2>分类列表</h2>
            </div>
            <n-grid :cols="3" :x-gap="16" :y-gap="16">
              <n-grid-item v-for="item in categories" :key="item.name">
                <RouterLink
                  :to="{ name: 'categories', params: { slug: item.name } }"
                  class="block-link"
                >
                  <n-card hoverable class="category-card lift-card">
                    <strong>{{ item.name }}</strong>
                    <p>共 {{ item.count }} 个商品</p>
                    <span>{{ item.products.slice(0, 3).map((product) => product.model).join(' · ') }}</span>
                  </n-card>
                </RouterLink>
              </n-grid-item>
            </n-grid>
          </div>

          <n-grid :cols="3" :x-gap="16" :y-gap="16" v-if="visibleProducts.length">
            <n-grid-item v-for="item in visibleProducts" :key="item.id">
              <RouterLink
                :to="{ name: 'product-detail', params: { id: item.model } }"
                class="block-link"
              >
                <n-card hoverable class="lift-card">
                  <strong>{{ item.model }}</strong>
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
            <n-empty description="当前分类下暂无商品。" />
          </n-card>
        </template>
      </n-spin>
    </section>
  </FrontShell>
</template>
