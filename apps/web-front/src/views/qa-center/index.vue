<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  CheckCircle2,
  CircleHelp,
  Flame,
  PlusCircle,
  Search,
  Send,
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
} from '#/api/qa-center';
import { isUsingDemoData } from '#/api/product-info';
import AppIcon from '#/components/AppIcon.vue';
import FrontShell from '#/components/FrontShell.vue';
import { useAuthState } from '#/lib/auth';
import { getErrorMessage } from '#/lib/errors';

defineOptions({
  name: 'QaCenterView',
});

type FrontQaSortBy = 'latest_answered' | 'latest_created' | 'latest_updated' | 'recommend';

const auth = useAuthState();
const route = useRoute();
const router = useRouter();

const loading = ref(false);
const submitting = ref(false);
const errorMessage = ref('');
const submittedMessage = ref('');
const keyword = ref('');
const selectedCategory = ref<'all' | QaQuestionCategory>('all');
const sortBy = ref<FrontQaSortBy>('recommend');
const currentPage = ref(1);
const pageSize = 10;
const fetchPageSize = 200;
const totalResults = ref(0);
const questions = ref<QaQuestionItem[]>([]);
const localQuestions = ref<QaQuestionItem[]>([]);
const categories = ref<QaCategoryOption[]>([]);
const overview = ref<QaCenterOverview | null>(null);
const showAskModal = ref(false);
const expandedQuestionIds = ref<string[]>([]);

const askForm = ref({
  category: 'product' as QaQuestionCategory,
  productModel: '',
  question: '',
  title: '',
});

const qaCategoryKeys: QaQuestionCategory[] = [
  'product',
  'technical',
  'spec',
  'quote',
  'after_sales',
];

const sortOptions: Array<{ description: string; label: string; value: FrontQaSortBy }> = [
  {
    description: '已回答问题优先，其次按最近维护时间排列',
    label: '推荐排序',
    value: 'recommend',
  },
  {
    description: '按问题或答案最近维护时间排列',
    label: '最新更新',
    value: 'latest_updated',
  },
  {
    description: '按用户提交问题的时间排列',
    label: '最新提问',
    value: 'latest_created',
  },
  {
    description: '按后台最近补充答案的时间排列',
    label: '最新回答',
    value: 'latest_answered',
  },
];

const renderedQuestions = computed(() =>
  sortQaItems([
    ...matchedLocalQuestions.value,
    ...questions.value,
  ], sortBy.value),
);
const renderedTotal = computed(() => totalResults.value + matchedLocalQuestions.value.length);
const renderedTotalLabel = computed(() => renderedTotal.value.toLocaleString('zh-CN'));
const totalPages = computed(() => Math.max(1, Math.ceil(renderedQuestions.value.length / pageSize)));
const paginatedQuestions = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return renderedQuestions.value.slice(start, start + pageSize);
});
const canSubmitQuestion = computed(
  () => Boolean(askForm.value.title.trim()) && Boolean(askForm.value.question.trim()),
);
const categoryTabs = computed(() => [
  {
    count: overview.value?.totalQuestions || renderedTotal.value || 0,
    key: 'all' as const,
    label: '全部',
  },
  ...categories.value.map((item) => ({
    count: getCategoryCount(item.key) || item.count,
    key: item.key,
    label: item.label,
  })),
]);
const recommendedQuestions = computed(() => sortQaItems(renderedQuestions.value, 'recommend').slice(0, 5));
const matchedLocalQuestions = computed(() =>
  localQuestions.value.filter((item) => matchesCurrentFilters(item)),
);
const modalDescriptionCount = computed(() => askForm.value.question.length);
const currentSortDescription = computed(
  () => sortOptions.find((item) => item.value === sortBy.value)?.description || '',
);

function normalizeQueryValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isQaCategory(value: string): value is QaQuestionCategory {
  return qaCategoryKeys.includes(value as QaQuestionCategory);
}

function isFrontQaSortBy(value: string): value is FrontQaSortBy {
  return sortOptions.some((item) => item.value === value);
}

function timestamp(value?: null | string) {
  return value ? new Date(value).getTime() : 0;
}

