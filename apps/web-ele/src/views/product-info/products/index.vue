<script lang="ts" setup>
import type { ProductRecord, ProductStatus } from '#/api';

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
  createProduct,
  listProducts,
  setProductStatus,
  updateProduct,
} from '#/api';

const userStore = useUserStore();
const loading = ref(false);
const saving = ref(false);
const keyword = ref('');
const products = ref<ProductRecord[]>([]);
const dialogVisible = ref(false);
const editingProduct = ref<ProductRecord>();

const isAdmin = computed(() => userStore.userRoles.includes('admin'));
const dialogTitle = computed(() =>
  editingProduct.value ? '编辑产品' : '新增产品',
);

const form = reactive({
  category: '',
  model: '',
  name: '',
  specJsonText: '{}',
  status: 'active' as ProductStatus,
  tagsText: '',
});

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

function resetForm() {
  editingProduct.value = undefined;
  form.category = '';
  form.model = '';
  form.name = '';
  form.specJsonText = '{}';
  form.status = 'active';
  form.tagsText = '';
}

function openCreateDialog() {
  resetForm();
  dialogVisible.value = true;
}

function openEditDialog(row: ProductRecord) {
  editingProduct.value = row;
  form.category = row.category;
  form.model = row.model;
  form.name = row.name;
  form.specJsonText = JSON.stringify(row.spec_json || {}, null, 2);
  form.status = row.status === 'inactive' ? 'inactive' : 'active';
  form.tagsText = row.tags.join(', ');
  dialogVisible.value = true;
}

function parseSpecJson() {
  try {
    const value = JSON.parse(form.specJsonText || '{}');

    if (!value || Array.isArray(value) || typeof value !== 'object') {
      throw new Error('规格参数必须是 JSON 对象');
    }

    return value as Record<string, unknown>;
  } catch (error) {
    throw new Error((error as Error).message || '规格参数 JSON 格式不正确', { cause: error });
  }
}

function buildProductInput() {
  const model = form.model.trim();
  const name = form.name.trim();
  const category = form.category.trim();

  if (!model || !name || !category) {
    throw new Error('请填写产品型号、名称和分类');
  }

  return {
    category,
    model,
    name,
    specJson: parseSpecJson(),
    status: form.status,
    tags: form.tagsText
      .split(/[,，]/)
      .map((tag) => tag.trim())
      .filter(Boolean),
  };
}

async function submitProduct() {
  try {
    saving.value = true;
    const input = buildProductInput();

    if (editingProduct.value) {
      await updateProduct(editingProduct.value.id, input);
      ElMessage.success('产品已更新');
    } else {
      await createProduct(input);
      ElMessage.success('产品已新增');
    }

    dialogVisible.value = false;
    await loadProducts();
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    saving.value = false;
  }
}

async function handleStatusChange(row: ProductRecord) {
  const nextStatus: ProductStatus =
    row.status === 'active' ? 'inactive' : 'active';

  try {
    await setProductStatus(row.id, nextStatus);
    ElMessage.success(nextStatus === 'active' ? '产品已启用' : '产品已停用');
    await loadProducts();
  } catch (error) {
    ElMessage.error((error as Error).message);
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
        <ElButton v-if="isAdmin" type="primary" @click="openCreateDialog">
          新增产品
        </ElButton>
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
        <ElTableColumn v-if="isAdmin" fixed="right" label="操作" width="150">
          <template #default="{ row }">
            <ElButton link type="primary" @click="openEditDialog(row)">
              编辑
            </ElButton>
            <ElPopconfirm
              :title="
                row.status === 'active'
                  ? '确认停用该产品？'
                  : '确认启用该产品？'
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
          <ElEmpty description="暂无产品资料" />
        </template>
      </ElTable>
    </ElCard>

    <ElDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="560px"
      @closed="resetForm"
    >
      <ElForm label-width="96px">
        <ElFormItem label="产品型号">
          <ElInput v-model="form.model" placeholder="例如 SEN-1000" />
        </ElFormItem>
        <ElFormItem label="产品名称">
          <ElInput v-model="form.name" placeholder="请输入产品名称" />
        </ElFormItem>
        <ElFormItem label="分类">
          <ElInput v-model="form.category" placeholder="例如 传感器" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="form.status" style="width: 100%">
            <ElOption label="启用" value="active" />
            <ElOption label="停用" value="inactive" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="标签">
          <ElInput v-model="form.tagsText" placeholder="多个标签用逗号分隔" />
        </ElFormItem>
        <ElFormItem label="规格参数">
          <ElInput
            v-model="form.specJsonText"
            :rows="6"
            placeholder="例如 {&quot;range&quot;:&quot;-20~80C&quot;}"
            type="textarea"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton :loading="saving" type="primary" @click="submitProduct">
          保存
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
