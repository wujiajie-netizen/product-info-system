<script lang="ts" setup>
import type { CompanyType } from '#/api';

import { reactive, ref } from 'vue';

import {
  ElButton,
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElSpace,
  ElTabPane,
  ElTabs,
} from 'element-plus';

import { createBrand, createCategory, createCompany } from '#/api';

const emit = defineEmits<{
  created: [];
}>();

const saving = ref(false);
const activeTab = ref('category');

const categoryForm = reactive({
  name: '',
  parentId: '',
  slug: '',
});

const brandForm = reactive({
  aliasesText: '',
  name: '',
  slug: '',
  websiteUrl: '',
});

const companyForm = reactive({
  name: '',
  slug: '',
  type: 'supplier' as CompanyType,
  websiteUrl: '',
});

function resetCategoryForm() {
  categoryForm.name = '';
  categoryForm.parentId = '';
  categoryForm.slug = '';
}

function resetBrandForm() {
  brandForm.aliasesText = '';
  brandForm.name = '';
  brandForm.slug = '';
  brandForm.websiteUrl = '';
}

function resetCompanyForm() {
  companyForm.name = '';
  companyForm.slug = '';
  companyForm.type = 'supplier';
  companyForm.websiteUrl = '';
}

async function submitCategory() {
  if (!categoryForm.name.trim()) {
    ElMessage.warning('请填写分类名称');
    return;
  }
  try {
    saving.value = true;
    await createCategory({
      name: categoryForm.name.trim(),
      parentId: categoryForm.parentId || null,
      slug: categoryForm.slug.trim() || undefined,
      status: 'active',
    });
    ElMessage.success('分类已创建');
    resetCategoryForm();
    emit('created');
  } catch (error) {
    ElMessage.error((error as Error).message || '分类创建失败');
  } finally {
    saving.value = false;
  }
}

async function submitBrand() {
  if (!brandForm.name.trim()) {
    ElMessage.warning('请填写品牌名称');
    return;
  }
  try {
    saving.value = true;
    await createBrand({
      aliases: brandForm.aliasesText
        .split(/[,，]/)
        .map((item) => item.trim())
        .filter(Boolean),
      name: brandForm.name.trim(),
      slug: brandForm.slug.trim() || undefined,
      status: 'active',
      websiteUrl: brandForm.websiteUrl.trim() || undefined,
    });
    ElMessage.success('品牌已创建');
    resetBrandForm();
    emit('created');
  } catch (error) {
    ElMessage.error((error as Error).message || '品牌创建失败');
  } finally {
    saving.value = false;
  }
}

async function submitCompany() {
  if (!companyForm.name.trim()) {
    ElMessage.warning('请填写公司名称');
    return;
  }
  try {
    saving.value = true;
    await createCompany({
      name: companyForm.name.trim(),
      slug: companyForm.slug.trim() || undefined,
      status: 'active',
      type: companyForm.type,
      websiteUrl: companyForm.websiteUrl.trim() || undefined,
    });
    ElMessage.success('公司已创建');
    resetCompanyForm();
    emit('created');
  } catch (error) {
    ElMessage.error((error as Error).message || '公司创建失败');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <ElCard shadow="never">
    <template #header>快速新建分类 / 品牌 / 公司</template>
    <ElTabs v-model="activeTab">
      <ElTabPane label="分类" name="category">
        <ElForm label-width="88px">
          <ElFormItem label="名称"><ElInput v-model="categoryForm.name" placeholder="例如 KDS 厨房显示屏" /></ElFormItem>
          <ElFormItem label="Slug"><ElInput v-model="categoryForm.slug" placeholder="可选，留空自动生成" /></ElFormItem>
        </ElForm>
        <ElButton :loading="saving" type="primary" @click="submitCategory">创建分类</ElButton>
      </ElTabPane>

      <ElTabPane label="品牌" name="brand">
        <ElForm label-width="88px">
          <ElFormItem label="名称"><ElInput v-model="brandForm.name" /></ElFormItem>
          <ElFormItem label="别名"><ElInput v-model="brandForm.aliasesText" placeholder="多个别名用逗号分隔" /></ElFormItem>
          <ElFormItem label="官网"><ElInput v-model="brandForm.websiteUrl" /></ElFormItem>
          <ElFormItem label="Slug"><ElInput v-model="brandForm.slug" placeholder="可选，留空自动生成" /></ElFormItem>
        </ElForm>
        <ElButton :loading="saving" type="primary" @click="submitBrand">创建品牌</ElButton>
      </ElTabPane>

      <ElTabPane label="公司" name="company">
        <ElForm label-width="88px">
          <ElFormItem label="名称"><ElInput v-model="companyForm.name" /></ElFormItem>
          <ElFormItem label="类型">
            <ElSelect v-model="companyForm.type" style="width: 100%">
              <ElOption label="制造商" value="manufacturer" />
              <ElOption label="供应商" value="supplier" />
              <ElOption label="品牌方" value="brand_owner" />
              <ElOption label="分销商" value="distributor" />
              <ElOption label="其他" value="other" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="官网"><ElInput v-model="companyForm.websiteUrl" /></ElFormItem>
          <ElFormItem label="Slug"><ElInput v-model="companyForm.slug" placeholder="可选，留空自动生成" /></ElFormItem>
        </ElForm>
        <ElSpace wrap>
          <ElButton :loading="saving" type="primary" @click="submitCompany">创建公司</ElButton>
        </ElSpace>
      </ElTabPane>
    </ElTabs>
  </ElCard>
</template>
