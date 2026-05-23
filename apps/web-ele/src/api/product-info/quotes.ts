import type {
  ListParams,
  QuoteBatchRecord,
  QuoteDocumentRecord,
  QuoteOptionRecord,
  QuotePriceTierRecord,
  QuoteStatus,
  QuoteWithRelations,
} from './types';

import { assertSupabaseClient, normalizeKeyword, toLikePattern } from './client';
import { listCompanies } from './companies';
import { listProducts } from './products';

export interface QuoteListParams extends ListParams {
  companyId?: string;
  productId?: string;
  status?: QuoteStatus;
}

export interface SaveQuoteTierInput {
  currency?: string;
  minQuantity: number;
  unitPrice: number;
}

export interface SaveQuoteInput {
  batchTitle?: string;
  companyId: string;
  currency?: string;
  firmwareNote?: string;
  minOrderQuantity?: number;
  productId: string;
  publishedAt?: string;
  quoteNo?: string;
  remarks?: string;
  standardConfigText?: string;
  status?: QuoteStatus;
  tiers?: SaveQuoteTierInput[];
  unitPrice?: number;
  validFrom?: string;
  validUntil?: string;
}

type QuoteLineRow = {
  created_at: string;
  firmware_note: null | string;
  id: string;
  quote_batch_id: string;
  row_note: null | string;
  sort_order: number;
  standard_config_text: null | string;
  status: string;
  updated_at: string;
  variant_id: string;
};

export async function listQuotes(params: QuoteListParams = {}) {
  const supabase = assertSupabaseClient();
  const keyword = normalizeKeyword(params.keyword);
  let lineQuery = supabase
    .from('quote_lines')
    .select('*')
    .order('created_at', { ascending: false });

  if (params.productId) {
    lineQuery = lineQuery.eq('variant_id', params.productId);
  }

  const { data: lines, error: lineError } = await lineQuery;

  if (lineError) {
    throw lineError;
  }

  const quoteLines = (lines || []) as QuoteLineRow[];
  if (quoteLines.length === 0) {
    return [];
  }

  const [batches, tiers, options, products, companies] = await Promise.all([
    listQuoteBatches(),
    listQuotePriceTiers(quoteLines.map((item) => item.id)),
    listQuoteOptions({
      batchIds: quoteLines.map((item) => item.quote_batch_id),
      lineIds: quoteLines.map((item) => item.id),
    }),
    listProducts(),
    listCompanies(),
  ]);

  const rows = quoteLines
    .map((line) =>
      mapLineToQuoteRecord({
        batches,
        companies,
        line,
        options,
        products,
        tiers,
      }),
    )
    .filter(Boolean) as QuoteWithRelations[];

  return rows.filter((row) => {
    if (params.companyId && row.company_id !== params.companyId) {
      return false;
    }

    if (params.status && row.status !== params.status) {
      return false;
    }

    if (!keyword) {
      return true;
    }

    const pattern = toLikePattern(keyword)
      .replaceAll('%', '')
      .toLowerCase();

    return [
      row.batch_title,
      row.product?.category,
      row.product?.model,
      row.product?.name,
      row.company?.name,
      row.remarks,
      row.quote_no,
    ].some((value) => value?.toLowerCase().includes(pattern));
  });
}

