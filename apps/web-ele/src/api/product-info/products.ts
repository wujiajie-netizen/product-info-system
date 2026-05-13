import type {
  BrandRecord,
  CategoryRecord,
  CompanyRecord,
  ListParams,
  ProductRecord,
  ProductSeriesRecord,
  ProductSpecItemRecord,
  ProductStatus,
  ProductVariantRecord,
} from './types';

import {
  assertSupabaseClient,
  normalizeKeyword,
  normalizeSlug,
  toLikePattern,
} from './client';

export interface SaveProductInput {
  brandId?: string;
  brightnessNits?: number;
  category?: string;
  categoryId?: string;
  chipset?: string;
  companyId?: string;
  description?: string;
  model: string;
  name: string;
  osName?: string;
  osVersion?: string;
  poeStandard?: string;
  poeSupported?: boolean;
  productType?: string;
  ramGb?: number;
  resolutionHeight?: number;
  resolutionWidth?: number;
  seriesCode?: string;
  seriesId?: string;
  seriesName?: string;
  sizeInch?: number;
  specJson?: Record<string, unknown>;
  status?: ProductStatus;
  storageGb?: number;
  summaryConfigText?: string;
  tags?: string[];
}

export interface ProductListParams extends ListParams {
  brandId?: string;
  categoryId?: string;
  companyId?: string;
  seriesId?: string;
  status?: ProductStatus;
}

type NestedSeriesRow = ProductSeriesRecord & {
  brand?: BrandRecord | null;
  category?: CategoryRecord | null;
  company?: CompanyRecord | null;
};

type VariantWithRelations = ProductVariantRecord & {
  series?: NestedSeriesRow | null;
  specs?: ProductSpecItemRecord[] | null;
};

