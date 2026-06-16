<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NPagination } from 'naive-ui';
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  Cpu,
  Eye,
  FileText,
  MessageCircle,
  Package,
  Search,
  Send,
  ThumbsUp,
  X,
} from 'lucide-vue-next';
import { useRoute, useRouter } from 'vue-router';

import {
  createQaQuestion,
  getQaCenterOverview,
  listQaCategories,
  listQaQuestions,
  type QaCategoryOption,
  type QaCenterOverview,
  type QaQuestionCategory,
  type QaQuestionItem,
  type QaQuestionStatus,
  type QaSortBy,
} from '#/api/qa-center';
import { isUsingDemoData } from '#/api/product-info';
import AppIcon from '#/components/AppIcon.vue';
import FrontShell from '#/components/FrontShell.vue';
import { useAuthState } from '#/lib/auth';
import { getErrorMessage } from '#/lib/errors';

const auth = useAuthState();
const route = useRoute();
const router = useRouter();
const loading = ref(false);
const submitting = ref(false);
const errorMessage = ref('');
const submittedMessage = ref('');
const keyword = ref('');
const selectedCategory = ref<'all' | QaQuestionCategory>('all');
const selectedStatus = ref<'all' | QaQuestionStatus>('all');
const sortBy = ref<QaSortBy>('hot');
const currentPage = ref(1);
const pageSize = 8;
const totalResults = ref(0);
const totalPages = ref(1);
const questions = ref<QaQuestionItem[]>([]);
const localQuestions = ref<QaQuestionItem[]>([]);
const categories = ref<QaCategoryOption[]>([]);
const overview = ref<QaCenterOverview | null>(null);

const qaCategoryKeys: QaQuestionCategory[] = [
  'product',
  'technical',
  'spec',
  'quote',
  'after_sales',
];
const qaStatusKeys: QaQuestionStatus[] = ['answered', 'pending'];

const sortOptions: Array<{ label: string; value: QaSortBy }> = [
  { label: '热门优先', value: 'hot' },
  { label: '最新更新', value: 'latest' },
  { label: '已回答优先', value: 'answered' },
];

const askForm = ref({
  category: 'product' as QaQuestionCategory,
  contact: '',
  productModel: '',
  question: '',
  tags: '',
  title: '',
});

const totalQuestionLabel = computed(() =>
  (overview.value?.totalQuestions || 0).toLocaleString('zh-CN'),
);
const answeredQuestionLabel = computed(() =>
  (overview.value?.answeredQuestions || 0).toLocaleString('zh-CN'),
);
const pendingQuestionLabel = computed(() =>
  (overview.value?.pendingQuestions || 0).toLocaleString('zh-CN'),
);
const productCoverageLabel = computed(() =>
  (overview.value?.productCoverage || 0).toLocaleString('zh-CN'),
);
const relatedDocumentLabel = computed(() =>
  (overview.value?.relatedDocumentCount || 0).toLocaleString('zh-CN'),
);

const renderedTotal = computed(() => totalResults.value + matchedLocalQuestions.value.length);
const renderedTotalLabel = computed(() => renderedTotal.value.toLocaleString('zh-CN'));
const renderedQuestions = computed(() => {
  if (currentPage.value !== 1) {
    return questions.value;
  }

  return [...matchedLocalQuestions.value, ...questions.value].slice(0, pageSize);
});
const canSubmitQuestion = computed(
  () => Boolean(askForm.value.title.trim()) && Boolean(askForm.value.question.trim()),
);
const activeFilterChips = computed(() => {
  const chips: Array<{ key: string; label: string }> = [];

  if (keyword.value.trim()) {
    chips.push({ key: 'keyword', label: `关键词：${keyword.value.trim()}` });
  }

  if (selectedCategory.value !== 'all') {
    chips.push({
      key: 'category',
      label: `分类：${getCategoryLabel(selectedCategory.value)}`,
    });
  }

  if (selectedStatus.value !== 'all') {
    chips.push({ key: 'status', label: `状态：${getStatusLabel(selectedStatus.value)}` });
  }

  return chips;
});
const matchedLocalQuestions = computed(() =>
  localQuestions.value.filter((item) => matchesCurrentFilters(item)),
);

function normalizeQueryValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isQaCategory(value: string): value is QaQuestionCategory {
  return qaCategoryKeys.includes(value as QaQuestionCategory);
}

function isQaStatus(value: string): value is QaQuestionStatus {
  return qaStatusKeys.includes(value as QaQuestionStatus);
}

function isQaSortBy(value: string): value is QaSortBy {
  return sortOptions.some((item) => item.value === value);
}

function getCategoryLabel(category: QaQuestionCategory) {
  return categories.value.find((item) => item.key === category)?.label || category;
}

function getStatusLabel(status: QaQuestionStatus) {
  return status === 'answered' ? '已回答' : '待补充';
}

function getPriorityLabel(priority: QaQuestionItem['priority']) {
  if (priority === 'high') {
    return '重点';
  }

  return priority === 'medium' ? '常规' : '低优先级';
}

function getQuestionStatusClass(status: QaQuestionStatus) {
  return status === 'answered' ? 'is-answered' : 'is-pending';
}

function getCategoryCount(category: QaQuestionCategory) {
  return overview.value?.categoryCounts[category] || 0;
}

function formatDateTime(value: string) {
  return value.slice(0, 10);
}

function matchesCurrentFilters(item: QaQuestionItem) {
  if (selectedCategory.value !== 'all' && item.category !== selectedCategory.value) {
    return false;
  }

  if (selectedStatus.value !== 'all' && item.status !== selectedStatus.value) {
    return false;
  }

  const value = keyword.value.trim().toLowerCase();
  if (!value) {
    return true;
  }

  return [
    item.answer,
    item.productModel,
    item.productName,
    item.question,
    item.title,
    item.tags.join(' '),
    item.relatedSpecs.map((spec) => `${spec.label} ${spec.value}`).join(' '),
  ]
    .join(' ')
    .toLowerCase()
    .includes(value);
}

function syncRouteFilters() {
  keyword.value = normalizeQueryValue(route.query.keyword);

  const category = normalizeQueryValue(route.query.category);
  selectedCategory.value = isQaCategory(category) ? category : 'all';

  const status = normalizeQueryValue(route.query.status);
  selectedStatus.value = isQaStatus(status) ? status : 'all';

  const nextSortBy = normalizeQueryValue(route.query.sortBy);
  sortBy.value = isQaSortBy(nextSortBy) ? nextSortBy : 'hot';

  currentPage.value = Math.max(1, Number(normalizeQueryValue(route.query.page)) || 1);
}

function buildQaRouteQuery() {
  const query: Record<string, string> = {};

  if (keyword.value.trim()) {
    query.keyword = keyword.value.trim();
  }

  if (selectedCategory.value !== 'all') {
    query.category = selectedCategory.value;
  }

  if (selectedStatus.value !== 'all') {
    query.status = selectedStatus.value;
  }

  if (sortBy.value !== 'hot') {
    query.sortBy = sortBy.value;
  }

  if (currentPage.value > 1) {
    query.page = String(currentPage.value);
  }

  return query;
}

function replaceQaRouteQuery(page = currentPage.value) {
  currentPage.value = page;
  void router.replace({
    name: 'qa-center',
    query: buildQaRouteQuery(),
  });
}

function submitSearch() {
  replaceQaRouteQuery(1);
}

function selectCategory(category: 'all' | QaQuestionCategory) {
  selectedCategory.value = category;
  replaceQaRouteQuery(1);
}

function selectStatus(status: 'all' | QaQuestionStatus) {
  selectedStatus.value = status;
  replaceQaRouteQuery(1);
}

function handleSortChange() {
  replaceQaRouteQuery(1);
}

function handlePageChange(page: number) {
  replaceQaRouteQuery(page);
}

function clearChip(key: string) {
  if (key === 'keyword') {
    keyword.value = '';
  } else if (key === 'category') {
    selectedCategory.value = 'all';
  } else if (key === 'status') {
    selectedStatus.value = 'all';
  }

  replaceQaRouteQuery(1);
}

function clearAllFilters() {
  keyword.value = '';
  selectedCategory.value = 'all';
  selectedStatus.value = 'all';
  sortBy.value = 'hot';
  replaceQaRouteQuery(1);
}

