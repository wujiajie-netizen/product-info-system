import type { ListParams } from './types';

import { assertSupabaseClient, normalizeKeyword, toLikePattern } from './client';

export type QaQuestionCategory =
  | 'after_sales'
  | 'product'
  | 'quote'
  | 'spec'
  | 'technical';

export type QaQuestionPriority = 'high' | 'low' | 'medium';
export type QaQuestionStatus = 'answered' | 'archived' | 'pending';
export type QaQuestionSource = 'imported' | 'manual' | 'product_generated';
export type AdminQaSortBy =
  | 'latest_answered'
  | 'latest_created'
  | 'latest_updated'
  | 'pending_first'
  | 'priority_first';

export interface QaQuestionRecord {
  answer: null | string;
  answered_at: null | string;
  answered_by: null | string;
  asked_by: null | string;
  asker_role: null | string;
  category: QaQuestionCategory;
  created_at: string;
  helpful_count: number;
  id: string;
  priority: QaQuestionPriority;
  product_id: null | string;
  product_model: null | string;
  product_name: null | string;
  question: string;
  question_no: string;
  source: QaQuestionSource;
  status: QaQuestionStatus;
  tags: string[];
  title: string;
  updated_at: string;
  view_count: number;
}

export interface QaQuestionSpecRecord {
  id: string;
  question_id: string;
  sort_order: number;
  spec_key: string;
  spec_label: string;
  spec_value: string;
}

export interface QaQuestionDocumentRecord {
  document_id: string;
  question_id: string;
  relation_type: string;
}

export interface ListQaQuestionsParams extends ListParams {
  category?: '' | QaQuestionCategory;
  sortBy?: AdminQaSortBy;
  status?: '' | QaQuestionStatus;
}

export interface UpsertQaQuestionInput {
  answer?: string;
  askerRole?: string;
  category: QaQuestionCategory;
  priority: QaQuestionPriority;
  productId?: string;
  productModel?: string;
  productName?: string;
  question: string;
  status: QaQuestionStatus;
  tags?: string[];
  title: string;
}

const statusRank: Record<QaQuestionStatus, number> = {
  pending: 0,
  answered: 1,
  archived: 2,
};

const priorityRank: Record<QaQuestionPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function buildQuestionNo() {
  return `QA-${String(Date.now()).slice(-6)}`;
}

function normalizeTags(tags?: string[]) {
  return [...new Set((tags || []).map((item) => item.trim()).filter(Boolean))];
}

function timestamp(value?: null | string) {
  return value ? new Date(value).getTime() : 0;
}

function sortQaRecords(
  records: QaQuestionRecord[],
  sortBy: AdminQaSortBy = 'pending_first',
) {
  return [...records].sort((left, right) => {
    if (sortBy === 'latest_created') {
      return timestamp(right.created_at) - timestamp(left.created_at);
    }

    if (sortBy === 'latest_updated') {
      return timestamp(right.updated_at) - timestamp(left.updated_at);
    }

    if (sortBy === 'latest_answered') {
      return (
        timestamp(right.answered_at) - timestamp(left.answered_at) ||
        timestamp(right.updated_at) - timestamp(left.updated_at)
      );
    }

    if (sortBy === 'priority_first') {
      return (
        priorityRank[left.priority] - priorityRank[right.priority] ||
        statusRank[left.status] - statusRank[right.status] ||
        timestamp(right.updated_at) - timestamp(left.updated_at)
      );
    }

    return (
      statusRank[left.status] - statusRank[right.status] ||
      priorityRank[left.priority] - priorityRank[right.priority] ||
      timestamp(right.created_at) - timestamp(left.created_at)
    );
  });
}

export async function listQaQuestions(params: ListQaQuestionsParams = {}) {
  const supabase = assertSupabaseClient();
  const keyword = normalizeKeyword(params.keyword);
  let query = supabase.from('qa_questions').select('*');

  if (params.category) {
    query = query.eq('category', params.category);
  }

  if (params.status) {
    query = query.eq('status', params.status);
  }

  if (keyword) {
    const pattern = toLikePattern(keyword);
    query = query.or(
      `title.ilike.${pattern},question.ilike.${pattern},answer.ilike.${pattern},product_model.ilike.${pattern},product_name.ilike.${pattern},question_no.ilike.${pattern}`,
    );
  }

  const { data, error } = await query.order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return sortQaRecords((data || []) as QaQuestionRecord[], params.sortBy);
}

export async function createAdminQaQuestion(input: UpsertQaQuestionInput) {
  const supabase = assertSupabaseClient();
  const now = new Date().toISOString();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  const isAnswered = input.status === 'answered';
  const { data, error } = await supabase
    .from('qa_questions')
    .insert({
      answer: input.answer?.trim() || null,
      answered_at: isAnswered ? now : null,
      answered_by: isAnswered ? user?.id || null : null,
      asker_role: input.askerRole?.trim() || '后台录入',
      category: input.category,
      priority: input.priority,
      product_id: input.productId || null,
      product_model: input.productModel?.trim() || null,
      product_name: input.productName?.trim() || null,
      question: input.question.trim(),
      question_no: buildQuestionNo(),
      source: 'manual',
      status: input.status,
      tags: normalizeTags(input.tags),
      title: input.title.trim(),
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as QaQuestionRecord;
}

export async function updateAdminQaQuestion(
  id: string,
  input: UpsertQaQuestionInput,
) {
  const supabase = assertSupabaseClient();
  const now = new Date().toISOString();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  const isAnswered = input.status === 'answered';
  const { data, error } = await supabase
    .from('qa_questions')
    .update({
      answer: input.answer?.trim() || null,
      answered_at: isAnswered ? now : null,
      answered_by: isAnswered ? user?.id || null : null,
      asker_role: input.askerRole?.trim() || '后台维护',
      category: input.category,
      priority: input.priority,
      product_id: input.productId || null,
      product_model: input.productModel?.trim() || null,
      product_name: input.productName?.trim() || null,
      question: input.question.trim(),
      status: input.status,
      tags: normalizeTags(input.tags),
      title: input.title.trim(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as QaQuestionRecord;
}

export async function setQaQuestionStatus(
  id: string,
  status: QaQuestionStatus,
) {
  const supabase = assertSupabaseClient();
  const payload: Record<string, null | string> = { status };

  if (status === 'answered') {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    payload.answered_at = new Date().toISOString();
    payload.answered_by = user?.id || null;
  }

  const { data, error } = await supabase
    .from('qa_questions')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as QaQuestionRecord;
}
