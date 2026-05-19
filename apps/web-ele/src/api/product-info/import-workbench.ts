import type { ListParams } from './types';

import { assertSupabaseClient, normalizeKeyword, toLikePattern } from './client';

export type ImportTemplateStatus = 'active' | 'inactive';
export type ImportHistoryStatus = 'draft' | 'failed' | 'partial_success' | 'success';
export type ImportHistoryRowAction = 'create' | 'failed' | 'quote_only' | 'skip' | 'update';
export type ImportHistoryRowStatus = 'failed' | 'skipped' | 'success' | 'warning';

export interface ImportTemplateTierMapping {
  column: string;
  currency?: string;
  minQuantity: number;
}

export interface ImportTemplateRecord {
  created_at: string;
  created_by: null | string;
  detail_mappings: Record<string, string>;
  detail_sheet_rule: null | string;
  header_row: number;
  id: string;
  is_default: boolean;
  last_used_at: null | string;
  model_column: null | string;
  quote_sheet_matcher: null | string;
  quote_sheet_name: null | string;
  remark_column: null | string;
  size_column: null | string;
  status: ImportTemplateStatus | string;
  summary_config_column: null | string;
  supplier_company_id: null | string;
  supplier_name: null | string;
  template_name: string;
  tier_mappings: ImportTemplateTierMapping[];
  updated_at: string;
}

export interface SaveImportTemplateInput {
  detailMappings?: Record<string, string>;
  detailSheetRule?: string;
  headerRow?: number;
  isDefault?: boolean;
  modelColumn?: string;
  quoteSheetMatcher?: string;
  quoteSheetName?: string;
  remarkColumn?: string;
  sizeColumn?: string;
  status?: ImportTemplateStatus;
  summaryConfigColumn?: string;
  supplierCompanyId?: string;
  supplierName?: string;
  templateName: string;
  tierMappings?: ImportTemplateTierMapping[];
}

export interface ImportHistoryRecord {
  created_at: string;
  failed_row_count: number;
  file_name: string;
  id: string;
  imported_by: null | string;
  new_product_count: number;
  new_quote_count: number;
  quote_only_count: number;
  skipped_row_count: number;
  source_document_id: null | string;
  status: ImportHistoryStatus | string;
  template_id: null | string;
  total_rows: number;
  update_product_count: number;
  updated_at: string;
  warning_summary: Record<string, unknown>;
}

export interface ImportHistoryRowRecord {
  action: ImportHistoryRowAction | string;
  created_at: string;
  error_message: null | string;
  id: string;
  import_history_id: string;
  model_code: null | string;
  quote_line_id: null | string;
  raw_payload: Record<string, unknown>;
  row_index: null | number;
  status: ImportHistoryRowStatus | string;
  variant_id: null | string;
  warning_message: null | string;
}

export interface SaveImportHistoryInput {
  failedRowCount?: number;
  fileName: string;
  newProductCount?: number;
  newQuoteCount?: number;
  quoteOnlyCount?: number;
  rows?: SaveImportHistoryRowInput[];
  skippedRowCount?: number;
  sourceDocumentId?: string;
  status: ImportHistoryStatus;
  templateId?: string;
  totalRows?: number;
  updateProductCount?: number;
  warningSummary?: Record<string, unknown>;
}

export interface SaveImportHistoryRowInput {
  action: ImportHistoryRowAction;
  errorMessage?: string;
  modelCode?: string;
  quoteLineId?: string;
  rawPayload?: Record<string, unknown>;
  rowIndex?: number;
  status: ImportHistoryRowStatus;
  variantId?: string;
  warningMessage?: string;
}