function sortQaItems(items: QaQuestionItem[], nextSortBy: FrontQaSortBy) {
  return [...items].sort((left, right) => {
    if (nextSortBy === 'latest_created') {
      return timestamp(right.createdAt) - timestamp(left.createdAt);
    }

    if (nextSortBy === 'latest_updated') {
      return timestamp(right.updatedAt) - timestamp(left.updatedAt);
    }

    if (nextSortBy === 'latest_answered') {
      return (
        timestamp(right.answeredAt) - timestamp(left.answeredAt) ||
        timestamp(right.updatedAt) - timestamp(left.updatedAt)
      );
    }

    if (left.status !== right.status) {
      return left.status === 'answered' ? -1 : 1;
    }

    return timestamp(right.updatedAt) - timestamp(left.updatedAt);
  });
}

function getStatusLabel(status: QaQuestionItem['status']) {
  return status === 'answered' ? '已回答' : '待补充';
}

function getQuestionStatusClass(status: QaQuestionItem['status']) {
  return status === 'answered' ? 'is-answered' : 'is-pending';
}

function getCategoryCount(category: QaQuestionCategory) {
  return overview.value?.categoryCounts[category] || 0;
}

function formatDateTime(value?: null | string) {
  return value ? value.slice(0, 10) : '-';
}

function hasAnswer(item: QaQuestionItem) {
  return item.status === 'answered' && Boolean(item.answer?.trim());
}

function isExpanded(questionId: string) {
  return expandedQuestionIds.value.includes(questionId);
}

function toggleQuestion(item: QaQuestionItem) {
  if (!hasAnswer(item)) {
    return;
  }

  expandedQuestionIds.value = isExpanded(item.id)
    ? expandedQuestionIds.value.filter((id) => id !== item.id)
    : [...expandedQuestionIds.value, item.id];
}

