import type { BrandRecord, BrandStatus, ListParams } from './types';

import {
  assertSupabaseClient,
  normalizeKeyword,
  normalizeSlug,
  toLikePattern,
} from './client';

export interface BrandListParams extends ListParams {
  status?: BrandStatus;
}

export interface SaveBrandInput {
  aliases?: string[];
  description?: string;
  name: string;
  slug?: string;
  status?: BrandStatus;
  websiteUrl?: string;
}

export async function listBrands(params: BrandListParams = {}) {
  const supabase = assertSupabaseClient();
  const keyword = normalizeKeyword(params.keyword);
  let query = supabase.from('brands').select('*').order('name');

  if (params.status) {
    query = query.eq('status', params.status);
  }

  if (keyword) {
    const pattern = toLikePattern(keyword);
    query = query.or(`name.ilike.${pattern},slug.ilike.${pattern}`);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []) as BrandRecord[];
}

export async function createBrand(input: SaveBrandInput) {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from('brands')
    .insert({
      aliases: input.aliases || [],
      description: input.description || null,
      name: input.name,
      slug: normalizeSlug(input.slug, input.name),
      status: input.status || 'active',
      website_url: input.websiteUrl || null,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as BrandRecord;
}

export async function updateBrand(id: string, input: SaveBrandInput) {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from('brands')
    .update({
      aliases: input.aliases || [],
      description: input.description || null,
      name: input.name,
      slug: normalizeSlug(input.slug, input.name),
      status: input.status || 'active',
      website_url: input.websiteUrl || null,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as BrandRecord;
}

export async function setBrandStatus(id: string, status: BrandStatus) {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from('brands')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as BrandRecord;
}