export async function listImportTemplates(params: ListParams = {}) {
  const supabase = assertSupabaseClient();
  const keyword = normalizeKeyword(params.keyword);
  let query = supabase
    .from('import_templates')
    .select('*')
    .order('is_default', { ascending: false })
    .order('updated_at', { ascending: false });

  if (keyword) {
    const pattern = toLikePattern(keyword);
    query = query.or(
      `template_name.ilike.${pattern},supplier_name.ilike.${pattern},quote_sheet_name.ilike.${pattern}`,
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as ImportTemplateRecord[];
}

export async function createImportTemplate(input: SaveImportTemplateInput) {
  const supabase = assertSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;

  if (input.isDefault) await clearDefaultImportTemplate();

  const { data, error } = await supabase
    .from('import_templates')
    .insert({
      created_by: user?.id,
      ...toImportTemplatePayload(input),
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as ImportTemplateRecord;
}

export async function updateImportTemplate(id: string, input: SaveImportTemplateInput) {
  const supabase = assertSupabaseClient();
  if (input.isDefault) await clearDefaultImportTemplate(id);
  const { data, error } = await supabase
    .from('import_templates')
    .update(toImportTemplatePayload(input))
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as ImportTemplateRecord;
}

export async function deleteImportTemplate(id: string) {
  const supabase = assertSupabaseClient();
  const { error } = await supabase.from('import_templates').delete().eq('id', id);
  if (error) throw error;
}

export async function copyImportTemplate(id: string) {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from('import_templates')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  const source = data as ImportTemplateRecord;
  return createImportTemplate({
    detailMappings: source.detail_mappings,
    detailSheetRule: source.detail_sheet_rule || undefined,
    headerRow: source.header_row,
    isDefault: false,
    modelColumn: source.model_column || undefined,
    quoteSheetMatcher: source.quote_sheet_matcher || undefined,
    quoteSheetName: source.quote_sheet_name || undefined,
    remarkColumn: source.remark_column || undefined,
    sizeColumn: source.size_column || undefined,
    status: 'inactive',
    summaryConfigColumn: source.summary_config_column || undefined,
    supplierCompanyId: source.supplier_company_id || undefined,
    supplierName: source.supplier_name || undefined,
    templateName: `${source.template_name} 副本`,
    tierMappings: source.tier_mappings,
  });
}

export async function createImportHistory(input: SaveImportHistoryInput) {
  const supabase = assertSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;

  const { data, error } = await supabase
    .from('import_histories')
    .insert({
      failed_row_count: input.failedRowCount || 0,
      file_name: input.fileName,
      imported_by: user?.id,
      new_product_count: input.newProductCount || 0,
      new_quote_count: input.newQuoteCount || 0,
      quote_only_count: input.quoteOnlyCount || 0,
      skipped_row_count: input.skippedRowCount || 0,
      source_document_id: input.sourceDocumentId || null,
      status: input.status,
      template_id: input.templateId || null,
      total_rows: input.totalRows || input.rows?.length || 0,
      update_product_count: input.updateProductCount || 0,
      warning_summary: input.warningSummary || {},
    })
    .select('*')
    .single();
  if (error) throw error;

  const history = data as ImportHistoryRecord;
  if (input.rows?.length) {
    const { error: rowError } = await supabase.from('import_history_rows').insert(
      input.rows.map((row) => ({
        action: row.action,
        error_message: row.errorMessage || null,
        import_history_id: history.id,
        model_code: row.modelCode || null,
        quote_line_id: row.quoteLineId || null,
        raw_payload: row.rawPayload || {},
        row_index: row.rowIndex || null,
        status: row.status,
        variant_id: row.variantId || null,
        warning_message: row.warningMessage || null,
      })),
    );
    if (rowError) throw rowError;
  }

  return history;
}

export async function listImportHistories(params: ListParams = {}) {
  const supabase = assertSupabaseClient();
  const keyword = normalizeKeyword(params.keyword);
  let query = supabase
    .from('import_histories')
    .select('*')
    .order('created_at', { ascending: false });
  if (keyword) query = query.ilike('file_name', toLikePattern(keyword));
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as ImportHistoryRecord[];
}

export async function listImportHistoryRows(historyId: string) {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from('import_history_rows')
    .select('*')
    .eq('import_history_id', historyId)
    .order('row_index', { ascending: true });
  if (error) throw error;
  return (data || []) as ImportHistoryRowRecord[];
}

async function clearDefaultImportTemplate(exceptId?: string) {
  const supabase = assertSupabaseClient();
  let query = supabase.from('import_templates').update({ is_default: false }).eq('is_default', true);
  if (exceptId) query = query.neq('id', exceptId);
  const { error } = await query;
  if (error) throw error;
}

function toImportTemplatePayload(input: SaveImportTemplateInput) {
  return {
    detail_mappings: input.detailMappings || {},
    detail_sheet_rule: input.detailSheetRule?.trim() || null,
    header_row: input.headerRow || 1,
    is_default: input.isDefault || false,
    model_column: input.modelColumn?.trim() || null,
    quote_sheet_matcher: input.quoteSheetMatcher?.trim() || null,
    quote_sheet_name: input.quoteSheetName?.trim() || null,
    remark_column: input.remarkColumn?.trim() || null,
    size_column: input.sizeColumn?.trim() || null,
    status: input.status || 'active',
    summary_config_column: input.summaryConfigColumn?.trim() || null,
    supplier_company_id: input.supplierCompanyId || null,
    supplier_name: input.supplierName?.trim() || null,
    template_name: input.templateName.trim(),
    tier_mappings: input.tierMappings || [],
  };
}
