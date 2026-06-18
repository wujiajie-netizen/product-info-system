import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export function assertSupabaseClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      'Supabase 尚未配置，请先设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY',
    );
  }

  return supabase;
}

export function getSupabaseClient() {
  return supabase;
}

export function normalizeKeyword(keyword?: string) {
  return keyword?.trim() || '';
}

export function toLikePattern(keyword: string) {
  return `%${keyword.replaceAll('%', String.raw`\%`).replaceAll('_', String.raw`\_`)}%`;
}

export function normalizeSlug(slug: string | undefined, fallback: string) {
  const value = (slug || fallback).trim().toLowerCase();

  return value.replaceAll(/\s+/g, '-');
}
