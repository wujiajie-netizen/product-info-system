import type {
  ListParams,
  QuoteOptionDeltaType,
  QuoteOptionRecord,
  QuoteOptionScopeType,
  QuoteOptionType,
} from './types';

import { assertSupabaseClient, normalizeKeyword, toLikePattern } from './client';

export interface QuoteOptionListParams extends ListParams {
  quoteBatchId?: string;
  quoteLineId?: string;
  scopeType?: QuoteOptionScopeType;
}

export interface SaveQuoteOptionInput {
  currency?: string;
  deltaType: QuoteOptionDeltaType;
  description?: string;
  optionName: string;
  optionType: QuoteOptionType;
  priceDelta?: number;
  quoteBatchId?: string;
  quoteLineId?: string;
  scopeType: QuoteOptionScopeType;
  sortOrder?: number;
}

export async function listQuoteOptionsForAdmin(params: QuoteOptionListParams = {}) {
  const supabase = assertSupabaseClient();
  const keyword = normalizeKeyword(params.keyword);
  let query = supabase
    .from('quote_options')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('updated_at', { ascending: false });

  if (params.scopeType) query = query.eq('scope_type', params.scopeType);
  if (params.quoteBatchId) query = query.eq('quote_batch_id', params.quoteBatchId);
  if (params.quoteLineId) query = query.eq('quote_line_id', params.quoteLineId);
  if (keyword) {
    const pattern = toLikePattern(keyword);
    query = query.or(`option_name.ilike.${pattern},description.ilike.${pattern}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as QuoteOptionRecord[];
}

export async function createQuoteOption(input: SaveQuoteOptionInput) {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from('quote_options')
    .insert(toQuoteOptionPayload(input))
    .select('*')
    .single();
  if (error) throw error;
  return data as QuoteOptionRecord;
}

export async function updateQuoteOption(id: string, input: SaveQuoteOptionInput) {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from('quote_options')
    .update(toQuoteOptionPayload(input))
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as QuoteOptionRecord;
}

export async function deleteQuoteOption(id: string) {
  const supabase = assertSupabaseClient();
  const { error } = await supabase.from('quote_options').delete().eq('id', id);
  if (error) throw error;
}

export async function replaceQuoteOptionsForLine(
  quoteLineId: string,
  options: Array<Omit<SaveQuoteOptionInput, 'quoteLineId' | 'scopeType'>>,
) {
  const supabase = assertSupabaseClient();
  const { error: deleteError } = await supabase
    .from('quote_options')
    .delete()
    .eq('quote_line_id', quoteLineId);
  if (deleteError) throw deleteError;

  if (!options.length) return [] as QuoteOptionRecord[];
  const { data, error } = await supabase
    .from('quote_options')
    .insert(
      options.map((item, index) =>
        toQuoteOptionPayload({
          ...item,
          quoteLineId,
          scopeType: 'line',
          sortOrder: item.sortOrder ?? index,
        }),
      ),
    )
    .select('*');
  if (error) throw error;
  return (data || []) as QuoteOptionRecord[];
}

function toQuoteOptionPayload(input: SaveQuoteOptionInput) {
  return {
    currency: input.currency?.toUpperCase() || null,
    delta_type: input.deltaType,
    description: input.description?.trim() || null,
    option_name: input.optionName.trim(),
    option_type: input.optionType,
    price_delta:
      input.deltaType === 'text_only' ? null : input.priceDelta ?? null,
    quote_batch_id: input.scopeType === 'batch' ? input.quoteBatchId || null : null,
    quote_line_id: input.scopeType === 'line' ? input.quoteLineId || null : null,
    scope_type: input.scopeType,
    sort_order: input.sortOrder || 0,
  };
}