export async function listProducts(params: ProductListParams = {}) {
  const supabase = assertSupabaseClient();
  const keyword = normalizeKeyword(params.keyword);
  let query = supabase
    .from('product_variants')
    .select(
      `
        *,
        series:product_series(
          *,
          brand:brands(*),
          category:categories(*),
          company:companies(*)
        ),
        specs:product_spec_items(*)
      `,
    )
    .order('updated_at', { ascending: false });

  if (params.seriesId) {
    query = query.eq('series_id', params.seriesId);
  }

  if (params.status) {
    query = query.eq('status', params.status);
  }

  if (keyword) {
    const pattern = toLikePattern(keyword);
    query = query.or(
      `model_code.ilike.${pattern},display_name.ilike.${pattern},summary_config_text.ilike.${pattern},chipset.ilike.${pattern}`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return ((data || []) as VariantWithRelations[])
    .filter((record) => {
      if (params.categoryId && record.series?.category_id !== params.categoryId) {
        return false;
      }

      if (params.brandId && record.series?.brand_id !== params.brandId) {
        return false;
      }

      if (params.companyId && record.series?.company_id !== params.companyId) {
        return false;
      }

      return true;
    })
    .map(mapVariantToProductRecord);
}

export async function countProducts() {
  const supabase = assertSupabaseClient();
  const { count, error } = await supabase
    .from('product_variants')
    .select('id', { count: 'exact', head: true });

  if (error) {
    throw error;
  }

  return count || 0;
}

export async function createProduct(input: SaveProductInput) {
  const supabase = assertSupabaseClient();
  const seriesId = await ensureSeries(input);
  const payload = toVariantPayload(input, seriesId);
  const { data, error } = await supabase
    .from('product_variants')
    .insert(payload)
    .select(
      `
        *,
        series:product_series(
          *,
          brand:brands(*),
          category:categories(*),
          company:companies(*)
        )
      `,
    )
    .single();

  if (error) {
    throw error;
  }

  const variant = data as VariantWithRelations;
  await replaceVariantSpecItems(variant.id, input.specJson || {});
  return mapVariantToProductRecord({
    ...variant,
    specs: await listVariantSpecs(variant.id),
  });
}

export async function updateProduct(id: string, input: SaveProductInput) {
  const supabase = assertSupabaseClient();
  const seriesId = await ensureSeries(input);
  const { data, error } = await supabase
    .from('product_variants')
    .update(toVariantPayload(input, seriesId))
    .eq('id', id)
    .select(
      `
        *,
        series:product_series(
          *,
          brand:brands(*),
          category:categories(*),
          company:companies(*)
        )
      `,
    )
    .single();

  if (error) {
    throw error;
  }

  const variant = data as VariantWithRelations;
  await replaceVariantSpecItems(id, input.specJson || {});
  return mapVariantToProductRecord({
    ...variant,
    specs: await listVariantSpecs(id),
  });
}

export async function setProductStatus(id: string, status: ProductStatus) {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from('product_variants')
    .update({ status })
    .eq('id', id)
    .select(
      `
        *,
        series:product_series(
          *,
          brand:brands(*),
          category:categories(*),
          company:companies(*)
        ),
        specs:product_spec_items(*)
      `,
    )
    .single();

  if (error) {
    throw error;
  }

  return mapVariantToProductRecord(data as VariantWithRelations);
}

export async function listVariantSpecs(variantId: string) {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from('product_spec_items')
    .select('*')
    .eq('variant_id', variantId)
    .order('sort_order', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []) as ProductSpecItemRecord[];
}

async function ensureSeries(input: SaveProductInput) {
  const supabase = assertSupabaseClient();
  const seriesId = input.seriesId?.trim();

  if (seriesId) {
    const payload = toSeriesPayload(input);
    if (Object.keys(payload).length > 0) {
      const { error } = await supabase
        .from('product_series')
        .update(payload)
        .eq('id', seriesId);

      if (error) {
        throw error;
      }
    }

    return seriesId;
  }

  const seriesCode = (input.seriesCode || input.model).trim();
  const seriesName = (input.seriesName || input.name).trim();

  const { data: existing, error: existingError } = await supabase
    .from('product_series')
    .select('id')
    .eq('series_code', seriesCode)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing?.id) {
    const { error } = await supabase
      .from('product_series')
      .update(toSeriesPayload(input))
      .eq('id', existing.id);

    if (error) {
      throw error;
    }

    return existing.id;
  }

  const { data, error } = await supabase
    .from('product_series')
    .insert({
      ...toSeriesPayload(input),
      series_code: seriesCode,
      series_name: seriesName,
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data.id as string;
}

function toSeriesPayload(input: SaveProductInput) {
  const category = input.category?.trim();
  return {
    base_description: input.description?.trim() || null,
    brand_id: input.brandId || null,
    category_id: input.categoryId || null,
    company_id: input.companyId || null,
    product_type: input.productType?.trim() || category || null,
    series_code: (input.seriesCode || input.model).trim(),
    series_name: (input.seriesName || input.name).trim(),
    status: input.status || 'active',
  };
}

function toVariantPayload(input: SaveProductInput, seriesId: string) {
  const specJson = input.specJson || {};
  const resolution =
    input.resolutionWidth && input.resolutionHeight
      ? `${input.resolutionWidth} x ${input.resolutionHeight}`
      : undefined;

  return {
    brightness_nits: input.brightnessNits ?? parseNumeric(specJson.brightness),
    chipset: input.chipset?.trim() || toNullableText(specJson.cpu),
    display_name: input.name.trim(),
    model_code: input.model.trim(),
    os_name: input.osName?.trim() || toNullableText(specJson.os),
    os_version: input.osVersion?.trim() || null,
    poe_standard: input.poeStandard?.trim() || toNullableText(specJson.poe),
    poe_supported:
      typeof input.poeSupported === 'boolean'
        ? input.poeSupported
        : parseBoolean(specJson.poe),
    ram_gb: input.ramGb ?? parseNumeric(specJson.ram ?? specJson.memory),
    resolution_height:
      input.resolutionHeight ?? parseResolution(resolution || toNullableText(specJson.resolution)).height,
    resolution_width:
      input.resolutionWidth ?? parseResolution(resolution || toNullableText(specJson.resolution)).width,
    series_id: seriesId,
    size_inch: input.sizeInch ?? parseNumeric(specJson.screen_size ?? specJson.size),
    status: input.status || 'active',
    storage_gb: input.storageGb ?? parseNumeric(specJson.storage),
    summary_config_text:
      input.summaryConfigText?.trim() || toNullableText(specJson.summary),
  };
}

async function replaceVariantSpecItems(
  variantId: string,
  specJson: Record<string, unknown>,
) {
  const supabase = assertSupabaseClient();
  const { error: deleteError } = await supabase
    .from('product_spec_items')
    .delete()
    .eq('variant_id', variantId);

  if (deleteError) {
    throw deleteError;
  }

  const specItems = flattenSpecEntries(specJson).map((item, index) => ({
    ...item,
    sort_order: index,
    variant_id: variantId,
  }));

  if (specItems.length === 0) {
    return;
  }

  const { error } = await supabase.from('product_spec_items').insert(specItems);

  if (error) {
    throw error;
  }
}

function mapVariantToProductRecord(record: VariantWithRelations): ProductRecord {
  const series = record.series || null;
  const categoryName = series?.category?.name || series?.product_type || '未分类';
  const specJson = buildSpecJson(record);

  return {
    brand_id: series?.brand_id || null,
    brightness_nits: record.brightness_nits,
    category: categoryName,
    category_id: series?.category_id || null,
    chipset: record.chipset,
    company_id: series?.company_id || null,
    created_at: record.created_at,
    description: series?.base_description || null,
    id: record.id,
    model: record.model_code,
    name: record.display_name,
    os_name: record.os_name,
    os_version: record.os_version,
    poe_standard: record.poe_standard,
    poe_supported: record.poe_supported,
    product_type: series?.product_type || null,
    ram_gb: record.ram_gb,
    resolution_height: record.resolution_height,
    resolution_width: record.resolution_width,
    series_code: series?.series_code || null,
    series_id: series?.id || null,
    series_name: series?.series_name || null,
    size_inch: record.size_inch,
    spec_json: specJson,
    status: record.status,
    storage_gb: record.storage_gb,
    summary_config_text: record.summary_config_text,
    tags: extractTags(specJson),
    updated_at: record.updated_at,
  };
}

function buildSpecJson(record: VariantWithRelations) {
  const specJson: Record<string, unknown> = {};

  for (const item of record.specs || []) {
    specJson[item.spec_key] =
      item.spec_value_text ??
      item.spec_value_number ??
      item.value_json ??
      null;
  }

  if (!specJson.summary && record.summary_config_text) {
    specJson.summary = record.summary_config_text;
  }

  if (!specJson.cpu && record.chipset) {
    specJson.cpu = record.chipset;
  }

  if (!specJson.ram && record.ram_gb !== null) {
    specJson.ram = `${record.ram_gb}GB`;
  }

  if (!specJson.storage && record.storage_gb !== null) {
    specJson.storage = `${record.storage_gb}GB`;
  }

  if (!specJson.os && record.os_name) {
    specJson.os = record.os_version
      ? `${record.os_name} ${record.os_version}`
      : record.os_name;
  }

  if (!specJson.resolution && record.resolution_width && record.resolution_height) {
    specJson.resolution = `${record.resolution_width} x ${record.resolution_height}`;
  }

  if (!specJson.brightness && record.brightness_nits !== null) {
    specJson.brightness = `${record.brightness_nits} nits`;
  }

  return specJson;
}

function flattenSpecEntries(specJson: Record<string, unknown>) {
  const items: Array<{
    is_filterable: boolean;
    section_key: string;
    section_label: string;
    spec_key: string;
    spec_label: string;
    spec_value_text: null | string;
    value_json: null | Record<string, unknown>;
  }> = [];

  for (const [key, value] of Object.entries(specJson)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [nestedKey, nestedValue] of Object.entries(
        value as Record<string, unknown>,
      )) {
        items.push({
          is_filterable: false,
          section_key: normalizeSlug(key, key).replaceAll('-', '_'),
          section_label: key,
          spec_key: normalizeSlug(nestedKey, nestedKey).replaceAll('-', '_'),
          spec_label: nestedKey,
          spec_value_text: stringifySpecValue(nestedValue),
          value_json: toObjectJson(nestedValue),
        });
      }
      continue;
    }

    items.push({
      is_filterable: isProjectionKey(key),
      section_key: 'general',
      section_label: 'General',
      spec_key: normalizeSlug(key, key).replaceAll('-', '_'),
      spec_label: key,
      spec_value_text: stringifySpecValue(value),
      value_json: toObjectJson(value),
    });
  }

  return items;
}

function stringifySpecValue(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return JSON.stringify(value);
}

function toObjectJson(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function parseNumeric(value: unknown) {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const matched = value.match(/-?\d+(\.\d+)?/);
  return matched ? Number(matched[0]) : null;
}

function parseBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized.includes('yes') || normalized.includes('true') || normalized.includes('支持')) {
    return true;
  }

  if (normalized.includes('no') || normalized.includes('false') || normalized.includes('不支持')) {
    return false;
  }

  return null;
}

function parseResolution(value: null | string) {
  if (!value) {
    return { height: null, width: null };
  }

  const matched = value.match(/(\d+)\s*[xX*]\s*(\d+)/);
  if (!matched) {
    return { height: null, width: null };
  }

  return {
    height: Number(matched[2]),
    width: Number(matched[1]),
  };
}

function toNullableText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function extractTags(specJson: Record<string, unknown>) {
  const tags = new Set<string>();

  for (const key of ['cpu', 'os', 'poe', 'summary']) {
    const value = specJson[key];
    if (typeof value === 'string' && value.trim()) {
      tags.add(value.trim());
    }
  }

  return [...tags].slice(0, 6);
}

function isProjectionKey(key: string) {
  return [
    'brightness',
    'cpu',
    'memory',
    'os',
    'poe',
    'ram',
    'resolution',
    'screen_size',
    'size',
    'storage',
    'summary',
  ].includes(key);
}
