<script lang="ts" setup>
import type {
  ProductRecord,
  QaQuestionCategory,
  QaQuestionPriority,
  QaQuestionRecord,
  QaQuestionStatus,
} from '#/api';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  ElAlert,
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
  createAdminQaQuestion,
  listProducts,
  listQaQuestions,
  setQaQuestionStatus,
  updateAdminQaQuestion,
} from '#/api';

const categoryOptions: Array<{ label: string; value: QaQuestionCategory }> = [
  { label: '商品问题', value: 'product' },
  { label: '技术问题', value: 'technical' },
  { label: '规格参数', value: 'spec' },
  { label: '报价采购', value: 'quote' },
  { label: '交付售后', value: 'after_sales' },
];

const statusOptions: Array<{ label: string; value: QaQuestionStatus }> = [
  { label: '待补充', value: 'pending' },
  { label: '已回答', value: 'answered' },
  { label: '已归档', value: 'archived' },
];

const priorityOptions: Array<{ label: string; value: QaQuestionPriority }> = [
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' },
];

const userStore = useUserStore();
const isAdmin = computed(() => userStore.userRoles.includes('admin'));

const loading = ref(false);
const saving = ref(false);
const keyword = ref('');
const categoryFilter = ref<'' | QaQuestionCategory>('');
const statusFilter = ref<'' | QaQuestionStatus>('');
const questions = ref<QaQuestionRecord[]>([]);
const products = ref<ProductRecord[]>([]);
const dialogVisible = ref(false);
const editingQuestionId = ref('');

const form = reactive({
  answer: '',
  askerRole: '后台录入',
  category: 'product' as QaQuestionCategory,
  priority: 'medium' as QaQuestionPriority,
  productId: '',
  productModel: '',
  productName: '',
  question: '',
  status: 'pending' as QaQuestionStatus,
  tagsText: '',
  title: '',
});

const dialogTitle = computed(() =>
  editingQuestionId.value ? '编辑问答' : '新增问答',
);

const pendingCount = computed(
  () => questions.value.filter((item) => item.status === 'pending').length,
);
const answeredCount = computed(
  () => questions.value.filter((item) => item.status === 'answered').length,
);
const archivedCount = computed(
  () => questions.value.filter((item) => item.status === 'archived').length,
);

function categoryLabel(value: QaQuestionCategory) {
  return categoryOptions.find((item) => item.value === value)?.label || value;
}

function priorityLabel(value: QaQuestionPriority) {
  return priorityOptions.find((item) => item.value === value)?.label || value;
}

function statusLabel(value: QaQuestionStatus) {
  return statusOptions.find((item) => item.value === value)?.label || value;
}

function statusTagType(value: QaQuestionStatus) {
  if (value === 'answered') return 'success';
  if (value === 'archived') return 'info';
  return 'warning';
}

function priorityTagType(value: QaQuestionPriority) {
  if (value === 'high') return 'danger';
  if (value === 'low') return 'info';
  return 'warning';
}

function formatDate(value?: null | string) {
  return value ? new Date(value).toLocaleDateString() : '-';
}

function resetForm() {
  editingQuestionId.value = '';
  form.answer = '';
  form.askerRole = '后台录入';
  form.category = 'product';
  form.priority = 'medium';
  form.productId = '';
  form.productModel = '';
  form.productName = '';
  form.question = '';
  form.status = 'pending';
  form.tagsText = '';
  form.title = '';
}

