<script lang="ts" setup>
import type { CategoryRecord, CategoryStatus } from '@/api';

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
  ElInputNumber,
  ElMessage,
  ElOption,
  ElPopconfirm,
  ElSelect,
  ElSpace,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  createCategory,
  listCategories,
  setCategoryStatus,
  updateCategory,
} from '@/api';

const userStore = useUserStore();
const loading = ref(false);
const saving = ref(false);
const keyword = ref('');
const categories = ref<CategoryRecord[]>([]);
const allCategories = ref<CategoryRecord[]>([]);
const dialogVisible = ref(false);
const editingCategory = ref<CategoryRecord>();

const isAdmin = computed(() => userStore.userRoles.includes('admin'));
const dialogTitle = computed(() =>
  editingCategory.value ? '编辑分类' : '新增分类',
);
const categoryNameMap = computed(
  () =>
    new Map(
      allCategories.value.map((category) => [category.id, category.name]),
    ),
);
const parentOptions = computed(() =>
  allCategories.value.filter(
    (category) => category.id !== editingCategory.value?.id,
  ),
);

const form = reactive({
  description: '',
  name: '',
  parentId: '' as null | string,
  slug: '',
  sortOrder: 0,
  status: 'active' as CategoryStatus,
});

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function getParentName(parentId: null | string) {
  return parentId ? categoryNameMap.value.get(parentId) || '-' : '-';
}

async function loadCategories() {
  try {
    loading.value = true;
    const normalizedKeyword = keyword.value.trim();

    if (normalizedKeyword) {
      const [tableCategories, categoryOptions] = await Promise.all([
        listCategories({ keyword: normalizedKeyword }),
        listCategories(),
      ]);

      categories.value = tableCategories;
      allCategories.value = categoryOptions;
    } else {
      categories.value = await listCategories();
      allCategories.value = categories.value;
    }
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  editingCategory.value = undefined;
  form.description = '';
  form.name = '';
  form.parentId = '';
  form.slug = '';
  form.sortOrder = 0;
  form.status = 'active';
}

function openCreateDialog() {
  resetForm();
  dialogVisible.value = true;
}

function openEditDialog(row: CategoryRecord) {
  editingCategory.value = row;
  form.description = row.description || '';
  form.name = row.name;
  form.parentId = row.parent_id || '';
  form.slug = row.slug;
  form.sortOrder = row.sort_order || 0;
  form.status = row.status === 'inactive' ? 'inactive' : 'active';
  dialogVisible.value = true;
}

function buildCategoryInput() {
  const name = form.name.trim();

  if (!name) {
    throw new Error('请填写分类名称');
  }

  return {
    description: form.description.trim(),
    name,
    parentId: form.parentId || null,
    slug: form.slug.trim(),
    sortOrder: form.sortOrder || 0,
    status: form.status,
  };
}

async function submitCategory() {
  try {
    saving.value = true;
    const input = buildCategoryInput();

    if (editingCategory.value) {
      await updateCategory(editingCategory.value.id, input);
      ElMessage.success('分类已更新');
    } else {
      await createCategory(input);
      ElMessage.success('分类已新增');
    }

    dialogVisible.value = false;
    await loadCategories();
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    saving.value = false;
  }
}

async function handleStatusChange(row: CategoryRecord) {
  const nextStatus: CategoryStatus =
    row.status === 'active' ? 'inactive' : 'active';

  try {
    await setCategoryStatus(row.id, nextStatus);
    ElMessage.success(nextStatus === 'active' ? '分类已启用' : '分类已停用');
    await loadCategories();
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
}

onMounted(loadCategories);
</script>

<template>
  <Page description="维护产品分类层级、排序和展示状态" title="分类管理">
    <ElCard shadow="never">
      <ElSpace class="mb-4" wrap>
        <ElInput
          v-model="keyword"
          clearable
          placeholder="搜索分类名称、slug"
          style="width: 320px"
          @clear="loadCategories"
          @keyup.enter="loadCategories"
        />
        <ElButton @click="loadCategories">查询</ElButton>
        <ElButton v-if="isAdmin" type="primary" @click="openCreateDialog">
          新增分类
        </ElButton>
      </ElSpace>
      <ElTable v-loading="loading" :data="categories" stripe>
        <ElTableColumn label="分类名称" min-width="200" prop="name" />
        <ElTableColumn label="父级分类" min-width="160">
          <template #default="{ row }">
            {{ getParentName(row.parent_id) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="Slug" min-width="180" prop="slug" />
        <ElTableColumn label="排序" prop="sort_order" width="90" />
        <ElTableColumn label="状态" prop="status" width="100">
          <template #default="{ row }">
            <ElTag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '启用' : '停用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="更新时间" width="140">
          <template #default="{ row }">
            {{ formatDate(row.updated_at) }}
          </template>
        </ElTableColumn>
        <ElTableColumn v-if="isAdmin" fixed="right" label="操作" width="150">
          <template #default="{ row }">
            <ElButton link type="primary" @click="openEditDialog(row)">
              编辑
            </ElButton>
            <ElPopconfirm
              :title="
                row.status === 'active'
                  ? '确认停用该分类？'
                  : '确认启用该分类？'
              "
              @confirm="handleStatusChange(row)"
            >
              <template #reference>
                <ElButton link type="primary">
                  {{ row.status === 'active' ? '停用' : '启用' }}
                </ElButton>
              </template>
            </ElPopconfirm>
          </template>
        </ElTableColumn>
        <template #empty>
          <ElEmpty description="暂无分类资料" />
        </template>
      </ElTable>
    </ElCard>

    <ElDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="560px"
      @closed="resetForm"
    >
      <ElForm label-width="88px">
        <ElFormItem label="分类名称">
          <ElInput v-model="form.name" placeholder="请输入分类名称" />
        </ElFormItem>
        <ElFormItem label="父级分类">
          <ElSelect
            v-model="form.parentId"
            clearable
            filterable
            placeholder="选择父级分类"
            style="width: 100%"
          >
            <ElOption
              v-for="category in parentOptions"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="Slug">
          <ElInput v-model="form.slug" placeholder="留空时按名称自动生成" />
        </ElFormItem>
        <ElFormItem label="排序">
          <ElInputNumber
            v-model="form.sortOrder"
            :min="0"
            controls-position="right"
            style="width: 100%"
          />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="form.status" style="width: 100%">
            <ElOption label="启用" value="active" />
            <ElOption label="停用" value="inactive" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput
            v-model="form.description"
            :rows="4"
            placeholder="请输入分类描述"
            type="textarea"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton :loading="saving" type="primary" @click="submitCategory">
          保存
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
