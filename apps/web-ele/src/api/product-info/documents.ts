import { assertSupabaseClient, normalizeKeyword, toLikePattern } from './client';
import type { DocumentFileType, DocumentRecord, ListParams } from './types';

const BUCKET = 'product-documents';

export interface CreateDocumentInput {
  category: string;
  file: File;
  fileType: DocumentFileType;
  productModel?: string;
  tags?: string[];
  title: string;
}

export async function listDocuments(params: ListParams = {}) {
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
      created_by: user?.id,
      file_type: input.fileType,
      file_url: `storage://${BUCKET}/${storagePath}`,
      product_model: input.productModel || null,
      storage_path: storagePath,
      tags: input.tags || [],
      title: input.title,
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
