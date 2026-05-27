import type { ProductSpecItemRecord } from './types';

import { assertSupabaseClient } from './client';

export interface SaveProductSpecItemInput {
  isFilterable?: boolean;
  sectionKey?: string;
  sectionLabel?: string;
  sortOrder?: number;
  specKey: string;
  specLabel?: string;
  unit?: string;
  valueJson?: Record<string, unknown> | null;
  valueNumber?: number | null;
  valueText?: string | null;
  variantId: string;
}

export async function listProductSpecItems(variantId: string) {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from('product_spec_items')
    .select('*')
    .eq('variant_id', variantId)
    .order('section_key')
    .order('sort_order');

  if (error) throw error;
  return (data || []) as ProductSpecItemRecord[];
}

export function specJsonToItems(variantId: string, specJson: Record<string, unknown>) {
  return Object.entries(specJson)
    .filter(([key]) => Boolean(key.trim()))
    .map(([key, value], index) => ({
      isFilterable: ['size', 'sizeInch', 'ram', 'ramGb', 'storage', 'storageGb', 'chipset', 'resolution'].includes(key),
      sectionKey: 'general',
      sectionLabel: '基础规格',
      sortOrder: index,
      specKey: key,
      specLabel: key,
      valueJson: typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null,
      valueNumber: typeof value === 'number' ? value : null,
      valueText: typeof value === 'number' ? null : String(value ?? ''),
      variantId,
    } satisfies SaveProductSpecItemInput));
}
