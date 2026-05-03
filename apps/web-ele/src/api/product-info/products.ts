import type { ListParams, ProductRecord, ProductStatus } from './types';

import {
  assertSupabaseClient,
  normalizeKeyword,
  toLikePattern,
} from './client';

export interface SaveProductInput {
  category: string;
  model: string;
  name: string;
  specJson?: Record<string, unknown>;
  status?: ProductStatus;
  tags?: string[];
}

export async function listProducts(params: ListParams = {}) {
  const supabase = assertSupabaseClient();
  const keyword = normalizeKeyword(params.keyword);
  let query = supabase
    .from('products')
    .select('*')
    .order('updated_at', { ascending: false });

  if (keyword) {
    const pattern = toLikePattern(keyword);
    query = query.or(
      `model.ilike.${pattern},name.ilike.${pattern},category.ilike.${pattern}`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []) as ProductRecord[];
}

export async function countProducts() {
  const supabase = assertSupabaseClient();
  const { count, error } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true });

  if (error) {
    throw error;
  }

  return count || 0;
}

export async function createProduct(input: SaveProductInput) {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from('products')
    .insert({
      category: input.category,
      model: input.model,
      name: input.name,
      spec_json: input.specJson || {},
      status: input.status || 'active',
      tags: input.tags || [],
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as ProductRecord;
}

export async function updateProduct(id: string, input: SaveProductInput) {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from('products')
    .update({
      category: input.category,
      model: input.model,
      name: input.name,
      spec_json: input.specJson || {},
      status: input.status || 'active',
      tags: input.tags || [],
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as ProductRecord;
}

export async function setProductStatus(id: string, status: ProductStatus) {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from('products')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as ProductRecord;
}