async function submitQuestion() {
  if (!canSubmitQuestion.value) {
    return;
  }

  submitting.value = true;
  submittedMessage.value = '';

  try {
    const tags = askForm.value.tags
      .split(/[，,\s]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    const question = await createQaQuestion({
      category: askForm.value.category,
      contact: askForm.value.contact,
      productModel: askForm.value.productModel,
      question: askForm.value.question,
      tags,
      title: askForm.value.title,
    });

    localQuestions.value = [question, ...localQuestions.value];
    selectedCategory.value = question.category;
    selectedStatus.value = 'all';
    currentPage.value = 1;
    submittedMessage.value = '已生成待补充问题，等待产品/技术同事补充正式回答。';
    askForm.value = {
      category: question.category,
      contact: '',
      productModel: '',
      question: '',
      tags: '',
      title: '',
    };
    replaceQaRouteQuery(1);
  } catch (error) {
    submittedMessage.value = getErrorMessage(error);
  } finally {
    submitting.value = false;
  }
}

async function loadQaCenter() {
  loading.value = true;
  errorMessage.value = '';

  try {
    const [pagedResult, nextCategories, nextOverview] = await Promise.all([
      listQaQuestions({
        category: selectedCategory.value === 'all' ? undefined : selectedCategory.value,
        keyword: keyword.value || undefined,
        page: currentPage.value,
        pageSize,
        sortBy: sortBy.value,
        status: selectedStatus.value === 'all' ? undefined : selectedStatus.value,
      }),
      listQaCategories(),
      getQaCenterOverview(),
    ]);

    questions.value = pagedResult.items;
    categories.value = nextCategories;
    overview.value = nextOverview;
    totalResults.value = pagedResult.total;
    totalPages.value = pagedResult.totalPages;

    if (pagedResult.page !== currentPage.value) {
      replaceQaRouteQuery(pagedResult.page);
    }
  } catch (error) {
    errorMessage.value = getErrorMessage(error);
    questions.value = [];
    totalResults.value = 0;
    totalPages.value = 1;
  } finally {
    loading.value = false;
  }
}

watch(
  () => route.query,
  () => {
    syncRouteFilters();
  },
  { deep: true, immediate: true },
);

watch(
  () => [auth.initialized, isUsingDemoData(), route.fullPath],
  ([initialized, demoMode]) => {
    if (!initialized && !demoMode) {
      return;
    }

    void loadQaCenter();
  },
  { immediate: true },
);
</script>

<template>
  <FrontShell>
    <main class="qa-center-page">
      <section class="qa-center-hero">
        <div class="qa-center-hero__copy">
          <span class="qa-center-hero__eyebrow">商品知识问答</span>
          <h1>问答中心</h1>
          <p>
            围绕商品、技术、规格、报价和交付售后沉淀标准回答，帮助销售、采购和技术同事快速查清型号与资料。
          </p>
        </div>

        <div class="qa-center-hero__stats">
          <div>
            <strong>{{ totalQuestionLabel }}</strong>
            <span>知识问题</span>
          </div>
          <div>
            <strong>{{ answeredQuestionLabel }}</strong>
            <span>已回答</span>
          </div>
          <div>
            <strong>{{ productCoverageLabel }}</strong>
            <span>覆盖商品</span>
          </div>
          <div>
            <strong>{{ relatedDocumentLabel }}</strong>
            <span>关联资料</span>
          </div>
        </div>
      </section>

      <section class="qa-center-search">
        <div class="qa-center-search__bar">
          <AppIcon :icon="Search" :size="18" />
          <input
            v-model="keyword"
            type="text"
            placeholder="搜索商品型号 / 技术问题 / 规格参数 / 应用场景"
            @keyup.enter="submitSearch"
          />
          <button v-if="keyword" type="button" aria-label="清空搜索" @click="keyword = ''; submitSearch()">
            <AppIcon :icon="X" :size="16" />
          </button>
        </div>
        <button class="qa-center-search__button" type="button" @click="submitSearch">
          搜索问答
        </button>
      </section>

      <section class="qa-center-layout">
        <aside class="qa-center-sidebar">
          <div class="qa-center-panel">
            <h2>问题方向</h2>
            <button
              type="button"
              class="qa-center-category"
              :class="{ 'is-active': selectedCategory === 'all' }"
              @click="selectCategory('all')"
            >
              <span>全部问题</span>
              <strong>{{ overview?.totalQuestions || 0 }}</strong>
            </button>
            <button
              v-for="category in categories"
              :key="category.key"
              type="button"
              class="qa-center-category"
              :class="{ 'is-active': selectedCategory === category.key }"
              @click="selectCategory(category.key)"
            >
              <span>{{ category.label }}</span>
              <strong>{{ getCategoryCount(category.key) }}</strong>
              <small>{{ category.description }}</small>
            </button>
          </div>

          <div class="qa-center-panel">
            <h2>回答状态</h2>
            <div class="qa-center-status-filter">
              <button
                type="button"
                :class="{ 'is-active': selectedStatus === 'all' }"
                @click="selectStatus('all')"
              >
                全部
              </button>
              <button
                type="button"
                :class="{ 'is-active': selectedStatus === 'answered' }"
                @click="selectStatus('answered')"
              >
                已回答 {{ answeredQuestionLabel }}
              </button>
              <button
                type="button"
                :class="{ 'is-active': selectedStatus === 'pending' }"
                @click="selectStatus('pending')"
              >
                待补充 {{ pendingQuestionLabel }}
              </button>
            </div>
          </div>
        </aside>

        <section class="qa-center-main">
          <div class="qa-center-toolbar">
            <div>
              <h2>问题列表</h2>
              <p>共 {{ renderedTotalLabel }} 条结果，优先展示商品、技术、规格和采购相关问题。</p>
            </div>
            <label class="qa-center-sorter">
              <span>排序</span>
              <select v-model="sortBy" @change="handleSortChange">
                <option v-for="item in sortOptions" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
              <AppIcon :icon="ChevronDown" :size="14" />
            </label>
          </div>

          <div v-if="activeFilterChips.length" class="qa-center-chips">
            <button
              v-for="chip in activeFilterChips"
              :key="chip.key"
              type="button"
              @click="clearChip(chip.key)"
            >
              <AppIcon :icon="X" :size="12" />
              {{ chip.label }}
            </button>
            <button type="button" class="qa-center-chips__clear" @click="clearAllFilters">
              清空全部
            </button>
          </div>

          <div v-if="errorMessage" class="qa-center-empty">
            <strong>问答加载失败</strong>
            <p>{{ errorMessage }}</p>
            <button type="button" @click="loadQaCenter">重新加载</button>
          </div>

          <div v-else-if="loading" class="qa-center-empty">
            <strong>正在整理问答知识库</strong>
            <p>正在从商品、规格、资料和报价数据中生成问答内容。</p>
          </div>

          <div v-else-if="renderedQuestions.length" class="qa-center-list">
            <article
              v-for="item in renderedQuestions"
              :key="item.id"
              class="qa-card"
            >
              <header class="qa-card__header">
                <div>
                  <span class="qa-card__category">{{ item.categoryName }}</span>
                  <span class="qa-card__no">{{ item.questionNo }}</span>
                </div>
                <span class="qa-card__status" :class="getQuestionStatusClass(item.status)">
                  <AppIcon :icon="item.status === 'answered' ? CheckCircle2 : Clock3" :size="14" />
                  {{ getStatusLabel(item.status) }}
                </span>
              </header>

              <div class="qa-card__product">
                <AppIcon :icon="Package" :size="16" />
                <strong>{{ item.productModel }}</strong>
                <span>{{ item.productName }}</span>
              </div>

              <h3>{{ item.title }}</h3>
              <p class="qa-card__question">{{ item.question }}</p>
              <p class="qa-card__answer">{{ item.answer }}</p>

              <div v-if="item.relatedSpecs.length" class="qa-card__specs">
                <span v-for="spec in item.relatedSpecs" :key="`${item.id}-${spec.key}`">
                  {{ spec.label }}：{{ spec.value }}
                </span>
              </div>

              <div v-if="item.relatedDocuments.length" class="qa-card__docs">
                <AppIcon :icon="FileText" :size="15" />
                <span v-for="doc in item.relatedDocuments" :key="doc.id">
                  {{ doc.fileTypeLabel }} · {{ doc.title }}
                </span>
              </div>

              <footer class="qa-card__footer">
                <span>{{ getPriorityLabel(item.priority) }}</span>
                <span>{{ formatDateTime(item.updatedAt) }}</span>
                <span><AppIcon :icon="Eye" :size="14" /> {{ item.viewCount }}</span>
                <span><AppIcon :icon="ThumbsUp" :size="14" /> {{ item.helpfulCount }}</span>
              </footer>
            </article>
          </div>

          <div v-else class="qa-center-empty">
            <strong>没有匹配的问答</strong>
            <p>换一个商品型号、规格参数或技术关键词再搜索。</p>
            <button type="button" @click="clearAllFilters">重置筛选</button>
          </div>

          <div v-if="!loading && !errorMessage && renderedTotal > 0" class="qa-center-pagination">
            <span>第 {{ currentPage }} / {{ totalPages }} 页</span>
            <n-pagination
              :item-count="renderedTotal"
              :page="currentPage"
              :page-size="pageSize"
              @update:page="handlePageChange"
            />
          </div>
        </section>

        <aside class="qa-center-ask">
          <div class="qa-center-panel qa-center-ask__form">
            <div class="qa-center-ask__head">
              <span>
                <AppIcon :icon="MessageCircle" :size="18" />
              </span>
              <div>
                <h2>提交商品问题</h2>
                <p>用于收集待补充的商品、技术、规格和报价问题。</p>
              </div>
            </div>

            <label>
              商品型号
              <input v-model="askForm.productModel" placeholder="如 KDS2189T / AOC 27B2H" />
            </label>
            <label>
              问题方向
              <select v-model="askForm.category">
                <option v-for="category in categories" :key="category.key" :value="category.key">
                  {{ category.label }}
                </option>
              </select>
            </label>
            <label>
              问题标题
              <input v-model="askForm.title" placeholder="简要描述要确认的问题" />
            </label>
            <label>
              问题描述
              <textarea
                v-model="askForm.question"
                rows="4"
                placeholder="补充客户场景、规格疑问、报价口径或技术确认点"
                @keydown.ctrl.enter="submitQuestion"
              ></textarea>
            </label>
            <label>
              标签
              <input v-model="askForm.tags" placeholder="可选，如 选型, HDMI, 起订量" />
            </label>
            <label>
              联系人/角色
              <input v-model="askForm.contact" placeholder="可选，如 销售A / 技术B" />
            </label>

            <button
              class="qa-center-ask__submit"
              type="button"
              :disabled="submitting || !canSubmitQuestion"
              @click="submitQuestion"
            >
              <AppIcon :icon="Send" :size="16" />
              {{ submitting ? '提交中' : '提交问题' }}
            </button>
            <p v-if="submittedMessage" class="qa-center-ask__message">
              {{ submittedMessage }}
            </p>
          </div>

          <div class="qa-center-panel qa-center-hot">
            <h2>热门问题</h2>
            <a
              v-for="item in overview?.featuredQuestions || []"
              :key="item.id"
              href="#"
              @click.prevent="keyword = item.productModel; submitSearch()"
            >
              <AppIcon :icon="Cpu" :size="15" />
              <span>{{ item.title }}</span>
            </a>
          </div>
        </aside>
      </section>
    </main>
  </FrontShell>
</template>

<style scoped>
.qa-center-page {
  display: grid;
  gap: 18px;
  max-width: 1520px;
  padding: 24px;
  margin: 0 auto;
  color: #12213d;
}

.qa-center-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 0.72fr);
  gap: 18px;
  align-items: stretch;
  padding: 26px;
  overflow: hidden;
  background:
    radial-gradient(circle at 78% 10%, rgb(22 119 255 / 0.16), transparent 34%),
    linear-gradient(135deg, #ffffff 0%, #eef6ff 100%);
  border: 1px solid #dce8f6;
  border-radius: 18px;
  box-shadow: 0 18px 42px rgb(18 33 61 / 0.08);
}

