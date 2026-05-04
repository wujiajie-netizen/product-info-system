import type { CategoryRecord, CategoryStatus, ListParams } from './types';

import {
  assertSupabaseClient,
  normalizeKeyword,
  normalizeSlug,
  toLikePattern,
} from './client';

export interface CategoryListParams extends ListParams {
  parentId?: null | string;
  status?: CategoryStatus;
}

export interface SaveCategoryInput {
  description?: string;
  name: string;
  parentId?: null | string;
  slug?: string;
  sortOrder?: number;
  status?: CategoryStatus;
}

export async function listCategories(params: CategoryListParams = {}) {
  const supabase = assertSupabaseClient();
  const keyword = normalizeKeyword(params.keyword);
  let query = supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (params.status) {
    query = query.eq('status', params.status);
  }

  if (params.parentId === null) {
    query = query.is('parent_id', null);
  } else if (params.parentId) {
    query = query.eq('parent_id', params.parentId);
  }

  if (keyword) {
    const pattern = toLikePattern(keyword);
    query = query.or(`name.ilike.${pattern},slug.ilike.${pattern}`);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []) as CategoryRecord[];
}

export async function createCategory(input: SaveCategoryInput) {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from('categories')
    .insert({
      description: input.description || null,
      name: input.name,
      parent_id: input.parentId || null,
      slug: normalizeSlug(input.slug, input.name),
      sort_order: input.sortOrder || 0,
      status: input.status || 'active',
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as CategoryRecord;
}

export async function updateCategory(id: string, input: SaveCategoryInput) {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from('categories')
    .update({
      description: input.description || null,
      name: input.name,
      parent_id: input.parentId || null,
      slug: normalizeSlug(input.slug, input.name),
      sort_order: input.sortOrder || 0,
      status: input.status || 'active',
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as CategoryRecord;
}

export async function setCategoryStatus(id: string, status: CategoryStatus) {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from('categories')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as CategoryRecord;
}
