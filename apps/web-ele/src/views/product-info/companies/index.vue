<script lang="ts" setup>
import type { CompanyRecord, CompanyStatus, CompanyType } from '#/api';

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
  createCompany,
  listCompanies,
  setCompanyStatus,
  updateCompany,
} from '#/api';

const companyTypeOptions: Array<{ label: string; value: CompanyType }> = [
  { label: '供应商', value: 'supplier' },
  { label: '品牌方', value: 'brand_owner' },
  { label: '代理商', value: 'distributor' },
  { label: '制造商', value: 'manufacturer' },
  { label: '其他', value: 'other' },
];

const userStore = useUserStore();
const loading = ref(false);
const saving = ref(false);
const keyword = ref('');
const typeFilter = ref<'' | CompanyType>('');
const companies = ref<CompanyRecord[]>([]);
const dialogVisible = ref(false);
const editingCompany = ref<CompanyRecord>();

const isAdmin = computed(() => userStore.userRoles.includes('admin'));
const dialogTitle = computed(() =>
  editingCompany.value ? '编辑公司' : '新增公司',
);
const filteredCompanies = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLowerCase();

  if (!normalizedKeyword) {
    return companies.value;
  }

  return companies.value.filter((company) =>
    [
      company.address,
      company.contact_email,
      company.contact_name,
      company.contact_phone,
      company.description,
      company.name,
      company.slug,
      company.website_url,
    ].some((value) => value?.toLowerCase().includes(normalizedKeyword)),
  );
});

const form = reactive({
  address: '',
  contactEmail: '',
  contactName: '',
  contactPhone: '',
  description: '',
  name: '',
  slug: '',
  status: 'active' as CompanyStatus,
  type: 'supplier' as CompanyType,
  websiteUrl: '',
});

function companyTypeLabel(type: string) {
  return (
    companyTypeOptions.find((option) => option.value === type)?.label || type
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

async function loadCompanies() {
  try {
    loading.value = true;
    companies.value = await listCompanies({
      type: typeFilter.value || undefined,
    });
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  editingCompany.value = undefined;
  form.address = '';
  form.contactEmail = '';
  form.contactName = '';
  form.contactPhone = '';
  form.description = '';
  form.name = '';
  form.slug = '';
  form.status = 'active';
  form.type = 'supplier';
  form.websiteUrl = '';
}

function openCreateDialog() {
  resetForm();
  dialogVisible.value = true;
}

function openEditDialog(row: CompanyRecord) {
  editingCompany.value = row;
  form.address = row.address || '';
  form.contactEmail = row.contact_email || '';
  form.contactName = row.contact_name || '';
  form.contactPhone = row.contact_phone || '';
  form.description = row.description || '';
  form.name = row.name;
  form.slug = row.slug;
  form.status = row.status === 'inactive' ? 'inactive' : 'active';
  form.type = companyTypeOptions.some((option) => option.value === row.type)
    ? (row.type as CompanyType)
    : 'supplier';
  form.websiteUrl = row.website_url || '';
  dialogVisible.value = true;
}

function buildCompanyInput() {
  const name = form.name.trim();

  if (!name) {
    throw new Error('请填写公司名称');
  }

  return {
    address: form.address.trim(),
    contactEmail: form.contactEmail.trim(),
    contactName: form.contactName.trim(),
    contactPhone: form.contactPhone.trim(),
    description: form.description.trim(),
    name,
    slug: form.slug.trim(),
    status: form.status,
    type: form.type,
    websiteUrl: form.websiteUrl.trim(),
  };
}

async function submitCompany() {
  try {
    saving.value = true;
    const input = buildCompanyInput();

    if (editingCompany.value) {
      await updateCompany(editingCompany.value.id, input);
      ElMessage.success('公司已更新');
    } else {
      await createCompany(input);
      ElMessage.success('公司已新增');
    }

    dialogVisible.value = false;
    await loadCompanies();
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    saving.value = false;
  }
}

async function handleStatusChange(row: CompanyRecord) {
  const nextStatus: CompanyStatus =
    row.status === 'active' ? 'inactive' : 'active';

  try {
    await setCompanyStatus(row.id, nextStatus);
    ElMessage.success(nextStatus === 'active' ? '公司已启用' : '公司已停用');
    await loadCompanies();
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
}

onMounted(loadCompanies);
</script>

<template>
  <Page description="维护供应商、品牌方、代理商和制造商资料" title="公司管理">
    <ElCard shadow="never">
      <ElSpace class="mb-4" wrap>
        <ElInput
          v-model="keyword"
          clearable
          placeholder="搜索名称、联系人、电话、邮箱"
          style="width: 320px"
        />
        <ElSelect
          v-model="typeFilter"
          clearable
          placeholder="公司类型"
          style="width: 180px"
          @change="loadCompanies"
          @clear="loadCompanies"
        >
          <ElOption
            v-for="option in companyTypeOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
        <ElButton @click="loadCompanies">查询</ElButton>
        <ElButton v-if="isAdmin" type="primary" @click="openCreateDialog">
          新增公司
        </ElButton>
      </ElSpace>
      <ElTable v-loading="loading" :data="filteredCompanies" stripe>
        <ElTableColumn label="公司名称" min-width="180" prop="name" />
        <ElTableColumn label="Slug" min-width="160" prop="slug" />
        <ElTableColumn label="类型" prop="type" width="120">
          <template #default="{ row }">
            <ElTag type="primary">{{ companyTypeLabel(row.type) }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" prop="status" width="100">
          <template #default="{ row }">
            <ElTag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '启用' : '停用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="联系人" prop="contact_name" width="120" />
        <ElTableColumn label="电话" prop="contact_phone" width="140" />
        <ElTableColumn label="邮箱" min-width="180" prop="contact_email" />
        <ElTableColumn label="网站" min-width="180" prop="website_url" />
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
                  ? '确认停用该公司？'
                  : '确认启用该公司？'
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
          <ElEmpty description="暂无公司资料" />
        </template>
      </ElTable>
    </ElCard>

    <ElDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="640px"
      @closed="resetForm"
    >
      <ElForm label-width="88px">
        <ElFormItem label="公司名称">
          <ElInput v-model="form.name" placeholder="请输入公司名称" />
        </ElFormItem>
        <ElFormItem label="Slug">
          <ElInput v-model="form.slug" placeholder="留空时按公司名称生成" />
        </ElFormItem>
        <ElFormItem label="类型">
          <ElSelect v-model="form.type" style="width: 100%">
            <ElOption
              v-for="option in companyTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="form.status" style="width: 100%">
            <ElOption label="启用" value="active" />
            <ElOption label="停用" value="inactive" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="联系人">
          <ElInput v-model="form.contactName" placeholder="请输入联系人" />
        </ElFormItem>
        <ElFormItem label="电话">
          <ElInput v-model="form.contactPhone" placeholder="请输入联系电话" />
        </ElFormItem>
        <ElFormItem label="邮箱">
          <ElInput v-model="form.contactEmail" placeholder="请输入联系邮箱" />
        </ElFormItem>
        <ElFormItem label="网站">
          <ElInput
            v-model="form.websiteUrl"
            placeholder="https://example.com"
          />
        </ElFormItem>
        <ElFormItem label="地址">
          <ElInput v-model="form.address" placeholder="请输入公司地址" />
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput
            v-model="form.description"
            :rows="4"
            placeholder="请输入公司描述"
            type="textarea"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton :loading="saving" type="primary" @click="submitCompany">
          保存
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
