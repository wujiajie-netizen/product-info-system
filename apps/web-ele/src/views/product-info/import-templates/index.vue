<script lang="ts" setup>
import type { ImportTemplateRecord, ImportTemplateStatus, SaveImportTemplateInput } from '#/api';

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
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag,
  ElUpload,
} from 'element-plus';

import {
  copyImportTemplate,
  createImportTemplate,
  deleteImportTemplate,
  listCompanies,
  listImportTemplates,
  updateImportTemplate,
} from '#/api';

const userStore = useUserStore();
const isAdmin = computed(() => userStore.userRoles.includes('admin'));

const loading = ref(false);
const saving = ref(false);
const keyword = ref('');
const templates = ref<ImportTemplateRecord[]>([]);
const companies = ref<Array<{ id: string; name: string }>>([]);
const dialogVisible = ref(false);
const editingTemplate = ref<ImportTemplateRecord>();
const testDialogVisible = ref(false);
const testResult = ref('');

const dialogTitle = computed(() => (editingTemplate.value ? '编辑导入模板' : '新增导入模板'));

const form = reactive({
  detailMappingsText: '{\n  "Model No": "model",\n  "CPU": "chipset",\n  "RAM": "ramGb",\n  "Resolution": "resolution"\n}',
  detailSheetRule: '',
  headerRow: 3,
  isDefault: false,
  modelColumn: '机型',
  quoteSheetMatcher: '',
  quoteSheetName: '报价',
  remarkColumn: '备注/选配',
  sizeColumn: '尺寸',
  status: 'active' as ImportTemplateStatus,
  summaryConfigColumn: '标准配置',
  supplierCompanyId: '',
  supplierName: '',
  templateName: '',
  tierMappingsText: '[\n  { "column": "10台单价（USD）", "minQuantity": 10, "currency": "USD" },\n  { "column": "100台单价（USD）", "minQuantity": 100, "currency": "USD" }\n]',
});

function formatDate(value?: null | string) {
  return value ? new Date(value).toLocaleString() : '-';
}

function resetForm() {
  editingTemplate.value = undefined;
  form.templateName = '';
  form.supplierCompanyId = '';
  form.supplierName = '';
  form.quoteSheetName = '报价';
  form.quoteSheetMatcher = '';
  form.headerRow = 3;
  form.modelColumn = '机型';
  form.sizeColumn = '尺寸';
  form.summaryConfigColumn = '标准配置';
  form.remarkColumn = '备注/选配';
  form.tierMappingsText = '[\n  { "column": "10台单价（USD）", "minQuantity": 10, "currency": "USD" },\n  { "column": "100台单价（USD）", "minQuantity": 100, "currency": "USD" }\n]';
  form.detailSheetRule = '';
  form.detailMappingsText = '{\n  "Model No": "model",\n  "CPU": "chipset",\n  "RAM": "ramGb",\n  "Resolution": "resolution"\n}';
  form.status = 'active';
  form.isDefault = false;
}

function openCreateDialog() {
  resetForm();
  dialogVisible.value = true;
}

function openEditDialog(row: ImportTemplateRecord) {
  editingTemplate.value = row;
  form.templateName = row.template_name;
  form.supplierCompanyId = row.supplier_company_id || '';
  form.supplierName = row.supplier_name || '';
  form.quoteSheetName = row.quote_sheet_name || '';
  form.quoteSheetMatcher = row.quote_sheet_matcher || '';
  form.headerRow = row.header_row || 1;
  form.modelColumn = row.model_column || '';
  form.sizeColumn = row.size_column || '';
  form.summaryConfigColumn = row.summary_config_column || '';
  form.remarkColumn = row.remark_column || '';
  form.tierMappingsText = JSON.stringify(row.tier_mappings || [], null, 2);
  form.detailSheetRule = row.detail_sheet_rule || '';
  form.detailMappingsText = JSON.stringify(row.detail_mappings || {}, null, 2);
  form.status = row.status === 'inactive' ? 'inactive' : 'active';
  form.isDefault = row.is_default;
  dialogVisible.value = true;
}

function parseJson<T>(value: string, fallback: T) {
  const text = value.trim();
  if (!text) return fallback;
  return JSON.parse(text) as T;
}