function matchesCurrentFilters(item: QaQuestionItem) {
  if (selectedCategory.value !== 'all' && item.category !== selectedCategory.value) {
    return false;
  }

  const value = keyword.value.trim().toLowerCase();
  if (!value) {
    return true;
  }

  return [
    item.answer,
    item.categoryName,
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

  const nextSortBy = normalizeQueryValue(route.query.sortBy);
  sortBy.value = isFrontQaSortBy(nextSortBy) ? nextSortBy : 'recommend';

  const page = Number(normalizeQueryValue(route.query.page));
  currentPage.value = Number.isFinite(page) && page > 0 ? page : 1;
}

function buildQaRouteQuery() {
  const query: Record<string, string> = {};

  if (keyword.value.trim()) {
    query.keyword = keyword.value.trim();
  }

  if (selectedCategory.value !== 'all') {
    query.category = selectedCategory.value;
  }

  if (sortBy.value !== 'recommend') {
    query.sortBy = sortBy.value;
  }

  if (currentPage.value > 1) {
    query.page = String(currentPage.value);
  }

  return query;
}

function replaceQaRouteQuery() {
  void router.replace({
    name: 'qa-center',
    query: buildQaRouteQuery(),
  });
}

function submitSearch() {
  currentPage.value = 1;
  expandedQuestionIds.value = [];
  replaceQaRouteQuery();
}

function selectCategory(category: 'all' | QaQuestionCategory) {
  selectedCategory.value = category;
  currentPage.value = 1;
  expandedQuestionIds.value = [];
  replaceQaRouteQuery();
}

function selectSort(nextSortBy: FrontQaSortBy) {
  sortBy.value = nextSortBy;
  currentPage.value = 1;
  expandedQuestionIds.value = [];
  replaceQaRouteQuery();
}

function handlePageChange(page: number) {
  currentPage.value = page;
  expandedQuestionIds.value = [];
  replaceQaRouteQuery();
}

function openAskModal() {
  submittedMessage.value = '';
  showAskModal.value = true;
}

function closeAskModal() {
  showAskModal.value = false;
  submittedMessage.value = '';
}

function resetAskForm(category: QaQuestionCategory) {
  askForm.value = {
    category,
    productModel: '',
    question: '',
    title: '',
  };
}

async function submitQuestion() {
  if (!canSubmitQuestion.value) {
    return;
  }

  submitting.value = true;
  submittedMessage.value = '';

  try {
    const question = await createQaQuestion({
      category: askForm.value.category,
      productModel: askForm.value.productModel,
      question: askForm.value.question,
      tags: [],
      title: askForm.value.title,
    });

    localQuestions.value = [question, ...localQuestions.value];
    selectedCategory.value = question.category;
    sortBy.value = 'latest_created';
    currentPage.value = 1;
    expandedQuestionIds.value = [];
    resetAskForm(question.category);
    showAskModal.value = false;
    replaceQaRouteQuery();
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
        page: 1,
        pageSize: fetchPageSize,
        sortBy: 'latest',
      }),
      listQaCategories(),
      getQaCenterOverview(),
    ]);

    questions.value = pagedResult.items;
    categories.value = nextCategories;
    overview.value = nextOverview;
    totalResults.value = pagedResult.total;

    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value;
      replaceQaRouteQuery();
    }
  } catch (error) {
    errorMessage.value = getErrorMessage(error);
    questions.value = [];
    totalResults.value = 0;
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
        <span class="qa-center-hero__eyebrow">商品知识问答</span>
        <h1>问答中心</h1>
        <p>
          围绕商品、技术、规格、配件和交付等问题，帮助销售、采购和技术同事快速查询与资料。
        </p>
        <div class="qa-center-search">
          <div class="qa-center-search__bar">
            <AppIcon :icon="Search" :size="18" />
            <input
              v-model="keyword"
              type="text"
              placeholder="搜索商品型号 / 技术问题 / 规格参数 / 应用场景"
              @keyup.enter="submitSearch"
            />
            <button
              v-if="keyword"
              type="button"
              aria-label="清空搜索"
              @click="keyword = ''; submitSearch()"
            >
              <AppIcon :icon="X" :size="16" />
            </button>
          </div>
          <button class="qa-center-search__button" type="button" @click="submitSearch">
            搜索问答
          </button>
        </div>
      </section>

      <section class="qa-center-tabs-row">
        <div class="qa-center-tabs" aria-label="问题分类">
          <button
            v-for="tab in categoryTabs"
            :key="tab.key"
            type="button"
            :class="{ 'is-active': selectedCategory === tab.key }"
            @click="selectCategory(tab.key)"
          >
            <span>{{ tab.label }}</span>
            <strong>{{ tab.count }}</strong>
          </button>
        </div>
        <button class="qa-center-submit-button" type="button" @click="openAskModal">
          <AppIcon :icon="PlusCircle" :size="17" />
          提交商品问题
        </button>
      </section>

      <section class="qa-center-content">
        <section class="qa-center-list-panel">
          <div class="qa-center-list-panel__head">
            <div class="qa-center-list-panel__title">
              <h2>问题列表</h2>
              <p>共 {{ renderedTotalLabel }} 条结果，每页展示 10 条，只有已回答问题展示答案。</p>
            </div>
            <div class="qa-center-sort">
              <label for="qa-sort">排序</label>
              <select id="qa-sort" v-model="sortBy" @change="selectSort(sortBy)">
                <option v-for="option in sortOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              <small>{{ currentSortDescription }}</small>
            </div>
          </div>

          <div class="qa-center-scroll-area">
            <div v-if="errorMessage" class="qa-center-empty">
              <strong>问答加载失败</strong>
              <p>{{ errorMessage }}</p>
              <button type="button" @click="loadQaCenter">重新加载</button>
            </div>

            <div v-else-if="loading" class="qa-center-empty">
              <strong>正在整理问答知识库</strong>
              <p>正在从商品、规格、资料和报价数据中生成问答内容。</p>
            </div>

            <div v-else-if="paginatedQuestions.length" class="qa-center-list">
              <article
                v-for="item in paginatedQuestions"
                :key="item.id"
                class="qa-card"
                :class="{ 'is-expanded': isExpanded(item.id) }"
              >
                <div class="qa-card__main">
                  <div class="qa-card__meta-row">
                    <span class="qa-card__category">{{ item.categoryName }}</span>
                    <span class="qa-card__no">{{ item.questionNo }}</span>
                    <span class="qa-card__model">{{ item.productModel }}</span>
                    <span v-if="item.productName" class="qa-card__product-name">
                      {{ item.productName }}
                    </span>
                  </div>
                  <h3>{{ item.title }}</h3>
                  <p v-if="hasAnswer(item)" class="qa-card__answer-preview">{{ item.answer }}</p>
                  <p v-else class="qa-card__pending-text">该问题已进入待补充队列，暂未发布标准答案。</p>
                  <div v-if="isExpanded(item.id) && hasAnswer(item)" class="qa-card__expanded-body">
                    <p>{{ item.answer }}</p>
                    <div v-if="item.relatedSpecs.length" class="qa-card__specs">
                      <span v-for="spec in item.relatedSpecs" :key="`${item.id}-${spec.key}`">
                        {{ spec.label }}：{{ spec.value }}
                      </span>
                    </div>
                    <div v-if="item.relatedDocuments.length" class="qa-card__docs">
                      <span v-for="doc in item.relatedDocuments" :key="doc.id">
                        {{ doc.fileTypeLabel }} · {{ doc.title }}
                      </span>
                    </div>
                  </div>
                  <footer class="qa-card__footer">
                    <span>更新：{{ formatDateTime(item.updatedAt) }}</span>
                    <span v-if="item.answeredAt">回答：{{ formatDateTime(item.answeredAt) }}</span>
                    <span>提问：{{ formatDateTime(item.createdAt) }}</span>
                  </footer>
                </div>
                <div class="qa-card__actions">
                  <span class="qa-card__status" :class="getQuestionStatusClass(item.status)">
                    <AppIcon :icon="item.status === 'answered' ? CheckCircle2 : CircleHelp" :size="13" />
                    {{ getStatusLabel(item.status) }}
                  </span>
                  <button
                    v-if="hasAnswer(item)"
                    type="button"
                    :aria-expanded="isExpanded(item.id)"
                    @click="toggleQuestion(item)"
                  >
                    {{ isExpanded(item.id) ? '收起' : '查看详情' }}
                  </button>
                </div>
              </article>
            </div>

            <div v-else class="qa-center-empty">
              <strong>没有匹配的问答</strong>
              <p>换一个商品型号、规格参数或技术关键词再搜索。</p>
            </div>
          </div>

          <div v-if="!loading && !errorMessage && renderedQuestions.length" class="qa-center-pagination">
            <button type="button" :disabled="currentPage <= 1" @click="handlePageChange(currentPage - 1)">
              上一页
            </button>
            <div class="qa-center-pagination__pages">
              <button
                v-for="page in totalPages"
                :key="page"
                type="button"
                :class="{ 'is-active': currentPage === page }"
                @click="handlePageChange(page)"
              >
                {{ page }}
              </button>
            </div>
            <button
              type="button"
              :disabled="currentPage >= totalPages"
              @click="handlePageChange(currentPage + 1)"
            >
              下一页
            </button>
          </div>
        </section>

        <aside class="qa-center-hot-panel">
          <div class="qa-center-hot-panel__title">
            <AppIcon :icon="Flame" :size="18" />
            <h2>推荐问题</h2>
          </div>
          <div class="qa-center-hot-list">
            <button
              v-for="(item, index) in recommendedQuestions"
              :key="item.id"
              type="button"
              @click="keyword = item.productModel; submitSearch()"
            >
              <strong>{{ index + 1 }}</strong>
              <span>{{ item.title }}</span>
            </button>
          </div>
          <button class="qa-center-hot-more" type="button" @click="selectCategory('all')">
            查看更多
          </button>
        </aside>
      </section>
    </main>

    <div v-if="showAskModal" class="qa-modal-mask" @click.self="closeAskModal">
      <section class="qa-modal" role="dialog" aria-modal="true" aria-label="提交商品问题">
        <header class="qa-modal__header">
          <h2>提交商品问题</h2>
          <button type="button" aria-label="关闭弹窗" @click="closeAskModal">
            <AppIcon :icon="X" :size="18" />
          </button>
        </header>

        <div class="qa-modal__body">
          <label>
            商品型号 <span>*</span>
            <input v-model="askForm.productModel" placeholder="请输入商品型号，如 CTRL-200A" />
          </label>
          <label>
            问题方向 <span>*</span>
            <select v-model="askForm.category">
              <option v-for="category in categories" :key="category.key" :value="category.key">
                {{ category.label }}
              </option>
            </select>
          </label>
          <label>
            问题标题 <span>*</span>
            <input v-model="askForm.title" placeholder="请简明扼要输入问题标题" />
          </label>
          <label>
            问题描述 <span>*</span>
            <textarea
              v-model="askForm.question"
              rows="5"
              maxlength="500"
              placeholder="请详细描述您的问题，以便我们更准确地为您解答"
            ></textarea>
            <small>{{ modalDescriptionCount }}/500</small>
          </label>
          <p v-if="submittedMessage" class="qa-modal__message">{{ submittedMessage }}</p>
        </div>

        <footer class="qa-modal__footer">
          <button type="button" class="qa-modal__cancel" @click="closeAskModal">取消</button>
          <button
            type="button"
            class="qa-modal__submit"
            :disabled="submitting || !canSubmitQuestion"
            @click="submitQuestion"
          >
            <AppIcon :icon="Send" :size="15" />
            {{ submitting ? '提交中' : '提交问题' }}
          </button>
        </footer>
      </section>
    </div>
  </FrontShell>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.qa-center-page {
  display: grid;
  gap: 18px;
  width: 100%;
  max-width: 1520px;
  padding: 28px 24px 24px;
  margin: 0 auto;
  overflow-x: hidden;
  color: #12213d;
}

.qa-center-hero {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.qa-center-hero__eyebrow {
  display: inline-flex;
  width: fit-content;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 800;
  color: #1664d9;
  background: #edf5ff;
  border: 1px solid #cfdef4;
  border-radius: 999px;
}

.qa-center-hero h1,
.qa-center-list-panel__head h2,
.qa-center-hot-panel h2,
.qa-modal h2 {
  margin: 0;
}

.qa-center-hero h1 {
  font-size: 34px;
  line-height: 1.1;
}

.qa-center-hero p,
.qa-center-list-panel__head p,
.qa-center-sort small {
  margin: 0;
  line-height: 1.7;
  color: #52627d;
}

.qa-center-search,
.qa-center-search__bar,
.qa-center-tabs-row,
.qa-center-tabs,
.qa-center-list-panel__head,
.qa-card,
.qa-card__meta-row,
.qa-card__footer,
.qa-card__actions,
.qa-card__status,
.qa-center-hot-panel__title,
.qa-center-hot-list button,
.qa-center-submit-button,
.qa-center-pagination,
.qa-center-pagination__pages,
.qa-modal__header,
.qa-modal__footer,
.qa-modal__submit {
  display: flex;
  align-items: center;
}

.qa-center-search {
  gap: 14px;
  min-width: 0;
  margin-top: 12px;
}

.qa-center-search__bar {
  flex: 1 1 auto;
  gap: 10px;
  min-width: 0;
  height: 48px;
  padding: 0 16px;
  background: #fff;
  border: 1px solid #d9e3f0;
  border-radius: 12px;
  box-shadow: 0 8px 22px rgb(18 33 61 / 3.5%);
}

.qa-center-search__bar input {
  flex: 1 1 auto;
  min-width: 0;
  font: inherit;
  border: 0;
  outline: none;
}

.qa-center-search__bar button,
.qa-center-tabs button,
.qa-card__actions button,
.qa-center-hot-list button,
.qa-center-hot-more,
.qa-center-pagination button,
.qa-modal__header button {
  font: inherit;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.qa-center-search__button,
.qa-center-submit-button,
.qa-modal__submit,
.qa-center-empty button {
  height: 48px;
  padding: 0 22px;
  font: inherit;
  font-weight: 800;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(135deg, #1677ff, #0f63d4);
  border: 0;
  border-radius: 12px;
  box-shadow: 0 12px 24px rgb(22 119 255 / 18%);
}

.qa-center-tabs-row {
  gap: 18px;
  justify-content: space-between;
  min-width: 0;
  padding: 6px 0 0;
  border-top: 1px solid #e5edf7;
}

.qa-center-tabs {
  flex: 1 1 auto;
  flex-wrap: wrap;
  gap: 10px;
  min-width: 0;
}

.qa-center-tabs button {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  min-width: 92px;
  height: 40px;
  padding: 0 14px;
  color: #4a5b78;
  background: rgb(255 255 255 / 70%);
  border: 1px solid transparent;
  border-radius: 999px;
}

.qa-center-tabs button:hover,
.qa-center-tabs button.is-active {
  color: #1664d9;
  background: #fff;
  border-color: #9cc6ff;
}

.qa-center-tabs button strong {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 22px;
  padding: 0 7px;
  font-size: 12px;
  color: #647590;
  background: #f2f6fb;
  border-radius: 999px;
}

.qa-center-tabs button.is-active strong {
  color: #fff;
  background: #1677ff;
}

.qa-center-submit-button {
  flex: 0 0 auto;
  gap: 8px;
  height: 42px;
  padding: 0 18px;
}

.qa-center-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 20px;
  align-items: start;
  min-width: 0;
}

.qa-center-list-panel,
.qa-center-hot-panel {
  min-width: 0;
  background: #fff;
  border: 1px solid #dfe8f5;
  border-radius: 16px;
  box-shadow: 0 14px 36px rgb(18 33 61 / 6%);
}

.qa-center-list-panel {
  overflow: hidden;
}

.qa-center-list-panel__head {
  gap: 16px;
  justify-content: space-between;
  min-width: 0;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #edf2f8;
}

.qa-center-list-panel__title {
  min-width: 0;
}

.qa-center-list-panel__head h2 {
  font-size: 20px;
}

.qa-center-sort {
  display: grid;
  flex: 0 0 210px;
  gap: 6px;
}

.qa-center-sort label {
  font-size: 12px;
  font-weight: 800;
  color: #52627d;
}

.qa-center-sort select,
.qa-modal select,
.qa-modal input,
.qa-modal textarea {
  width: 100%;
  font: inherit;
  background: #fff;
  border: 1px solid #d9e3f0;
  border-radius: 10px;
}

.qa-center-sort select {
  height: 36px;
  padding: 0 10px;
}

.qa-center-sort small {
  font-size: 12px;
}

.qa-center-scroll-area {
  height: min(620px, calc(100vh - 350px));
  min-height: 430px;
  overflow-x: hidden;
  overflow-y: auto;
}

.qa-center-list {
  display: grid;
  min-width: 0;
}

.qa-card {
  gap: 18px;
  justify-content: space-between;
  width: 100%;
  min-width: 0;
  padding: 18px 20px;
  border-bottom: 1px solid #edf2f8;
}

.qa-card__main {
  flex: 1 1 auto;
  min-width: 0;
}

.qa-card__meta-row {
  flex-wrap: wrap;
  gap: 10px;
  min-width: 0;
  color: #6b7b95;
}

.qa-card__category,
.qa-card__status {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 9px;
  font-size: 12px;
  font-weight: 800;
  border-radius: 999px;
}

.qa-card__category {
  color: #1664d9;
  background: #edf5ff;
}

.qa-card__no,
.qa-card__model {
  font-weight: 700;
  color: #60708d;
}

.qa-card__product-name {
  min-width: 0;
  overflow: hidden;
  color: #7b8ba5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qa-card h3 {
  max-width: 100%;
  margin: 10px 0 6px;
  overflow: hidden;
  font-size: 19px;
  line-height: 1.35;
  color: #10203a;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qa-card__answer-preview,
.qa-card__pending-text {
  max-width: 100%;
  margin: 0;
  overflow: hidden;
  line-height: 1.7;
  color: #5c6d88;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qa-card__pending-text {
  color: #9a6a20;
}

.qa-card.is-expanded .qa-card__answer-preview {
  display: none;
}

.qa-card__expanded-body {
  display: grid;
  gap: 12px;
  max-width: 100%;
  padding: 12px 14px;
  margin-top: 10px;
  overflow-wrap: anywhere;
  background: #f7faff;
  border: 1px solid #e1e9f5;
  border-radius: 12px;
}

.qa-card__expanded-body p {
  margin: 0;
  line-height: 1.75;
  color: #4f607c;
}

.qa-card__specs,
.qa-card__docs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.qa-card__specs span,
.qa-card__docs span {
  max-width: 100%;
  padding: 6px 9px;
  overflow: hidden;
  font-size: 12px;
  color: #48617f;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: #fff;
  border: 1px solid #dce8f6;
  border-radius: 999px;
}

.qa-card__footer {
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 10px;
  font-size: 13px;
  color: #7d8da8;
}

.qa-card__actions {
  flex: 0 0 108px;
  flex-direction: column;
  gap: 22px;
  align-self: stretch;
  justify-content: center;
}

.qa-card__status {
  gap: 5px;
}

.qa-card__status.is-answered {
  color: #0f9488;
  background: #eaf8f5;
}

.qa-card__status.is-pending {
  color: #d87312;
  background: #fff7ea;
}

.qa-card__actions button {
  font-weight: 800;
  color: #1664d9;
}

.qa-card__actions button::after,
.qa-center-hot-more::after {
  margin-left: 7px;
  content: '›';
}

.qa-card.is-expanded .qa-card__actions button::after {
  content: '⌃';
}

.qa-center-pagination {
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
  padding: 14px 18px;
  border-top: 1px solid #edf2f8;
}

.qa-center-pagination button {
  height: 32px;
  min-width: 32px;
  padding: 0 10px;
  color: #4a5b78;
  background: #fff;
  border: 1px solid #dfe8f5;
  border-radius: 8px;
}

.qa-center-pagination button.is-active {
  color: #fff;
  background: #1677ff;
  border-color: #1677ff;
}

.qa-center-pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.qa-center-pagination__pages {
  flex-wrap: wrap;
  gap: 6px;
}

.qa-center-hot-panel {
  position: sticky;
  top: 84px;
  padding: 22px;
}

.qa-center-hot-panel__title {
  gap: 8px;
  margin-bottom: 16px;
}

.qa-center-hot-panel__title .app-icon {
  color: #ef4c3c;
}

.qa-center-hot-panel h2 {
  font-size: 18px;
}

.qa-center-hot-list {
  display: grid;
  gap: 14px;
}

.qa-center-hot-list button {
  gap: 10px;
  width: 100%;
  padding: 0;
  text-align: left;
}

.qa-center-hot-list strong {
  display: inline-flex;
  flex: 0 0 24px;
  align-items: center;
  justify-content: center;
  height: 24px;
  color: #fff;
  background: #1677ff;
  border-radius: 999px;
}

.qa-center-hot-list span {
  min-width: 0;
  overflow: hidden;
  color: #44556f;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qa-center-hot-more {
  margin-top: 18px;
  font-weight: 800;
  color: #1664d9;
}

.qa-center-empty {
  display: grid;
  gap: 8px;
  place-items: center;
  min-height: 260px;
  padding: 32px;
  text-align: center;
  color: #52627d;
}

.qa-center-empty strong {
  color: #10203a;
}

.qa-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgb(15 23 42 / 45%);
}

.qa-modal {
  width: min(640px, 100%);
  overflow: hidden;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 24px 80px rgb(15 23 42 / 28%);
}

.qa-modal__header {
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid #edf2f8;
}

.qa-modal__body {
  display: grid;
  gap: 14px;
  padding: 20px;
}

.qa-modal__body label {
  display: grid;
  gap: 7px;
  font-weight: 800;
  color: #25334d;
}

.qa-modal__body label span,
.qa-modal__message {
  color: #ef4c3c;
}

.qa-modal select,
.qa-modal input {
  height: 42px;
  padding: 0 12px;
}

.qa-modal textarea {
  min-height: 120px;
  padding: 10px 12px;
  resize: vertical;
}

.qa-modal small {
  justify-self: end;
  color: #7d8da8;
}

.qa-modal__footer {
  gap: 10px;
  justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid #edf2f8;
}

.qa-modal__cancel {
  height: 42px;
  padding: 0 18px;
  font: inherit;
  font-weight: 800;
  color: #4a5b78;
  cursor: pointer;
  background: #fff;
  border: 1px solid #d9e3f0;
  border-radius: 12px;
}

.qa-modal__submit {
  gap: 7px;
  height: 42px;
}

.qa-modal__submit:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

@media (max-width: 1180px) {
  .qa-center-content {
    grid-template-columns: 1fr;
  }

  .qa-center-hot-panel {
    position: static;
  }
}

@media (max-width: 780px) {
  .qa-center-page {
    padding: 20px 14px;
  }

  .qa-center-search,
  .qa-center-tabs-row,
  .qa-center-list-panel__head,
  .qa-card {
    align-items: stretch;
    flex-direction: column;
  }

  .qa-center-sort {
    flex: 1 1 auto;
  }

  .qa-center-scroll-area {
    height: auto;
    min-height: 0;
  }

  .qa-card__actions {
    flex: 1 1 auto;
    flex-direction: row;
    justify-content: space-between;
  }
}
</style>