.qa-center-hero__eyebrow {
  display: inline-flex;
  width: fit-content;
  padding: 6px 12px;
  margin-bottom: 14px;
  font-size: 13px;
  font-weight: 700;
  color: #1664d9;
  background: #edf5ff;
  border: 1px solid #cfdef4;
  border-radius: 999px;
}

.qa-center-hero h1,
.qa-center-toolbar h2,
.qa-center-panel h2 {
  margin: 0;
}

.qa-center-hero h1 {
  font-size: 34px;
  line-height: 1.1;
}

.qa-center-hero p,
.qa-center-toolbar p,
.qa-center-ask__head p {
  margin: 8px 0 0;
  line-height: 1.7;
  color: #52627d;
}

.qa-center-hero__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.qa-center-hero__stats div {
  display: grid;
  gap: 8px;
  align-content: center;
  min-height: 104px;
  padding: 18px;
  background: rgb(255 255 255 / 0.78);
  border: 1px solid #dce8f6;
  border-radius: 14px;
}

.qa-center-hero__stats strong {
  font-size: 28px;
}

.qa-center-hero__stats span {
  color: #60708d;
}

.qa-center-search,
.qa-center-search__bar,
.qa-center-toolbar,
.qa-card__header,
.qa-card__footer,
.qa-card__product,
.qa-card__docs,
.qa-center-pagination,
.qa-center-ask__head,
.qa-center-hot a {
  display: flex;
  align-items: center;
}

