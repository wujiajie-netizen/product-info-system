import { computed, ref, watch } from 'vue';
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
import { useAuthState } from '#/lib/auth';
import { getErrorMessage } from '#/lib/errors';

import type {
  FrontQaSortBy,
  QaAskQuestionForm,
  QaCategoryFilter,
  QaCategoryTab,
  QaSortOption,
} from '../types';

const pageSize = 10;
const fetchPageSize = 200;

const qaCategoryKeys: QaQuestionCategory[] = [
  'product',
  'technical',
  'spec',
  'quote',
  'after_sales',
];

const sortOptions: QaSortOption[] = [
  { label: '推荐排序', value: 'recommend' },
  { label: '最新更新', value: 'latest_updated' },
  { label: '最新提问', value: 'latest_created' },
  { label: '最新回答', value: 'latest_answered' },
];

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

function createEmptyAskForm(category: QaQuestionCategory): QaAskQuestionForm {
  return {
    category,
    productModel: '',
    question: '',
    title: '',
  };
}

export function useQaCenter() {
  const auth = useAuthState();
  const route = useRoute();
  const router = useRouter();

  const loading = ref(false);
  const submitting = ref(false);
  const errorMessage = ref('');
  const submittedMessage = ref('');
  const keyword = ref('');
  const selectedCategory = ref<QaCategoryFilter>('all');
  const sortBy = ref<FrontQaSortBy>('recommend');
  const currentPage = ref(1);
  const totalResults = ref(0);
  const questions = ref<QaQuestionItem[]>([]);
  const localQuestions = ref<QaQuestionItem[]>([]);
  const categories = ref<QaCategoryOption[]>([]);
  const overview = ref<QaCenterOverview | null>(null);
  const showAskModal = ref(false);
  const expandedQuestionIds = ref<string[]>([]);
  const askForm = ref<QaAskQuestionForm>(createEmptyAskForm('product'));

  const matchedLocalQuestions = computed(() =>
    localQuestions.value.filter((item) => matchesCurrentFilters(item)),
  );
  const renderedQuestions = computed(() =>
    sortQaItems([
      ...matchedLocalQuestions.value,
      ...questions.value,
    ], sortBy.value),
  );
  const renderedTotal = computed(() => totalResults.value + matchedLocalQuestions.value.length);
  const totalPages = computed(() => Math.max(1, Math.ceil(renderedQuestions.value.length / pageSize)));
  const paginatedQuestions = computed(() => {
    const start = (currentPage.value - 1) * pageSize;
    return renderedQuestions.value.slice(start, start + pageSize);
  });
  const canSubmitQuestion = computed(
    () => Boolean(askForm.value.title.trim()) && Boolean(askForm.value.question.trim()),
  );
  const categoryTabs = computed<QaCategoryTab[]>(() => [
    {
      count: overview.value?.totalQuestions || renderedTotal.value || 0,
      key: 'all',
      label: '全部',
    },
    ...categories.value.map((item) => ({
      count: getCategoryCount(item.key) || item.count,
      key: item.key,
      label: item.label,
    })),
  ]);
  const recommendedQuestions = computed(() => sortQaItems(renderedQuestions.value, 'recommend').slice(0, 5));
  const modalDescriptionCount = computed(() => askForm.value.question.length);

  function getCategoryCount(category: QaQuestionCategory) {
    return overview.value?.categoryCounts[category] || 0;
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

  function selectRecommendedKeyword(productModel: string) {
    keyword.value = productModel;
    submitSearch();
  }

  function selectCategory(category: QaCategoryFilter) {
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
    askForm.value = createEmptyAskForm(category);
  }

  function updateAskFormField(field: keyof QaAskQuestionForm, value: QaQuestionCategory | string) {
    askForm.value = {
      ...askForm.value,
      [field]: value,
    } as QaAskQuestionForm;
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

  return {
    askForm,
    canSubmitQuestion,
    categories,
    categoryTabs,
    closeAskModal,
    currentPage,
    errorMessage,
    expandedQuestionIds,
    handlePageChange,
    keyword,
    loadQaCenter,
    loading,
    modalDescriptionCount,
    openAskModal,
    paginatedQuestions,
    recommendedQuestions,
    renderedQuestions,
    selectCategory,
    selectRecommendedKeyword,
    selectSort,
    selectedCategory,
    showAskModal,
    sortBy,
    sortOptions,
    submitQuestion,
    submitSearch,
    submittedMessage,
    submitting,
    toggleQuestion,
    totalPages,
    updateAskFormField,
  };
}
