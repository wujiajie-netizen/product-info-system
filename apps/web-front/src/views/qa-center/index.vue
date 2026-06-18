<script setup lang="ts">
import QaAskQuestionModal from '#/components/business/qa-center/QaAskQuestionModal.vue';
import QaCenterHero from '#/components/business/qa-center/QaCenterHero.vue';
import QaCenterToolbar from '#/components/business/qa-center/QaCenterToolbar.vue';
import QaQuestionList from '#/components/business/qa-center/QaQuestionList.vue';
import QaRecommendedPanel from '#/components/business/qa-center/QaRecommendedPanel.vue';
import FrontShell from '#/components/FrontShell.vue';
import { useQaCenter } from '#/hooks/useQaCenter';

defineOptions({
  name: 'QaCenterView',
});

const {
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
} = useQaCenter();
</script>

<template>
  <FrontShell>
    <main class="qa-center-page">
      <QaCenterHero v-model:keyword="keyword" @search="submitSearch" />

      <QaCenterToolbar
        :tabs="categoryTabs"
        :selected-category="selectedCategory"
        :sort-by="sortBy"
        :sort-options="sortOptions"
        @select-category="selectCategory"
        @select-sort="selectSort"
        @open-ask="openAskModal"
      />

      <section class="qa-center-content">
        <QaQuestionList
          :error-message="errorMessage"
          :loading="loading"
          :questions="paginatedQuestions"
          :rendered-questions-length="renderedQuestions.length"
          :current-page="currentPage"
          :total-pages="totalPages"
          :expanded-question-ids="expandedQuestionIds"
          @reload="loadQaCenter"
          @toggle="toggleQuestion"
          @page-change="handlePageChange"
        />

        <QaRecommendedPanel
          :questions="recommendedQuestions"
          @select-keyword="selectRecommendedKeyword"
          @show-all="selectCategory('all')"
        />
      </section>
    </main>

    <QaAskQuestionModal
      v-if="showAskModal"
      :form="askForm"
      :categories="categories"
      :submitted-message="submittedMessage"
      :submitting="submitting"
      :can-submit-question="canSubmitQuestion"
      :description-count="modalDescriptionCount"
      @close="closeAskModal"
      @submit="submitQuestion"
      @update-form-field="updateAskFormField"
    />
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

.qa-center-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 20px;
  align-items: start;
  min-width: 0;
}

@media (max-width: 1180px) {
  .qa-center-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 780px) {
  .qa-center-page {
    padding: 20px 14px;
  }
}
</style>
