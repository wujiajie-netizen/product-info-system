import type {
  DocumentFileType,
  DocumentKind,
  DocumentRecord,
  ListParams,
} from './types';

import {
  assertSupabaseClient,
  normalizeKeyword,
  toLikePattern,
} from './client';

const BUCKET = 'product-documents';

export interface CreateDocumentInput {
  category: string;
  companyId?: string;
  documentKind?: DocumentKind;
  file: File;
  fileType: DocumentFileType;
  isPrimary?: boolean;
  productId?: string;
  productModel?: string;
  quoteBatchId?: string;
  seriesId?: string;
  sortOrder?: number;
  sourceSheetName?: string;
  tags?: string[];
  title: string;
  variantId?: string;
}

export interface DocumentListParams extends ListParams {
  companyId?: string;
  documentKind?: DocumentKind;
  fileType?: DocumentFileType;
  productId?: string;
  productModel?: string;
  quoteBatchId?: string;
  seriesId?: string;
  variantId?: string;
}

export async function listDocuments(params: DocumentListParams = {}) {
  const supabase = assertSupabaseClient();
  const keyword = normalizeKeyword(params.keyword);
  let query = supabase
    .from('documents')
    .select('*')
    .order('updated_at', { ascending: false });

  if (keyword) {
    const pattern = toLikePattern(keyword);
    query = query.or(
      `title.ilike.${pattern},product_model.ilike.${pattern},category.ilike.${pattern}`,
    );
  }

  if (params.fileType) {
    query = query.eq('file_type', params.fileType);
  }

  if (params.documentKind) {
    query = query.eq('document_kind', params.documentKind);
  }

  if (params.productId) {
    query = query.eq('variant_id', params.productId);
  }

  if (params.productModel) {
    query = query.eq('product_model', params.productModel);
  }

  if (params.variantId) {
    query = query.eq('variant_id', params.variantId);
  }

  if (params.seriesId) {
    query = query.eq('series_id', params.seriesId);
  }

  if (params.quoteBatchId) {
    query = query.eq('quote_batch_id', params.quoteBatchId);
  }

  if (params.companyId) {
    query = query.eq('company_id', params.companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []) as DocumentRecord[];
}

export async function countDocuments() {
  const supabase = assertSupabaseClient();
  const { count, error } = await supabase
    .from('documents')
    .select('id', { count: 'exact', head: true });

  if (error) {
    throw error;
  }

  return count || 0;
}

export async function createDocument(input: CreateDocumentInput) {
  const supabase = assertSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  const safeName = input.file.name.replaceAll(/[^\w.()-]+/g, '-');
  const storagePath = `${input.fileType}/${Date.now()}-${safeName}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, input.file, {
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data, error } = await supabase
    .from('documents')
    .insert({
      category: input.category,
      company_id: input.companyId || null,
      created_by: user?.id,
      document_kind:
        input.documentKind ||
        inferDocumentKind(input.fileType),
      file_type: input.fileType,
      file_url: `storage://${BUCKET}/${storagePath}`,
      is_primary: input.isPrimary || false,
      product_model: input.productModel || null,
      quote_batch_id: input.quoteBatchId || null,
      series_id: input.seriesId || null,
      sort_order: input.sortOrder || 0,
      source_sheet_name: input.sourceSheetName || null,
      storage_path: storagePath,
      tags: input.tags || [],
      title: input.title,
      variant_id: input.variantId || input.productId || null,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as DocumentRecord;
}

export async function createDocumentSignedUrl(document: DocumentRecord) {
  if (!document.storage_path) {
    return document.file_url;
  }

  const supabase = assertSupabaseClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(document.storage_path, 60 * 10);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

function inferDocumentKind(fileType: DocumentFileType): DocumentKind {
  switch (fileType) {
    case 'image': {
      return 'product_image';
    }
    case 'quote': {
      return 'quote_workbook';
    }
    case 'spec': {
      return 'spec_sheet';
    }
    case 'technical': {
      return 'technical';
    }
    default: {
      return 'other';
    }
  }
}
