import { assertSupabaseClient, normalizeKeyword, toLikePattern } from './client';
import type { ListParams, UpdateRecord, UpdateType } from './types';

export interface CreateUpdateInput {
  content?: string;
  productModel?: string;
  title: string;
  type: UpdateType;
}

export async function listUpdates(params: ListParams = {}) {
  const supabase = assertSupabaseClient();
  const keyword = normalizeKeyword(params.keyword);
  let query = supabase
    .from('updates')
    .select('*')
    .order('created_at', { ascending: false });

  if (keyword) {
    const pattern = toLikePattern(keyword);
    query = query.or(
      `title.ilike.${pattern},content.ilike.${pattern},product_model.ilike.${pattern}`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []) as UpdateRecord[];
}

export async function countThisWeekUpdates() {
  const supabase = assertSupabaseClient();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));

  const { count, error } = await supabase
    .from('updates')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', start.toISOString());

  if (error) {
    throw error;
  }

  return count || 0;
}

export async function createUpdate(input: CreateUpdateInput) {
  const supabase = assertSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  const { data, error } = await supabase
    .from('updates')
    .insert({
      content: input.content || null,
      created_by: user?.id,
      product_model: input.productModel || null,
      title: input.title,
      type: input.type,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as UpdateRecord;
}