export async function countQuotes(params: QuoteListParams = {}) {
  const quotes = await listQuotes(params);
  return quotes.length;
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

  const batch = await createQuoteBatch({
    batchTitle:
      input.batchTitle?.trim() || input.quoteNo?.trim() || `${input.productId} 报价批次`,
    companyId: input.companyId,
    createdBy: user?.id,
    currency: (input.currency || 'USD').toUpperCase(),
    globalNote: input.remarks?.trim(),
    publishedAt: input.publishedAt || input.validFrom,
    status: input.status || 'active',
    validFrom: input.validFrom,
  });

  const { data, error } = await supabase
    .from('quote_lines')
    .insert({
      firmware_note: input.firmwareNote?.trim() || null,
      quote_batch_id: batch.id,
      row_note: input.remarks?.trim() || null,
      standard_config_text: input.standardConfigText?.trim() || null,
      status: input.status === 'archived' ? 'inactive' : 'active',
      variant_id: input.productId,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  await replaceQuoteTiers(data.id as string, input);
  return await getQuoteByLineId(data.id as string);
}

export async function updateQuote(id: string, input: SaveQuoteInput) {
  const supabase = assertSupabaseClient();
  const { data: existingLine, error: existingError } = await supabase
    .from('quote_lines')
    .select('*')
    .eq('id', id)
    .single();

  if (existingError) {
    throw existingError;
  }

  const existingBatch = await getQuoteBatch(existingLine.quote_batch_id as string);
  await supabase
    .from('quote_batches')
    .update({
      batch_title:
        input.batchTitle?.trim() || input.quoteNo?.trim() || existingBatch.batch_title,
      company_id: input.companyId,
      currency: (input.currency || existingBatch.currency || 'USD').toUpperCase(),
      effective_from: input.validFrom || null,
      global_note: input.remarks?.trim() || null,
      published_at: input.publishedAt || input.validFrom || null,
      status: input.status || existingBatch.status,
    })
    .eq('id', existingBatch.id);

  const { error } = await supabase
    .from('quote_lines')
    .update({
      firmware_note: input.firmwareNote?.trim() || null,
      row_note: input.remarks?.trim() || null,
      standard_config_text: input.standardConfigText?.trim() || null,
      status: input.status === 'archived' ? 'inactive' : 'active',
      variant_id: input.productId,
    })
    .eq('id', id);

  if (error) {
    throw error;
  }

  await replaceQuoteTiers(id, input);
  return await getQuoteByLineId(id);
}

export async function setQuoteStatus(id: string, status: QuoteStatus) {
  const supabase = assertSupabaseClient();
  const { data: line, error: lineError } = await supabase
    .from('quote_lines')
    .select('quote_batch_id')
    .eq('id', id)
    .single();

  if (lineError) {
    throw lineError;
  }

  const { error } = await supabase
    .from('quote_batches')
    .update({ status })
    .eq('id', line.quote_batch_id);

  if (error) {
    throw error;
  }

  return await getQuoteByLineId(id);
}

export async function deleteQuote(id: string) {
  const supabase = assertSupabaseClient();
  const { data: line, error: lineError } = await supabase
    .from('quote_lines')
    .select('quote_batch_id')
    .eq('id', id)
    .single();

  if (lineError) {
    throw lineError;
  }

  const { error } = await supabase.from('quote_lines').delete().eq('id', id);

  if (error) {
    throw error;
  }

  const { count, error: countError } = await supabase
    .from('quote_lines')
    .select('id', { count: 'exact', head: true })
    .eq('quote_batch_id', line.quote_batch_id);

  if (countError) {
    throw countError;
  }

  if (!count) {
    const { error: batchError } = await supabase
      .from('quote_batches')
      .delete()
      .eq('id', line.quote_batch_id);

    if (batchError) {
      throw batchError;
    }
  }
}

export async function listQuoteDocuments(quoteId: string) {
  const supabase = assertSupabaseClient();
  const { data: line, error: lineError } = await supabase
    .from('quote_lines')
    .select('quote_batch_id')
    .eq('id', quoteId)
    .single();

  if (lineError) {
    throw lineError;
  }

  const { data, error } = await supabase
    .from('documents')
    .select('id, created_at')
    .eq('quote_batch_id', line.quote_batch_id)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return ((data || []) as Array<{ created_at: string; id: string }>).map(
    (item) => ({
      created_at: item.created_at,
      document_id: item.id,
      quote_id: quoteId,
    }),
  ) as QuoteDocumentRecord[];
}

export async function attachQuoteDocument(quoteId: string, documentId: string) {
  const supabase = assertSupabaseClient();
  const { data: line, error: lineError } = await supabase
    .from('quote_lines')
    .select('quote_batch_id')
    .eq('id', quoteId)
    .single();

  if (lineError) {
    throw lineError;
  }

  const { data, error } = await supabase
    .from('documents')
    .update({ quote_batch_id: line.quote_batch_id })
    .eq('id', documentId)
    .select('created_at, id')
    .single();

  if (error) {
    throw error;
  }

  return {
    created_at: data.created_at as string,
    document_id: data.id as string,
    quote_id: quoteId,
  } satisfies QuoteDocumentRecord;
}

export async function detachQuoteDocument(_quoteId: string, documentId: string) {
  const supabase = assertSupabaseClient();
  const { error } = await supabase
    .from('documents')
    .update({ quote_batch_id: null })
    .eq('id', documentId);

  if (error) {
    throw error;
  }
}

async function getQuoteByLineId(id: string) {
  const quotes = await listQuotes();
  const quote = quotes.find((item) => item.id === id);

  if (!quote) {
    throw new Error('报价记录不存在');
  }

  return quote;
}

async function createQuoteBatch(input: {
  batchTitle: string;
  companyId: string;
  createdBy?: string;
  currency: string;
  globalNote?: string;
  publishedAt?: string;
  status: QuoteStatus;
  validFrom?: string;
}) {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from('quote_batches')
    .insert({
      batch_title: input.batchTitle,
      company_id: input.companyId,
      created_by: input.createdBy || null,
      currency: input.currency,
      effective_from: input.validFrom || null,
      entry_mode: 'manual',
      global_note: input.globalNote || null,
      published_at: input.publishedAt || null,
      status: input.status,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as QuoteBatchRecord;
}

async function getQuoteBatch(id: string) {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from('quote_batches')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data as QuoteBatchRecord;
}

async function listQuoteBatches() {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from('quote_batches')
    .select('*')
    .order('published_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []) as QuoteBatchRecord[];
}

async function listQuotePriceTiers(lineIds: string[]) {
  if (lineIds.length === 0) {
    return [] as QuotePriceTierRecord[];
  }

  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from('quote_price_tiers')
    .select('*')
    .in('quote_line_id', lineIds)
    .order('sort_order', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []) as QuotePriceTierRecord[];
}

async function listQuoteOptions(params: {
  batchIds: string[];
  lineIds: string[];
}) {
  const { batchIds, lineIds } = params;
  if (batchIds.length === 0 && lineIds.length === 0) {
    return [] as QuoteOptionRecord[];
  }

  const supabase = assertSupabaseClient();
  let query = supabase.from('quote_options').select('*');

  if (batchIds.length && lineIds.length) {
    query = query.or(
      `quote_batch_id.in.(${batchIds.join(',')}),quote_line_id.in.(${lineIds.join(',')})`,
    );
  } else if (batchIds.length) {
    query = query.in('quote_batch_id', batchIds);
  } else {
    query = query.in('quote_line_id', lineIds);
  }

  const { data, error } = await query.order('sort_order', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []) as QuoteOptionRecord[];
}

async function replaceQuoteTiers(quoteLineId: string, input: SaveQuoteInput) {
  const supabase = assertSupabaseClient();
  const { error: deleteError } = await supabase
    .from('quote_price_tiers')
    .delete()
    .eq('quote_line_id', quoteLineId);

  if (deleteError) {
    throw deleteError;
  }

  const tiers =
    input.tiers?.length
      ? input.tiers
      : input.unitPrice !== undefined && input.unitPrice !== null
        ? [
            {
              currency: input.currency || 'USD',
              minQuantity: input.minOrderQuantity || 1,
              unitPrice: input.unitPrice,
            },
          ]
        : [];

  if (tiers.length === 0) {
    return;
  }

  const { error } = await supabase.from('quote_price_tiers').insert(
    tiers.map((tier, index) => ({
      currency: (tier.currency || input.currency || 'USD').toUpperCase(),
      min_quantity: tier.minQuantity,
      quote_line_id: quoteLineId,
      sort_order: index,
      unit_price: tier.unitPrice,
    })),
  );

  if (error) {
    throw error;
  }
}

function mapLineToQuoteRecord(params: {
  batches: QuoteBatchRecord[];
  companies: Awaited<ReturnType<typeof listCompanies>>;
  line: QuoteLineRow;
  options: QuoteOptionRecord[];
  products: Awaited<ReturnType<typeof listProducts>>;
  tiers: QuotePriceTierRecord[];
}) {
  const { batches, companies, line, options, products, tiers } = params;
  const batch = batches.find((item) => item.id === line.quote_batch_id);

  if (!batch) {
    return null;
  }

  const product = products.find((item) => item.id === line.variant_id) || null;
  const company = companies.find((item) => item.id === batch.company_id) || null;
  const lineTiers = tiers
    .filter((item) => item.quote_line_id === line.id)
    .toSorted((left, right) => left.min_quantity - right.min_quantity);
  const primaryTier = lineTiers[0] || null;
  const lineOptions = options.filter(
    (item) => item.quote_line_id === line.id || item.quote_batch_id === batch.id,
  );

  return {
    batch_id: batch.id,
    batch_title: batch.batch_title,
    company,
    company_id: batch.company_id,
    created_at: line.created_at,
    created_by: batch.created_by,
    currency: primaryTier?.currency || batch.currency,
    effective_from: batch.effective_from,
    firmware_note: line.firmware_note,
    id: line.id,
    min_order_quantity: primaryTier?.min_quantity || null,
    published_at: batch.published_at,
    product,
    product_id: line.variant_id,
    product_model: product?.model || null,
    quote_no: batch.batch_title,
    quote_options: lineOptions,
    quote_tiers: lineTiers,
    remarks: line.row_note || batch.global_note,
    standard_config_text: line.standard_config_text,
    status: batch.status,
    unit_price: primaryTier?.unit_price || null,
    updated_at: line.updated_at,
    valid_from: batch.effective_from,
    valid_until: null,
  } satisfies QuoteWithRelations;
}
