<script setup lang="ts">
import { computed, ref } from 'vue';
import { ChevronDown } from 'lucide-vue-next';

import AppIcon from '#/components/AppIcon.vue';
import type {
  BrandFilter,
  CategoryGroup,
} from '#/views/product/product-list-data';

const props = withDefaults(
  defineProps<{
    brands: BrandFilter[];
    categoryGroups: CategoryGroup[];
    maxPrice: string;
    minPrice: string;
    selectedBrandSlugs: string[];
    selectedCategorySlug: string;
  }>(),
  {
    maxPrice: '',
    minPrice: '',
    selectedCategorySlug: '',
  },
);

const emit = defineEmits<{
  apply: [];
  reset: [];
  toggleBrand: [slug: string];
  'update:maxPrice': [value: string];
  'update:minPrice': [value: string];
  updateCategory: [slug: string];
}>();

function isBrandChecked(slug: string) {
  return props.selectedBrandSlugs.includes(slug);
}

const categoryKeyword = ref('');
const brandKeyword = ref('');
const categoryExpanded = ref(false);
const brandExpanded = ref(false);
const CATEGORY_VISIBLE_LIMIT = 8;
const BRAND_VISIBLE_LIMIT = 8;

const filteredCategoryGroups = computed(() => {
  const keyword = categoryKeyword.value.trim().toLowerCase();

  return props.categoryGroups
    .map((group) => ({
      ...group,
      options: group.options.filter((option) => {
        if (!keyword) {
          return true;
        }

        return option.label.toLowerCase().includes(keyword);
      }),
    }))
    .filter((group) => group.options.length > 0);
});

const visibleCategoryGroups = computed(() => {
  if (categoryExpanded.value) {
    return filteredCategoryGroups.value;
  }

  return filteredCategoryGroups.value.map((group) => ({
    ...group,
    options: group.options.slice(0, CATEGORY_VISIBLE_LIMIT),
  }));
});

const totalCategoryOptionCount = computed(() =>
  filteredCategoryGroups.value.reduce(
    (sum, group) => sum + group.options.length,
    0,
  ),
);

const visibleCategoryOptionCount = computed(() =>
  visibleCategoryGroups.value.reduce(
    (sum, group) => sum + group.options.length,
    0,
  ),
);

const filteredBrands = computed(() => {
  const keyword = brandKeyword.value.trim().toLowerCase();

  return props.brands.filter((brand) => {
    if (!keyword) {
      return true;
    }

    return brand.label.toLowerCase().includes(keyword);
  });
});

const visibleBrands = computed(() => {
  if (brandExpanded.value) {
    return filteredBrands.value;
  }

  return filteredBrands.value.slice(0, BRAND_VISIBLE_LIMIT);
});
</script>

<template>
  <div class="product-sidebar">
    <div class="product-sidebar__head">
      <strong>筛选条件</strong>
      <button type="button" @click="emit('reset')">重置</button>
    </div>

    <section class="product-sidebar__block">
      <div class="product-sidebar__title">
        <span>分类</span>
        <AppIcon :icon="ChevronDown" :size="14" />
      </div>
      <input
        v-model="categoryKeyword"
        class="product-sidebar__search"
        type="text"
        placeholder="搜索分类"
      />

      <div
        v-for="group in visibleCategoryGroups"
        :key="group.label"
        class="product-sidebar__group"
      >
        <button
          type="button"
          class="product-sidebar__group-label"
          @click="emit('updateCategory', group.options[0]?.slug ?? '')"
        >
          <span>{{ group.label }}</span>
          <span>({{ group.count.toLocaleString('zh-CN') }})</span>
        </button>

        <button
          v-for="option in group.options"
          :key="option.slug"
          type="button"
          class="product-sidebar__option"
          :class="{ 'is-active': selectedCategorySlug === option.slug }"
          @click="emit('updateCategory', option.slug)"
        >
          <span>{{ option.label }}</span>
          <span>({{ option.count.toLocaleString('zh-CN') }})</span>
        </button>
      </div>

      <button
        v-if="totalCategoryOptionCount > visibleCategoryOptionCount"
        class="product-sidebar__more"
        type="button"
        @click="categoryExpanded = true"
      >
        展开更多
      </button>
      <button
        v-else-if="categoryExpanded && totalCategoryOptionCount > CATEGORY_VISIBLE_LIMIT"
        class="product-sidebar__more"
        type="button"
        @click="categoryExpanded = false"
      >
        收起
      </button>
    </section>

    <section class="product-sidebar__block">
      <div class="product-sidebar__title">
        <span>品牌</span>
        <AppIcon :icon="ChevronDown" :size="14" />
      </div>
      <input
        v-model="brandKeyword"
        class="product-sidebar__search"
        type="text"
        placeholder="搜索品牌"
      />

      <label
        v-for="brand in visibleBrands"
        :key="brand.slug"
        class="product-sidebar__checkbox-row"
      >
        <input
          :checked="isBrandChecked(brand.slug)"
          type="checkbox"
          @change="emit('toggleBrand', brand.slug)"
        />
        <span>{{ brand.label }}</span>
        <span>({{ brand.count }})</span>
      </label>

      <button
        v-if="filteredBrands.length > visibleBrands.length"
        class="product-sidebar__more"
        type="button"
        @click="brandExpanded = true"
      >
        展开更多
      </button>
      <button
        v-else-if="brandExpanded && filteredBrands.length > BRAND_VISIBLE_LIMIT"
        class="product-sidebar__more"
        type="button"
        @click="brandExpanded = false"
      >
        收起
      </button>
    </section>

    <section class="product-sidebar__block">
      <div class="product-sidebar__title">
        <span>价格区间</span>
        <AppIcon :icon="ChevronDown" :size="14" />
      </div>

      <div class="product-sidebar__price-row">
        <div class="product-sidebar__price-box">
          <span>¥</span>
          <input
            :value="minPrice"
            type="text"
            placeholder="最低"
            @input="
              emit(
                'update:minPrice',
                ($event.target as HTMLInputElement).value,
              )
            "
          />
        </div>
        <span class="product-sidebar__price-dash">-</span>
        <div class="product-sidebar__price-box">
          <span>¥</span>
          <input
            :value="maxPrice"
            type="text"
            placeholder="最高"
            @input="
              emit(
                'update:maxPrice',
                ($event.target as HTMLInputElement).value,
              )
            "
          />
        </div>
        <button type="button" @click="emit('apply')">确定</button>
      </div>
    </section>

    <div class="product-sidebar__footer">
      <button class="is-primary" type="button" @click="emit('apply')">
        应用筛选
      </button>
      <button type="button" @click="emit('reset')">重置条件</button>
    </div>
  </div>