function buildTemplateInput(): SaveImportTemplateInput {
  const templateName = form.templateName.trim();
  if (!templateName) throw new Error('请填写模板名称');
  return {
    detailMappings: parseJson<Record<string, string>>(form.detailMappingsText, {}),
    detailSheetRule: form.detailSheetRule,
    headerRow: form.headerRow,
    isDefault: form.isDefault,
    modelColumn: form.modelColumn,
    quoteSheetMatcher: form.quoteSheetMatcher,
    quoteSheetName: form.quoteSheetName,
    remarkColumn: form.remarkColumn,
    sizeColumn: form.sizeColumn,
    status: form.status,
    summaryConfigColumn: form.summaryConfigColumn,
    supplierCompanyId: form.supplierCompanyId || undefined,
    supplierName: form.supplierName,
    templateName,
    tierMappings: parseJson(form.tierMappingsText, []),
  };
}

async function loadData() {
  try {
    loading.value = true;
    const [templateRecords, companyRecords] = await Promise.all([
      listImportTemplates({ keyword: keyword.value }),
      listCompanies(),
    ]);
    templates.value = templateRecords;
    companies.value = companyRecords.map((item) => ({ id: item.id, name: item.name }));
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    loading.value = false;
  }
}

async function submitTemplate() {
  try {
    saving.value = true;
    const input = buildTemplateInput();
    if (editingTemplate.value) {
      await updateImportTemplate(editingTemplate.value.id, input);
      ElMessage.success('模板已更新');
    } else {
      await createImportTemplate(input);
      ElMessage.success('模板已创建');
    }
    dialogVisible.value = false;
    await loadData();
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    saving.value = false;
  }
}

