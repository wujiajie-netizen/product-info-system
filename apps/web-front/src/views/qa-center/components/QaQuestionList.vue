<script setup lang="ts">
import { CheckCircle2, CircleHelp } from 'lucide-vue-next';
import { NSkeleton } from 'naive-ui';

import type { QaQuestionItem } from '@/api/qa-center';
import AppIcon from '@/components/AppIcon.vue';

const props = defineProps<{
  currentPage: number;
  errorMessage: string;
  expandedQuestionIds: string[];
  loading: boolean;
  questions: QaQuestionItem[];
  renderedQuestionsLength: number;
  totalPages: number;
}>();

const skeletonQuestions = Array.from({ length: 5 }, (_, index) => index);

const emit = defineEmits<{
  'page-change': [page: number];
  reload: [];
  toggle: [item: QaQuestionItem];
}>();

function getStatusLabel(status: QaQuestionItem['status']) {
  return status === 'answered' ? '已回答' : '待补充';
}

function getQuestionStatusClass(status: QaQuestionItem['status']) {
  return status === 'answered' ? 'is-answered' : 'is-pending';
}

function formatDateTime(value?: null | string) {
  return value ? value.slice(0, 10) : '-';
}

function hasAnswer(item: QaQuestionItem) {
  return item.status === 'answered' && Boolean(item.answer?.trim());
}

function isExpanded(questionId: string) {
  return props.expandedQuestionIds.includes(questionId);
}
</script>

<template>
  <section class="qa-center-list-panel">
    <div class="qa-center-scroll-area">
      <div v-if="errorMessage" class="qa-center-empty">
        <strong>问答加载失败</strong>
        <p>{{ errorMessage }}</p>
        <button type="button" @click="emit('reload')">重新加载</button>
      </div>

      <div v-else-if="loading" class="qa-center-list qa-center-list--skeleton" aria-hidden="true">
        <article
          v-for="item in skeletonQuestions"
          :key="`qa-question-skeleton-${item}`"
          class="qa-card qa-card--skeleton"
        >
          <div class="qa-card__main">
            <div class="qa-skeleton-meta">
              <n-skeleton text class="qa-skeleton-pill qa-skeleton-pill--category" />
              <n-skeleton text class="qa-skeleton-pill qa-skeleton-pill--no" />
              <n-skeleton text class="qa-skeleton-pill qa-skeleton-pill--model" />
            </div>
            <n-skeleton text class="qa-skeleton-line qa-skeleton-line--title" />
            <n-skeleton text class="qa-skeleton-line qa-skeleton-line--long" />
            <div class="qa-skeleton-footer">
              <n-skeleton text />
              <n-skeleton text />
              <n-skeleton text />
            </div>
          </div>
          <div class="qa-card__actions qa-skeleton-actions">
            <n-skeleton text class="qa-skeleton-action-status" />
            <n-skeleton text class="qa-skeleton-action-link" />
          </div>
        </article>
      </div>

      <div v-else-if="questions.length" class="qa-center-list">
        <article
          v-for="item in questions"
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
              @click="emit('toggle', item)"
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

    <div v-if="!loading && !errorMessage && renderedQuestionsLength" class="qa-center-pagination">
      <button type="button" :disabled="currentPage <= 1" @click="emit('page-change', currentPage - 1)">
        上一页
      </button>
      <div class="qa-center-pagination__pages">
        <button
          v-for="page in totalPages"
          :key="page"
          type="button"
          :class="{ 'is-active': currentPage === page }"
          @click="emit('page-change', page)"
        >
          {{ page }}
        </button>
      </div>
      <button
        type="button"
        :disabled="currentPage >= totalPages"
        @click="emit('page-change', currentPage + 1)"
      >
        下一页
      </button>
    </div>
  </section>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.qa-center-list-panel {
  min-width: 0;
  overflow: hidden;
  background: #fff;
  border: 1px solid #dfe8f5;
  border-radius: 16px;
  box-shadow: 0 14px 36px rgb(18 33 61 / 6%);
}

.qa-center-scroll-area {
  height: min(620px, calc(100vh - 280px));
  min-height: 430px;
  overflow-x: hidden;
  overflow-y: auto;
}

.qa-center-list {
  display: grid;
  min-width: 0;
}

.qa-card,
.qa-card--skeleton,
.qa-card__meta-row,
.qa-card__footer,
.qa-card__actions,
.qa-card__status,
.qa-center-pagination,
.qa-center-pagination__pages {
  display: flex;
  align-items: center;
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

.qa-card__actions button,
.qa-center-pagination button,
.qa-center-empty button {
  font: inherit;
  cursor: pointer;
}

.qa-card__actions button {
  font-weight: 800;
  color: #1664d9;
  background: transparent;
  border: 0;
}

.qa-card__actions button::after {
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

.qa-center-empty button {
  height: 48px;
  padding: 0 22px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, #1677ff, #0f63d4);
  border: 0;
  border-radius: 12px;
  box-shadow: 0 12px 24px rgb(22 119 255 / 18%);
}

.qa-card--skeleton {
  pointer-events: none;
}

.qa-skeleton-meta,
.qa-skeleton-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.qa-skeleton-pill,
.qa-skeleton-line,
.qa-skeleton-footer :deep(.n-skeleton),
.qa-skeleton-actions :deep(.n-skeleton) {
  display: block;
  border-radius: 999px;
}

.qa-skeleton-pill--category {
  width: 72px;
  height: 24px;
}

.qa-skeleton-pill--no {
  width: 92px;
  height: 24px;
}

.qa-skeleton-pill--model {
  width: 118px;
  height: 24px;
}

.qa-skeleton-line {
  margin-top: 10px;
  height: 16px;
}

.qa-skeleton-line--title {
  width: min(560px, 74%);
  height: 23px;
}

.qa-skeleton-line--long {
  width: min(680px, 92%);
}

.qa-skeleton-footer {
  margin-top: 12px;
}

.qa-skeleton-footer :deep(.n-skeleton) {
  width: 104px;
  height: 18px;
}

.qa-skeleton-action-status {
  width: 76px;
  height: 26px;
}

.qa-skeleton-action-link {
  width: 72px;
  height: 18px;
}

@media (max-width: 780px) {
  .qa-center-scroll-area {
    height: auto;
    min-height: 0;
  }

  .qa-card {
    align-items: stretch;
    flex-direction: column;
  }

  .qa-card__actions {
    flex: 1 1 auto;
    flex-direction: row;
    justify-content: space-between;
  }
}
</style>