</template>

<style scoped>
.product-sidebar {
  display: grid;
  gap: 18px;
  padding: 14px 16px 16px;
  background: #fff;
}

.product-sidebar__head,
.product-sidebar__title,
.product-sidebar__group-label,
.product-sidebar__option,
.product-sidebar__checkbox-row,
.product-sidebar__price-row,
.product-sidebar__footer {
  display: flex;
  align-items: center;
}

.product-sidebar__head,
.product-sidebar__title,
.product-sidebar__group-label,
.product-sidebar__option,
.product-sidebar__checkbox-row {
  justify-content: space-between;
}

.product-sidebar__head strong {
  font-size: 14px;
  font-weight: 700;
  color: #12213d;
}

.product-sidebar__head button,
.product-sidebar__more {
  padding: 0;
  font-size: 12px;
  color: #1664d9;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.product-sidebar__block {
  display: grid;
  gap: 12px;
}

.product-sidebar__title {
  font-size: 13px;
  font-weight: 600;
  color: #233450;
}

.product-sidebar__search {
  width: 100%;
  height: 34px;
  padding: 0 10px;
  font: inherit;
  font-size: 12px;
  color: #233450;
  border: 1px solid #dfe6f2;
  border-radius: 4px;
  outline: none;
}

.product-sidebar__group {
  display: grid;
  gap: 8px;
}

.product-sidebar__group-label,
.product-sidebar__option {
  padding: 0;
  font-size: 13px;
  color: #52627d;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.product-sidebar__group-label {
  font-weight: 600;
  color: #233450;
}

.product-sidebar__option {
  padding-left: 14px;
}

.product-sidebar__option.is-active {
  color: #1664d9;
}

.product-sidebar__checkbox-row {
  gap: 10px;
  justify-content: flex-start;
  font-size: 13px;
  color: #52627d;
}

.product-sidebar__checkbox-row span:last-child {
  margin-left: auto;
}

.product-sidebar__checkbox-row input {
  width: 14px;
  height: 14px;
  margin: 0;
}

.product-sidebar__price-row {
  gap: 6px;
  align-items: center;
}

.product-sidebar__price-box {
  display: flex;
  flex: 1 1 0;
  gap: 6px;
  align-items: center;
  min-width: 0;
  height: 34px;
  padding: 0 10px;
  border: 1px solid #dfe6f2;
  border-radius: 4px;
}

.product-sidebar__price-box span,
.product-sidebar__price-dash {
  font-size: 12px;
  color: #7c8ca7;
}

.product-sidebar__price-box input {
  width: 100%;
  min-width: 0;
  font: inherit;
  font-size: 12px;
  color: #233450;
  border: 0;
  outline: none;
}

.product-sidebar__price-row button,
.product-sidebar__footer button {
  height: 34px;
  padding: 0 12px;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  color: #1664d9;
  cursor: pointer;
  background: #f6faff;
  border: 1px solid #dce7f7;
  border-radius: 4px;
}

.product-sidebar__footer {
  gap: 12px;
}

.product-sidebar__footer button {
  flex: 1 1 0;
}

.product-sidebar__footer .is-primary {
  color: #fff;
  background: linear-gradient(180deg, #1677ff 0%, #1664d9 100%);
  border-color: #1664d9;
}
</style>
