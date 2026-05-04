import type {
  ListParams,
  QuoteDocumentRecord,
  QuoteRecord,
  QuoteStatus,
  QuoteWithRelations,
} from './types';

import {
  assertSupabaseClient,
  normalizeKeyword,
  toLikePattern,
} from './client';

export interface QuoteListParams extends ListParams {
  companyId?: string;
  productId?: string;
  status?: QuoteStatus;
}

export interface SaveQuoteInput {
  companyId: string;
  currency?: string;
  minOrderQuantity?: number;
  productId: string;
  quoteNo?: string;
  remarks?: string;
  status?: QuoteStatus;
  unitPrice?: number;
  validFrom?: string;
  validUntil?: string;
}

export async function listQuotes(params: QuoteListParams = {}) {
  const supabase = assertSupabaseClient();
  const keyword = normalizeKeyword(params.keyword);
  let query = supabase
    .from('quotes')
    .select(
      `
        *,
        product:products(*),
        company:companies(*)
      `,
    )
    .order('created_at', { ascending: false });

  if (params.productId) {
    query = query.eq('product_id', params.productId);
  }

  if (params.companyId) {
    query = query.eq('company_id', params.companyId);
  }

  if (params.status) {
    query = query.eq('status', params.status);
  }

  if (keyword) {
    const pattern = toLikePattern(keyword);
    query = query.or(`quote_no.ilike.${pattern},remarks.ilike.${pattern}`);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []) as QuoteWithRelations[];
}

export async function countQuotes(params: QuoteListParams = {}) {
  const supabase = assertSupabaseClient();
  let query = supabase
    .from('quotes')
    .select('id', { count: 'exact', head: true });

  if (params.productId) {
    query = query.eq('product_id', params.productId);
  }

  if (params.companyId) {
    query = query.eq('company_id', params.companyId);
  }

  if (params.status) {
    query = query.eq('status', params.status);
  }

  const { count, error } = await query;

  if (error) {
    throw error;
  }

  return count || 0;
}

export async function createQuote(input: SaveQuoteInput) {
  const supabase = assertSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  const { data, error } = await supabase
    .from('quotes')
    .insert({
      ...toQuotePayload(input),
      created_by: user?.id,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as QuoteRecord;
}

export async function updateQuote(id: string, input: SaveQuoteInput) {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from('quotes')
    .update(toQuotePayload(input))
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as QuoteRecord;
}

export async function setQuoteStatus(id: string, status: QuoteStatus) {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from('quotes')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as QuoteRecord;
}

export async function deleteQuote(id: string) {
  const supabase = assertSupabaseClient();
  const { error } = await supabase.from('quotes').delete().eq('id', id);

  if (error) {
    throw error;
  }
}

export async function listQuoteDocuments(quoteId: string) {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from('quote_documents')
    .select('*')
    .eq('quote_id', quoteId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []) as QuoteDocumentRecord[];
}

export async function attachQuoteDocument(quoteId: string, documentId: string) {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from('quote_documents')
    .upsert({
      document_id: documentId,
      quote_id: quoteId,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as QuoteDocumentRecord;
}

export async function detachQuoteDocument(quoteId: string, documentId: string) {
  const supabase = assertSupabaseClient();
  const { error } = await supabase
    .from('quote_documents')
    .delete()
    .eq('quote_id', quoteId)
    .eq('document_id', documentId);

  if (error) {
    throw error;
  }
}

function toQuotePayload(input: SaveQuoteInput) {
  return {
    company_id: input.companyId,
    currency: (input.currency || 'CNY').toUpperCase(),
    min_order_quantity: input.minOrderQuantity || null,
    product_id: input.productId,
    quote_no: input.quoteNo || null,
    remarks: input.remarks || null,
    status: input.status || 'active',
    unit_price: input.unitPrice ?? null,
    valid_from: input.validFrom || null,
    valid_until: input.validUntil || null,
  };
}
