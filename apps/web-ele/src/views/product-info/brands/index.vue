<script lang="ts" setup>
import type { BrandRecord, BrandStatus } from '#/api';

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

import { createBrand, listBrands, setBrandStatus, updateBrand } from '#/api';

const userStore = useUserStore();
const loading = ref(false);
const saving = ref(false);
const keyword = ref('');
const brands = ref<BrandRecord[]>([]);
const dialogVisible = ref(false);
const editingBrand = ref<BrandRecord>();

const isAdmin = computed(() => userStore.userRoles.includes('admin'));
const dialogTitle = computed(() =>
  editingBrand.value ? '编辑品牌' : '新增品牌',
);

const form = reactive({
  aliasesText: '',
  description: '',
  name: '',
  slug: '',
  status: 'active' as BrandStatus,
  websiteUrl: '',
});

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

async function loadBrands() {
  try {
    loading.value = true;
    brands.value = await listBrands({ keyword: keyword.value });
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  editingBrand.value = undefined;
  form.aliasesText = '';
  form.description = '';
  form.name = '';
  form.slug = '';
  form.status = 'active';
  form.websiteUrl = '';
}

function openCreateDialog() {
  resetForm();
  dialogVisible.value = true;
}

function openEditDialog(row: BrandRecord) {
  editingBrand.value = row;
  form.aliasesText = row.aliases.join(', ');
  form.description = row.description || '';
  form.name = row.name;
  form.slug = row.slug;
  form.status = row.status === 'inactive' ? 'inactive' : 'active';
  form.websiteUrl = row.website_url || '';
  dialogVisible.value = true;
}

function parseAliases() {
  return form.aliasesText
    .split(/[,，\n]/)
    .map((alias) => alias.trim())
    .filter(Boolean);
}

function normalizeWebsiteUrl() {
  const websiteUrl = form.websiteUrl.trim();

  if (!websiteUrl) {
    return '';
  }

  try {
    const url = new URL(websiteUrl);

    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('品牌官网仅支持 http 或 https 地址');
    }

    return url.toString();
  } catch (error) {
    throw new Error('请输入有效的品牌官网 URL', { cause: error });
  }
}

function buildBrandInput() {
  const name = form.name.trim();

  if (!name) {
    throw new Error('请填写品牌名称');
  }

  return {
    aliases: parseAliases(),
    description: form.description.trim(),
    name,
    slug: form.slug.trim(),
    status: form.status,
    websiteUrl: normalizeWebsiteUrl(),
  };
}

async function submitBrand() {
  try {
    saving.value = true;
    const input = buildBrandInput();

    if (editingBrand.value) {
      await updateBrand(editingBrand.value.id, input);
      ElMessage.success('品牌已更新');
    } else {
      await createBrand(input);
      ElMessage.success('品牌已新增');
    }

    dialogVisible.value = false;
    await loadBrands();
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    saving.value = false;
  }
}

async function handleStatusChange(row: BrandRecord) {
  const nextStatus: BrandStatus =
    row.status === 'active' ? 'inactive' : 'active';

  try {
    await setBrandStatus(row.id, nextStatus);
    ElMessage.success(nextStatus === 'active' ? '品牌已启用' : '品牌已停用');
    await loadBrands();
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
}

onMounted(loadBrands);
</script>

<template>
  <Page description="维护品牌名称、别名、官网和展示状态" title="品牌管理">
    <ElCard shadow="never">
      <ElSpace class="mb-4" wrap>
        <ElInput
          v-model="keyword"
          clearable
          placeholder="搜索品牌名称、slug"
          style="width: 320px"
          @clear="loadBrands"
          @keyup.enter="loadBrands"
        />
        <ElButton @click="loadBrands">查询</ElButton>
        <ElButton v-if="isAdmin" type="primary" @click="openCreateDialog">
          新增品牌
        </ElButton>
      </ElSpace>
      <ElTable v-loading="loading" :data="brands" stripe>
        <ElTableColumn label="品牌名称" min-width="180" prop="name" />
        <ElTableColumn label="Slug" min-width="160" prop="slug" />
        <ElTableColumn label="别名" min-width="220">
          <template #default="{ row }">
            <ElSpace v-if="row.aliases.length > 0" wrap>
              <ElTag v-for="alias in row.aliases" :key="alias" type="info">
                {{ alias }}
              </ElTag>
            </ElSpace>
            <span v-else>-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="官网" min-width="220">
          <template #default="{ row }">
            <a
              v-if="row.website_url"
              :href="row.website_url"
              rel="noopener noreferrer"
              target="_blank"
            >
              {{ row.website_url }}
            </a>
            <span v-else>-</span>
          </template>
        </ElTableColumn>
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
                  ? '确认停用该品牌？'
                  : '确认启用该品牌？'
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
          <ElEmpty description="暂无品牌资料" />
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
        <ElFormItem label="品牌名称">
          <ElInput v-model="form.name" placeholder="请输入品牌名称" />
        </ElFormItem>
        <ElFormItem label="Slug">
          <ElInput v-model="form.slug" placeholder="留空时按名称自动生成" />
        </ElFormItem>
        <ElFormItem label="别名">
          <ElInput
            v-model="form.aliasesText"
            placeholder="多个别名用逗号或换行分隔"
            type="textarea"
          />
        </ElFormItem>
        <ElFormItem label="品牌官网">
          <ElInput
            v-model="form.websiteUrl"
            placeholder="例如 https://example.com"
          />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="form.status" style="width: 100%">
            <ElOption label="启用" value="active" />
            <ElOption label="停用" value="inactive" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="展示描述">
          <ElInput
            v-model="form.description"
            :rows="4"
            placeholder="请输入品牌展示描述"
            type="textarea"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton :loading="saving" type="primary" @click="submitBrand">
          保存
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
