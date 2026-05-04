import type { ListParams, ProductRecord, ProductStatus } from './types';

import {
  assertSupabaseClient,
  normalizeKeyword,
  toLikePattern,
} from './client';

export interface SaveProductInput {
  brandId?: string;
  category: string;
  categoryId?: string;
  description?: string;
  model: string;
  name: string;
  specJson?: Record<string, unknown>;
  status?: ProductStatus;
  tags?: string[];
}

export interface ProductListParams extends ListParams {
  brandId?: string;
  categoryId?: string;
  status?: ProductStatus;
}

export async function listProducts(params: ProductListParams = {}) {
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

  if (params.categoryId) {
    query = query.eq('category_id', params.categoryId);
  }

  if (params.brandId) {
    query = query.eq('brand_id', params.brandId);
  }

  if (params.status) {
    query = query.eq('status', params.status);
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
      brand_id: input.brandId || null,
      category: input.category,
      category_id: input.categoryId || null,
      description: input.description || null,
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
      brand_id: input.brandId || null,
      category: input.category,
      category_id: input.categoryId || null,
      description: input.description || null,
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