function splitTags(value: string) {
  return value
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildSubmitPayload() {
  return {
    answer: form.answer,
    askerRole: form.askerRole,
    category: form.category,
    priority: form.priority,
    productId: form.productId || undefined,
    productModel: form.productModel,
    productName: form.productName,
    question: form.question,
    status: form.status,
    tags: splitTags(form.tagsText),
    title: form.title,
  };
}

function openCreateDialog() {
  resetForm();
  dialogVisible.value = true;
}

function openEditDialog(row: QaQuestionRecord) {
  editingQuestionId.value = row.id;
  form.answer = row.answer || '';
  form.askerRole = row.asker_role || '后台维护';
  form.category = row.category;
  form.priority = row.priority;
  form.productId = row.product_id || '';
  form.productModel = row.product_model || '';
  form.productName = row.product_name || '';
  form.question = row.question;
  form.status = row.status;
  form.tagsText = (row.tags || []).join('，');
  form.title = row.title;
  dialogVisible.value = true;
}

function handleProductChange(productId?: string) {
  const product = products.value.find((item) => item.id === productId);
  form.productModel = product?.model || '';
  form.productName = product?.name || '';
}

async function loadQuestions() {
  try {
    loading.value = true;
    questions.value = await listQaQuestions({
      category: categoryFilter.value,
      keyword: keyword.value,
      status: statusFilter.value,
    });
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    loading.value = false;
  }
}

async function loadOptions() {
  try {
    products.value = await listProducts();
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
}

async function submitQuestion() {
  if (!form.title.trim() || !form.question.trim()) {
    ElMessage.warning('请先填写问题标题和问题描述');
    return;
  }

  if (form.status === 'answered' && !form.answer.trim()) {
    ElMessage.warning('已回答状态必须填写标准回答');
    return;
  }

  try {
    saving.value = true;
    if (editingQuestionId.value) {
      await updateAdminQaQuestion(editingQuestionId.value, buildSubmitPayload());
      ElMessage.success('问答已更新');
    } else {
      await createAdminQaQuestion(buildSubmitPayload());
      ElMessage.success('问答已创建');
    }

    dialogVisible.value = false;
    await loadQuestions();
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    saving.value = false;
  }
}

async function handleArchive(row: QaQuestionRecord) {
  try {
    const nextStatus: QaQuestionStatus = row.status === 'archived' ? 'pending' : 'archived';
    await setQaQuestionStatus(row.id, nextStatus);
    ElMessage.success(nextStatus === 'archived' ? '问答已归档' : '问答已恢复为待补充');
    await loadQuestions();
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
}

onMounted(async () => {
  await Promise.all([loadQuestions(), loadOptions()]);
});
</script>

<template>
  <Page description="维护前台问答中心的问题、标准回答、状态和关联商品" title="问答管理">
    <ElAlert
      class="mb-4"
      :closable="false"
      show-icon
      title="状态说明：已回答会在前台展示答案；待补充只展示问题、不展示答案；已归档不会在前台展示，仅用于后台留档和后续恢复。优先级仅用于后台处理排序和待办判断，前台不展示。"
      type="info"
    />

    <ElSpace class="mb-4" wrap>
      <ElCard shadow="never">
        <div class="qa-stat-card">
          <span>待补充</span>
          <strong>{{ pendingCount }}</strong>
        </div>
      </ElCard>
      <ElCard shadow="never">
        <div class="qa-stat-card">
          <span>已回答</span>
          <strong>{{ answeredCount }}</strong>
        </div>
      </ElCard>
      <ElCard shadow="never">
        <div class="qa-stat-card">
          <span>已归档</span>
          <strong>{{ archivedCount }}</strong>
        </div>
      </ElCard>
    </ElSpace>

    <ElCard shadow="never">
      <ElSpace class="mb-4" wrap>
        <ElInput
          v-model="keyword"
          clearable
          placeholder="搜索编号、标题、问题、答案、型号"
          style="width: 320px"
          @clear="loadQuestions"
          @keyup.enter="loadQuestions"
        />
        <ElSelect
          v-model="categoryFilter"
          clearable
          placeholder="问题方向"
          style="width: 160px"
        >
          <ElOption
            v-for="option in categoryOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
        <ElSelect
          v-model="statusFilter"
          clearable
          placeholder="回答状态"
          style="width: 140px"
        >
          <ElOption
            v-for="option in statusOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
        <ElButton @click="loadQuestions">查询</ElButton>
        <ElButton v-if="isAdmin" type="primary" @click="openCreateDialog">
          新增问答
        </ElButton>
      </ElSpace>

      <ElTable v-loading="loading" :data="questions" stripe>
        <ElTableColumn label="问题" min-width="280">
          <template #default="{ row }">
            <div class="qa-title-cell">
              <strong>{{ row.title }}</strong>
              <span>{{ row.question_no }} / {{ row.product_model || '未关联型号' }}</span>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="方向" width="120">
          <template #default="{ row }">
            <ElTag>{{ categoryLabel(row.category) }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="110">
          <template #default="{ row }">
            <ElTag :type="statusTagType(row.status)">
              {{ statusLabel(row.status) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="优先级" width="100">
          <template #default="{ row }">
            <ElTag :type="priorityTagType(row.priority)">
              {{ priorityLabel(row.priority) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="标准回答" min-width="260">
          <template #default="{ row }">
            <span class="qa-answer-preview">{{ row.answer || '待后台补充标准回答' }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="提问来源" width="120" prop="asker_role" />
        <ElTableColumn label="更新时间" width="130">
          <template #default="{ row }">{{ formatDate(row.updated_at) }}</template>
        </ElTableColumn>
        <ElTableColumn v-if="isAdmin" fixed="right" label="操作" width="170">
          <template #default="{ row }">
            <ElButton link type="primary" @click="openEditDialog(row)">
              编辑
            </ElButton>
            <ElPopconfirm
              :title="row.status === 'archived' ? '确认恢复该问答？' : '确认归档该问答？'"
              @confirm="handleArchive(row)"
            >
              <template #reference>
                <ElButton link type="primary">
                  {{ row.status === 'archived' ? '恢复' : '归档' }}
                </ElButton>
              </template>
            </ElPopconfirm>
          </template>
        </ElTableColumn>
        <template #empty>
          <ElEmpty description="暂无问答数据" />
        </template>
      </ElTable>
    </ElCard>

    <ElDialog v-model="dialogVisible" :title="dialogTitle" width="760px">
      <ElForm label-width="96px">
        <ElFormItem label="关联型号">
          <ElSelect
            v-model="form.productId"
            clearable
            filterable
            placeholder="可选：选择关联商品型号"
            style="width: 100%"
            @change="handleProductChange"
          >
            <ElOption
              v-for="product in products"
              :key="product.id"
              :label="`${product.model} - ${product.name}`"
              :value="product.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="型号展示">
          <ElInput v-model="form.productModel" placeholder="未选择商品时可手动输入型号" />
        </ElFormItem>
        <ElFormItem label="商品名称">
          <ElInput v-model="form.productName" placeholder="未选择商品时可手动输入商品名称" />
        </ElFormItem>
        <ElFormItem label="问题方向">
          <ElSelect v-model="form.category" style="width: 100%">
            <ElOption
              v-for="option in categoryOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="状态/优先级">
          <ElSpace wrap>
            <ElSelect v-model="form.status" style="width: 160px">
              <ElOption
                v-for="option in statusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
            <ElSelect v-model="form.priority" style="width: 140px">
              <ElOption
                v-for="option in priorityOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElSpace>
        </ElFormItem>
        <ElFormItem label="问题标题">
          <ElInput v-model="form.title" placeholder="请输入问题标题" />
        </ElFormItem>
        <ElFormItem label="问题描述">
          <ElInput
            v-model="form.question"
            :rows="4"
            placeholder="请输入用户问题或标准问题描述"
            type="textarea"
          />
        </ElFormItem>
        <ElFormItem label="标准回答">
          <ElInput
            v-model="form.answer"
            :rows="5"
            placeholder="已回答状态需要填写标准回答，前台只展示已回答问题的答案"
            type="textarea"
          />
        </ElFormItem>
        <ElFormItem label="标签">
          <ElInput v-model="form.tagsText" placeholder="多个标签用逗号分隔，如 规格，报价，验收" />
        </ElFormItem>
        <ElFormItem label="提问来源">
          <ElInput v-model="form.askerRole" placeholder="如销售/采购/技术/后台录入" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton :loading="saving" type="primary" @click="submitQuestion">
          保存
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>

<style scoped>
.qa-stat-card {
  display: grid;
  min-width: 120px;
  gap: 6px;
}

.qa-stat-card span {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.qa-stat-card strong {
  color: var(--el-text-color-primary);
  font-size: 24px;
  line-height: 1;
}

.qa-title-cell {
  display: grid;
  gap: 4px;
}

.qa-title-cell span,
.qa-answer-preview {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.qa-answer-preview {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
</style>