async function toggleTemplate(row: ImportTemplateRecord) {
  try {
    await updateImportTemplate(row.id, {
      detailMappings: row.detail_mappings,
      detailSheetRule: row.detail_sheet_rule || undefined,
      headerRow: row.header_row,
      isDefault: row.is_default,
      modelColumn: row.model_column || undefined,
      quoteSheetMatcher: row.quote_sheet_matcher || undefined,
      quoteSheetName: row.quote_sheet_name || undefined,
      remarkColumn: row.remark_column || undefined,
      sizeColumn: row.size_column || undefined,
      status: row.status === 'active' ? 'inactive' : 'active',
      summaryConfigColumn: row.summary_config_column || undefined,
      supplierCompanyId: row.supplier_company_id || undefined,
      supplierName: row.supplier_name || undefined,
      templateName: row.template_name,
      tierMappings: row.tier_mappings,
    });
    ElMessage.success('模板状态已更新');
    await loadData();
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
}

async function setDefaultTemplate(row: ImportTemplateRecord) {
  try {
    await updateImportTemplate(row.id, {
      detailMappings: row.detail_mappings,
      headerRow: row.header_row,
      isDefault: true,
      status: row.status === 'inactive' ? 'inactive' : 'active',
      supplierName: row.supplier_name || undefined,
      templateName: row.template_name,
      tierMappings: row.tier_mappings,
    });
    ElMessage.success('已设置默认模板');
    await loadData();
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
}

async function handleCopy(row: ImportTemplateRecord) {
  try {
    await copyImportTemplate(row.id);
    ElMessage.success('模板已复制');
    await loadData();
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
}

async function handleDelete(row: ImportTemplateRecord) {
  try {
    await deleteImportTemplate(row.id);
    ElMessage.success('模板已删除');
    await loadData();
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
}

function openTestDialog(row: ImportTemplateRecord) {
  testResult.value = `当前模板「${row.template_name}」可用于试解析：报价 Sheet=${row.quote_sheet_name || row.quote_sheet_matcher || '-'}，表头行=${row.header_row}，型号列=${row.model_column || '-'}，价格阶梯=${row.tier_mappings.length} 组。`;
  testDialogVisible.value = true;
}

function handleTestUpload() {
  ElMessage.info('样例 Excel 已接收；当前页面先展示模板映射预览，真实解析结果可在工作台选择该模板后执行。');
}

onMounted(loadData);
</script>

<template>
  <Page description="维护不同供应商或不同格式的结构化 Excel 导入模板" title="导入模板管理">
    <ElCard shadow="never">
      <ElSpace class="mb-4" wrap>
        <ElInput v-model="keyword" clearable placeholder="搜索模板、供应商、Sheet" style="width: 320px" @clear="loadData" @keyup.enter="loadData" />
        <ElButton @click="loadData">查询</ElButton>
        <ElButton v-if="isAdmin" type="primary" @click="openCreateDialog">新增模板</ElButton>
      </ElSpace>

      <ElTable v-loading="loading" :data="templates" stripe>
        <ElTableColumn label="模板名称" min-width="180" prop="template_name" />
        <ElTableColumn label="适用供应商" min-width="160">
          <template #default="{ row }">{{ row.supplier_name || '-' }}</template>
        </ElTableColumn>
        <ElTableColumn label="报价 Sheet" min-width="140">
          <template #default="{ row }">{{ row.quote_sheet_name || row.quote_sheet_matcher || '-' }}</template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="120">
          <template #default="{ row }">
            <ElSpace>
              <ElTag :type="row.status === 'active' ? 'success' : 'info'">{{ row.status === 'active' ? '启用' : '停用' }}</ElTag>
              <ElTag v-if="row.is_default" type="warning">默认</ElTag>
            </ElSpace>
          </template>
        </ElTableColumn>
        <ElTableColumn label="最近使用" width="160">
          <template #default="{ row }">{{ formatDate(row.last_used_at) }}</template>
        </ElTableColumn>
        <ElTableColumn label="创建时间" width="160">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </ElTableColumn>
        <ElTableColumn v-if="isAdmin" fixed="right" label="操作" width="310">
          <template #default="{ row }">
            <ElButton link type="primary" @click="openEditDialog(row)">编辑</ElButton>
            <ElButton link type="primary" @click="handleCopy(row)">复制</ElButton>
            <ElButton link type="primary" @click="openTestDialog(row)">试解析</ElButton>
            <ElButton link type="primary" @click="setDefaultTemplate(row)">设默认</ElButton>
            <ElButton link type="primary" @click="toggleTemplate(row)">{{ row.status === 'active' ? '停用' : '启用' }}</ElButton>
            <ElPopconfirm title="确认删除该模板？" @confirm="handleDelete(row)">
              <template #reference>
                <ElButton link type="danger">删除</ElButton>
              </template>
            </ElPopconfirm>
          </template>
        </ElTableColumn>
        <template #empty><ElEmpty description="暂无导入模板" /></template>
      </ElTable>
    </ElCard>

    <ElDialog v-model="dialogVisible" :title="dialogTitle" width="760px" @closed="resetForm">
      <ElForm label-width="116px">
        <ElFormItem label="模板名称"><ElInput v-model="form.templateName" /></ElFormItem>
        <ElFormItem label="适用公司">
          <ElSelect v-model="form.supplierCompanyId" clearable filterable style="width: 100%">
            <ElOption v-for="company in companies" :key="company.id" :label="company.name" :value="company.id" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="供应商名称"><ElInput v-model="form.supplierName" placeholder="无公司记录时填写" /></ElFormItem>
        <ElFormItem label="报价 Sheet"><ElInput v-model="form.quoteSheetName" /></ElFormItem>
        <ElFormItem label="Sheet 匹配规则"><ElInput v-model="form.quoteSheetMatcher" /></ElFormItem>
        <ElFormItem label="表头行"><ElInputNumber v-model="form.headerRow" :min="1" /></ElFormItem>
        <ElFormItem label="型号列"><ElInput v-model="form.modelColumn" /></ElFormItem>
        <ElFormItem label="尺寸列"><ElInput v-model="form.sizeColumn" /></ElFormItem>
        <ElFormItem label="配置列"><ElInput v-model="form.summaryConfigColumn" /></ElFormItem>
        <ElFormItem label="备注列"><ElInput v-model="form.remarkColumn" /></ElFormItem>
        <ElFormItem label="价格阶梯列"><ElInput v-model="form.tierMappingsText" :rows="5" type="textarea" /></ElFormItem>
        <ElFormItem label="详情 Sheet 规则"><ElInput v-model="form.detailSheetRule" /></ElFormItem>
        <ElFormItem label="详情字段映射"><ElInput v-model="form.detailMappingsText" :rows="6" type="textarea" /></ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="form.status" style="width: 160px"><ElOption label="启用" value="active" /><ElOption label="停用" value="inactive" /></ElSelect>
        </ElFormItem>
        <ElFormItem label="默认模板"><ElSwitch v-model="form.isDefault" /></ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton :loading="saving" type="primary" @click="submitTemplate">保存</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="testDialogVisible" title="模板试解析" width="560px">
      <ElUpload :auto-upload="false" :limit="1" accept=".xlsx,.xls" drag @change="handleTestUpload">
        <div class="py-6">上传样例 Excel 查看模板映射预览</div>
      </ElUpload>
      <p class="mt-4 text-sm text-gray-600">{{ testResult }}</p>
    </ElDialog>
  </Page>
</template>
