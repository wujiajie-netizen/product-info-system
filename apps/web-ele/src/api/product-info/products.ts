import { assertSupabaseClient, normalizeKeyword, toLikePattern } from './client';
import type { ListParams, ProductRecord } from './types';

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