.qa-center-search {
  gap: 10px;
}

.qa-center-search__bar {
  flex: 1 1 auto;
  gap: 10px;
  height: 46px;
  padding: 0 14px;
  background: #fff;
  border: 1px solid #d9e3f0;
  border-radius: 12px;
}

.qa-center-search__bar input {
  flex: 1 1 auto;
  min-width: 0;
  font: inherit;
  border: 0;
  outline: none;
}

.qa-center-search__bar button,
.qa-center-chips button,
.qa-center-category,
.qa-center-status-filter button {
  font: inherit;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.qa-center-search__button,
.qa-center-empty button,
.qa-center-ask__submit {
  height: 46px;
  padding: 0 20px;
  font: inherit;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(135deg, #1677ff, #0f63d4);
  border: 0;
  border-radius: 12px;
}

.qa-center-layout {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr) 360px;
  gap: 18px;
  align-items: start;
}

.qa-center-sidebar,
.qa-center-ask {
  position: sticky;
  top: 82px;
  display: grid;
  gap: 14px;
}

.qa-center-panel {
  padding: 18px;
  background: #fff;
  border: 1px solid #e1e9f5;
  border-radius: 16px;
  box-shadow: 0 12px 30px rgb(18 33 61 / 0.055);
}

.qa-center-panel h2 {
  margin-bottom: 14px;
  font-size: 17px;
}

.qa-center-category {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 4px 10px;
  width: 100%;
  padding: 12px;
  color: #33435f;
  text-align: left;
  border-radius: 12px;
}

.qa-center-category + .qa-center-category {
  margin-top: 6px;
}

.qa-center-category small {
  grid-column: 1 / -1;
  color: #7a8aa5;
}

.qa-center-category.is-active,
.qa-center-status-filter button.is-active {
  color: #1664d9;
  background: #edf5ff;
}

.qa-center-status-filter {
  display: grid;
  gap: 8px;
}

.qa-center-status-filter button {
  padding: 10px 12px;
  color: #52627d;
  text-align: left;
  border-radius: 10px;
}

.qa-center-main {
  min-width: 0;
}

.qa-center-toolbar {
  justify-content: space-between;
  gap: 14px;
  padding: 4px 0 12px;
}

.qa-center-sorter {
  position: relative;
  display: inline-flex;
  gap: 8px;
  align-items: center;
  min-width: 150px;
  height: 36px;
  padding: 0 28px 0 12px;
  color: #60708d;
  background: #fff;
  border: 1px solid #dce4f0;
  border-radius: 10px;
}

.qa-center-sorter select {
  flex: 1 1 auto;
  font: inherit;
  color: #22344f;
  appearance: none;
  background: transparent;
  border: 0;
  outline: none;
}

.qa-center-sorter .app-icon {
  position: absolute;
  right: 10px;
}

.qa-center-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.qa-center-chips button {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  height: 30px;
  padding: 0 10px;
  color: #52627d;
  background: #fff;
  border: 1px solid #dfe8f6;
  border-radius: 999px;
}

.qa-center-chips .qa-center-chips__clear {
  color: #1664d9;
  background: transparent;
  border-color: transparent;
}

.qa-center-list {
  display: grid;
  gap: 12px;
}

.qa-card {
  padding: 18px;
  background: #fff;
  border: 1px solid #e1e9f5;
  border-radius: 16px;
  box-shadow: 0 12px 28px rgb(18 33 61 / 0.055);
}

.qa-card__header {
  justify-content: space-between;
  gap: 12px;
}

.qa-card__category,
.qa-card__status,
.qa-card__no {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 9px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 999px;
}

.qa-card__category {
  color: #1664d9;
  background: #edf5ff;
}

.qa-card__no {
  margin-left: 6px;
  color: #6d7d97;
  background: #f4f7fb;
}

.qa-card__status {
  gap: 5px;
}

.qa-card__status.is-answered {
  color: #0f9488;
  background: #eef9f7;
}

.qa-card__status.is-pending {
  color: #d87312;
  background: #fff7ea;
}

.qa-card__product {
  gap: 8px;
  margin-top: 12px;
  color: #60708d;
}

.qa-card h3 {
  margin: 14px 0 8px;
  font-size: 19px;
}

.qa-card__question,
.qa-card__answer {
  margin: 0;
  line-height: 1.7;
}

.qa-card__question {
  color: #233450;
}

.qa-card__answer {
  margin-top: 8px;
  color: #5c6d88;
}

.qa-card__specs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.qa-card__specs span {
  padding: 7px 10px;
  font-size: 13px;
  color: #435672;
  background: #f7faff;
  border: 1px solid #e1e9f5;
  border-radius: 999px;
}

.qa-card__docs {
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  color: #60708d;
}

.qa-card__docs span {
  font-size: 13px;
}

.qa-card__footer {
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 14px;
  margin-top: 14px;
  font-size: 13px;
  color: #71829e;
  border-top: 1px solid #edf2f8;
}

.qa-card__footer span {
  display: inline-flex;
  gap: 5px;
  align-items: center;
}

.qa-center-empty {
  display: grid;
  gap: 10px;
  justify-items: center;
  padding: 56px 20px;
  background: #fff;
  border: 1px solid #e1e9f5;
  border-radius: 16px;
}

.qa-center-empty p {
  margin: 0;
  color: #60708d;
}

.qa-center-pagination {
  justify-content: space-between;
  gap: 12px;
  padding: 16px 4px 0;
  color: #60708d;
}

.qa-center-ask__head {
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 14px;
}

.qa-center-ask__head > span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  color: #fff;
  background: #1664d9;
  border-radius: 12px;
}

