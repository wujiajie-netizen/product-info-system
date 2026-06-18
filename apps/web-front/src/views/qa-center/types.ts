import type { QaQuestionCategory } from '#/api/qa-center';

export type FrontQaSortBy = 'latest_answered' | 'latest_created' | 'latest_updated' | 'recommend';

export type QaCategoryFilter = 'all' | QaQuestionCategory;

export interface QaAskQuestionForm {
  category: QaQuestionCategory;
  productModel: string;
  question: string;
  title: string;
}

export interface QaCategoryTab {
  count: number;
  key: QaCategoryFilter;
  label: string;
}

export interface QaSortOption {
  label: string;
  value: FrontQaSortBy;
}