.qa-center-ask__form label {
  display: grid;
  gap: 6px;
  margin-top: 12px;
  font-size: 13px;
  font-weight: 700;
  color: #52627d;
}

.qa-center-ask__form input,
.qa-center-ask__form select,
.qa-center-ask__form textarea {
  width: 100%;
  padding: 10px 12px;
  font: inherit;
  color: #233450;
  background: #fff;
  border: 1px solid #dce4f0;
  border-radius: 10px;
  outline: none;
}

.qa-center-ask__form textarea {
  resize: vertical;
}

.qa-center-ask__submit {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: 14px;
}

.qa-center-ask__submit:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.qa-center-ask__message {
  margin: 10px 0 0;
  line-height: 1.6;
  color: #0f9488;
}

.qa-center-hot {
  display: grid;
  gap: 10px;
}

.qa-center-hot a {
  gap: 8px;
  padding: 10px 0;
  color: #33435f;
}

.qa-center-hot a + a {
  border-top: 1px solid #edf2f8;
}

@media (max-width: 1200px) {
  .qa-center-layout {
    grid-template-columns: 220px minmax(0, 1fr);
  }

  .qa-center-ask {
    position: static;
    grid-column: 1 / -1;
  }
}

@media (max-width: 860px) {
  .qa-center-page {
    padding: 16px;
  }

  .qa-center-hero,
  .qa-center-layout {
    grid-template-columns: 1fr;
  }

  .qa-center-sidebar {
    position: static;
  }

  .qa-center-search,
  .qa-center-toolbar,
  .qa-center-pagination {
    align-items: stretch;
    flex-direction: column;
  }

  .qa-center-search__button {
    width: 100%;
  }
}
</style>
