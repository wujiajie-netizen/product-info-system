import fs from 'node:fs';
import path from 'node:path';

import { chunk, getRepoRoot, loadCatalog, sqlLiteral, stableUuid } from './shared.mjs';

const catalog = loadCatalog();

const categoryIdBySlug = new Map();
const brandIdBySlug = new Map();
const companyIdBySlug = new Map();
const seriesIdByCode = new Map();
const variantIdByModel = new Map();
const quoteBatchIdByKey = new Map();

for (const category of catalog.categories) {
  categoryIdBySlug.set(category.slug, stableUuid('category', category.slug));
}

for (const brand of catalog.brands) {
  brandIdBySlug.set(brand.slug, stableUuid('brand', brand.slug));
}

for (const company of catalog.companies) {
  companyIdBySlug.set(company.slug, stableUuid('company', company.slug));
}

for (const series of catalog.series) {
  seriesIdByCode.set(series.seriesCode, stableUuid('series', series.seriesCode));
  for (const variant of series.variants) {
    variantIdByModel.set(variant.modelCode, stableUuid('variant', variant.modelCode));
  }
}

for (const batch of catalog.quoteBatches) {
  quoteBatchIdByKey.set(batch.key, stableUuid('quote-batch', batch.key));
}

const flattenedVariants = catalog.series.flatMap((series) =>
  series.variants.map((variant) => ({ ...variant, series })),
);

const activeBatchByVariant = new Map();
for (const batch of catalog.quoteBatches) {
  for (const line of batch.lines) {
    const current = activeBatchByVariant.get(line.variantModel);
    if (!current) {
      activeBatchByVariant.set(line.variantModel, batch);
      continue;
    }

    if (batch.status === 'active' && current.status !== 'active') {
      activeBatchByVariant.set(line.variantModel, batch);
      continue;
    }

    if (
      batch.status === current.status &&
      String(batch.publishedAt || '').localeCompare(String(current.publishedAt || '')) > 0
    ) {
      activeBatchByVariant.set(line.variantModel, batch);
    }
  }
}

const documentRows = catalog.documents.map((document, index) => {
  const variant = flattenedVariants.find(
    (item) => item.modelCode === document.variantModel,
  );

  if (!variant) {
    throw new Error(`Unknown variant for document: ${document.key}`);
  }

  const batchKey =
    document.quoteBatchKey ||
    (document.fileType === 'quote' ? activeBatchByVariant.get(document.variantModel)?.key : null);

  return {
    ...document,
    id: stableUuid('document', document.key),
    companyId: companyIdBySlug.get(document.companySlug || variant.series.companySlug) || null,
    productId: variantIdByModel.get(document.variantModel),
    quoteBatchId: batchKey ? quoteBatchIdByKey.get(batchKey) : null,
    seriesId: seriesIdByCode.get(variant.series.seriesCode),
    sortOrder: document.sortOrder ?? index,
    variantId: variantIdByModel.get(document.variantModel),
  };
});

const quoteBatchRows = catalog.quoteBatches.map((batch) => {
  const id = quoteBatchIdByKey.get(batch.key);
  const sourceDocument = documentRows.find(
    (document) =>
      document.fileType === 'quote' &&
      document.quoteBatchId === id,
  );

  return {
    ...batch,
    companyId: companyIdBySlug.get(batch.companySlug),
    id,
    sourceDocumentId: sourceDocument?.id || null,
  };
});

const quoteLineRows = quoteBatchRows.flatMap((batch) =>
  batch.lines.map((line, lineIndex) => ({
    ...line,
    batch,
    id: stableUuid('quote-line', `${batch.key}:${line.variantModel}`),
    sortOrder: line.sortOrder ?? lineIndex,
    variantId: variantIdByModel.get(line.variantModel),
  })),
);

const quoteTierRows = quoteLineRows.flatMap((line) =>
  (line.tiers || []).map((tier, tierIndex) => ({
    ...tier,
    id: stableUuid('quote-tier', `${line.id}:${tierIndex}`),
    quoteLineId: line.id,
    sortOrder: tier.sortOrder ?? tierIndex,
  })),
);

const quoteOptionRows = quoteLineRows.flatMap((line) =>
  (line.options || []).map((option, optionIndex) => ({
    ...option,
    id: stableUuid('quote-option', `${line.id}:${optionIndex}`),
    quoteBatchId:
      option.scopeType === 'batch' ? line.batch.id : null,
    quoteLineId:
      option.scopeType === 'batch' ? null : line.id,
    sortOrder: option.sortOrder ?? optionIndex,
  })),
);

const updateRows = catalog.updates.map((update) => {
  const variant = update.variantModel
    ? flattenedVariants.find((item) => item.modelCode === update.variantModel)
    : null;

  return {
    ...update,
    id: stableUuid('update', update.key),
    quoteBatchId: update.quoteBatchKey
      ? quoteBatchIdByKey.get(update.quoteBatchKey)
      : null,
    seriesId:
      update.seriesCode
        ? seriesIdByCode.get(update.seriesCode)
        : variant
          ? seriesIdByCode.get(variant.series.seriesCode)
          : null,
    variantId: update.variantModel
      ? variantIdByModel.get(update.variantModel)
      : null,
  };
});

const specRows = flattenedVariants.flatMap((variantWithSeries) =>
  Object.entries(variantWithSeries.specs || {}).map(([specKey, specValue], index) => ({
    id: stableUuid('spec-item', `${variantWithSeries.modelCode}:${specKey}`),
    isFilterable: [
      'battery',
      'brightness',
      'capacity',
      'memory',
      'network',
      'os',
      'resolution',
      'screen_size',
      'storage',
      'temperature',
      'voltage',
    ].includes(specKey),
    sectionKey: 'general',
    sectionLabel: 'General',
    sortOrder: index,
    specKey,
    specLabel: specKey,
    specValueNumber:
      typeof specValue === 'number' ? specValue : null,
    specValueText:
      typeof specValue === 'string' ? specValue : String(specValue),
    valueJson:
      specValue && typeof specValue === 'object' && !Array.isArray(specValue)
        ? specValue
        : null,
    variantId: variantIdByModel.get(variantWithSeries.modelCode),
  })),
);

const legacyProducts = flattenedVariants.map((variant) => ({
  id: variantIdByModel.get(variant.modelCode),
  brandId: brandIdBySlug.get(variant.series.brandSlug),
  category: catalog.categories.find(
    (item) => item.slug === variant.series.categorySlug,
  )?.name,
  categoryId: categoryIdBySlug.get(variant.series.categorySlug),
  description: variant.series.baseDescription,
  model: variant.modelCode,
  name: variant.displayName,
  specJson: variant.specs,
  status: 'active',
  tags: variant.tags,
}));

const productCompanyRows = flattenedVariants.flatMap((variant) =>
  (variant.productCompanies || []).map((companySlug, index) => ({
    companyId: companyIdBySlug.get(companySlug),
    createdAt: catalog.metadata.generatedAt,
    notes: null,
    productId: variantIdByModel.get(variant.modelCode),
    relationshipType:
      catalog.companies.find((item) => item.slug === companySlug)?.type || 'supplier',
    sortOrder: index,
  })),
);

const lines = [];

function push(text = '') {
  lines.push(text);
}

function writeDeleteByIds(table, ids, column = 'id') {
  for (const group of chunk(ids.filter(Boolean), 100)) {
    if (group.length === 0) {
      continue;
    }

    push(
      `delete from public.${table} where ${column} in (${group
        .map((id) => sqlLiteral(id))
        .join(', ')});`,
    );
  }
}

function writeInsert({
  table,
  columns,
  conflict,
  rows,
}) {
  if (rows.length === 0) {
    return;
  }

  push(`insert into public.${table} (${columns.join(', ')})`);
  push('values');

  rows.forEach((row, rowIndex) => {
    const values = columns.map((column) => sqlLiteral(row[column]));
    push(`  (${values.join(', ')})${rowIndex === rows.length - 1 ? '' : ','}`);
  });

  if (conflict) {
    push(`on conflict ${conflict.target} do update`);
    push(`set ${conflict.assignments.join(', ')};`);
  } else {
    push(';');
  }

  push();
}

push('-- Generated by scripts/demo-data/generate-seed.mjs');
push(`-- Source: demo-data/catalog.json @ ${catalog.metadata.generatedAt}`);
push('begin;');
push();

writeDeleteByIds('quote_price_tiers', quoteTierRows.map((item) => item.id));
writeDeleteByIds('quote_options', quoteOptionRows.map((item) => item.id));
writeDeleteByIds('quote_lines', quoteLineRows.map((item) => item.id));
writeDeleteByIds('quote_batches', quoteBatchRows.map((item) => item.id));
writeDeleteByIds('documents', documentRows.map((item) => item.id));
writeDeleteByIds('updates', updateRows.map((item) => item.id));
push(
  `delete from public.updates where product_model in (${flattenedVariants
    .map((item) => sqlLiteral(item.modelCode))
    .join(', ')}) or quote_batch_id in (${quoteBatchRows
    .map((item) => sqlLiteral(item.id))
    .join(', ')});`,
);
push(
  `delete from public.product_spec_items where variant_id in (${flattenedVariants
    .map((item) => sqlLiteral(variantIdByModel.get(item.modelCode)))
    .join(', ')});`,
);
push(
  `delete from public.product_companies where product_id in (${flattenedVariants
    .map((item) => sqlLiteral(variantIdByModel.get(item.modelCode)))
    .join(', ')});`,
);
push();

writeInsert({
  table: 'categories',
  columns: [
    'id',
    'name',
    'slug',
    'description',
    'sort_order',
    'status',
    'created_at',
    'updated_at',
  ],
  conflict: {
    target: '(id)',
    assignments: [
      'name = excluded.name',
      'slug = excluded.slug',
      'description = excluded.description',
      'sort_order = excluded.sort_order',
      'status = excluded.status',
      'updated_at = excluded.updated_at',
    ],
  },
  rows: catalog.categories.map((item) => ({
    created_at: catalog.metadata.generatedAt,
    description: item.description,
    id: categoryIdBySlug.get(item.slug),
    name: item.name,
    slug: item.slug,
    sort_order: item.sortOrder,
    status: 'active',
    updated_at: catalog.metadata.generatedAt,
  })),
});

writeInsert({
  table: 'brands',
  columns: [
    'id',
    'name',
    'slug',
    'aliases',
    'description',
    'status',
    'created_at',
    'updated_at',
  ],
  conflict: {
    target: '(id)',
    assignments: [
      'name = excluded.name',
      'slug = excluded.slug',
      'aliases = excluded.aliases',
      'description = excluded.description',
      'status = excluded.status',
      'updated_at = excluded.updated_at',
    ],
  },
  rows: catalog.brands.map((item) => ({
    aliases: item.aliases,
    created_at: catalog.metadata.generatedAt,
    description: item.description,
    id: brandIdBySlug.get(item.slug),
    name: item.name,
    slug: item.slug,
    status: 'active',
    updated_at: catalog.metadata.generatedAt,
  })),
});

writeInsert({
  table: 'companies',
  columns: [
    'id',
    'name',
    'slug',
    'type',
    'description',
    'status',
    'created_at',
    'updated_at',
  ],
  conflict: {
    target: '(id)',
    assignments: [
      'name = excluded.name',
      'slug = excluded.slug',
      'type = excluded.type',
      'description = excluded.description',
      'status = excluded.status',
      'updated_at = excluded.updated_at',
    ],
  },
  rows: catalog.companies.map((item) => ({
    created_at: catalog.metadata.generatedAt,
    description: item.description,
    id: companyIdBySlug.get(item.slug),
    name: item.name,
    slug: item.slug,
    status: 'active',
    type: item.type,
    updated_at: catalog.metadata.generatedAt,
  })),
});

writeInsert({
  table: 'product_series',
  columns: [
    'id',
    'company_id',
    'category_id',
    'brand_id',
    'series_code',
    'series_name',
    'product_type',
    'base_description',
    'status',
    'created_at',
    'updated_at',
  ],
  conflict: {
    target: '(id)',
    assignments: [
      'company_id = excluded.company_id',
      'category_id = excluded.category_id',
      'brand_id = excluded.brand_id',
      'series_code = excluded.series_code',
      'series_name = excluded.series_name',
      'product_type = excluded.product_type',
      'base_description = excluded.base_description',
      'status = excluded.status',
      'updated_at = excluded.updated_at',
    ],
  },
  rows: catalog.series.map((item) => ({
    base_description: item.baseDescription,
    brand_id: brandIdBySlug.get(item.brandSlug),
    category_id: categoryIdBySlug.get(item.categorySlug),
    company_id: companyIdBySlug.get(item.companySlug),
    created_at: catalog.metadata.generatedAt,
    id: seriesIdByCode.get(item.seriesCode),
    product_type: item.productType,
    series_code: item.seriesCode,
    series_name: item.seriesName,
    status: 'active',
    updated_at: catalog.metadata.generatedAt,
  })),
});

writeInsert({
  table: 'product_variants',
  columns: [
    'id',
    'series_id',
    'model_code',
    'display_name',
    'size_inch',
    'chipset',
    'ram_gb',
    'storage_gb',
    'os_name',
    'os_version',
    'brightness_nits',
    'resolution_width',
    'resolution_height',
    'summary_config_text',
    'status',
    'created_at',
    'updated_at',
  ],
  conflict: {
    target: '(id)',
    assignments: [
      'series_id = excluded.series_id',
      'model_code = excluded.model_code',
      'display_name = excluded.display_name',
      'size_inch = excluded.size_inch',
      'chipset = excluded.chipset',
      'ram_gb = excluded.ram_gb',
      'storage_gb = excluded.storage_gb',
      'os_name = excluded.os_name',
      'os_version = excluded.os_version',
      'brightness_nits = excluded.brightness_nits',
      'resolution_width = excluded.resolution_width',
      'resolution_height = excluded.resolution_height',
      'summary_config_text = excluded.summary_config_text',
      'status = excluded.status',
      'updated_at = excluded.updated_at',
    ],
  },
  rows: flattenedVariants.map((item) => ({
    brightness_nits: item.brightnessNits ?? null,
    chipset: item.chipset ?? null,
    created_at: catalog.metadata.generatedAt,
    display_name: item.displayName,
    id: variantIdByModel.get(item.modelCode),
    model_code: item.modelCode,
    os_name: item.osName ?? null,
    os_version: item.osVersion ?? null,
    ram_gb: item.ramGb ?? null,
    resolution_height: item.resolutionHeight ?? null,
    resolution_width: item.resolutionWidth ?? null,
    series_id: seriesIdByCode.get(item.series.seriesCode),
    size_inch: item.sizeInch ?? null,
    status: 'active',
    storage_gb: item.storageGb ?? null,
    summary_config_text: item.summaryConfigText ?? null,
    updated_at: catalog.metadata.generatedAt,
  })),
});

writeInsert({
  table: 'products',
  columns: [
    'id',
    'category',
    'model',
    'name',
    'spec_json',
    'tags',
    'status',
    'category_id',
    'brand_id',
    'description',
    'created_at',
    'updated_at',
  ],
  conflict: {
    target: '(id)',
    assignments: [
      'category = excluded.category',
      'model = excluded.model',
      'name = excluded.name',
      'spec_json = excluded.spec_json',
      'tags = excluded.tags',
      'status = excluded.status',
      'category_id = excluded.category_id',
      'brand_id = excluded.brand_id',
      'description = excluded.description',
      'updated_at = excluded.updated_at',
    ],
  },
  rows: legacyProducts.map((item) => ({
    brand_id: item.brandId,
    category: item.category,
    category_id: item.categoryId,
    created_at: catalog.metadata.generatedAt,
    description: item.description,
    id: item.id,
    model: item.model,
    name: item.name,
    spec_json: item.specJson,
    status: item.status,
    tags: item.tags,
    updated_at: catalog.metadata.generatedAt,
  })),
});

writeInsert({
  table: 'product_spec_items',
  columns: [
    'id',
    'variant_id',
    'section_key',
    'section_label',
    'spec_key',
    'spec_label',
    'spec_value_text',
    'spec_value_number',
    'value_json',
    'is_filterable',
    'sort_order',
    'created_at',
    'updated_at',
  ],
  conflict: {
    target: '(id)',
    assignments: [
      'variant_id = excluded.variant_id',
      'section_key = excluded.section_key',
      'section_label = excluded.section_label',
      'spec_key = excluded.spec_key',
      'spec_label = excluded.spec_label',
      'spec_value_text = excluded.spec_value_text',
      'spec_value_number = excluded.spec_value_number',
      'value_json = excluded.value_json',
      'is_filterable = excluded.is_filterable',
      'sort_order = excluded.sort_order',
      'updated_at = excluded.updated_at',
    ],
  },
  rows: specRows.map((item) => ({
    created_at: catalog.metadata.generatedAt,
    id: item.id,
    is_filterable: item.isFilterable,
    section_key: item.sectionKey,
    section_label: item.sectionLabel,
    sort_order: item.sortOrder,
    spec_key: item.specKey,
    spec_label: item.specLabel,
    spec_value_number: item.specValueNumber,
    spec_value_text: item.specValueText,
    updated_at: catalog.metadata.generatedAt,
    value_json: item.valueJson,
    variant_id: item.variantId,
  })),
});

writeInsert({
  table: 'product_companies',
  columns: [
    'product_id',
    'company_id',
    'relationship_type',
    'notes',
    'created_at',
  ],
  conflict: {
    target: '(product_id, company_id, relationship_type)',
    assignments: ['notes = excluded.notes', 'created_at = excluded.created_at'],
  },
  rows: productCompanyRows.map((item) => ({
    company_id: item.companyId,
    created_at: item.createdAt,
    notes: item.notes,
    product_id: item.productId,
    relationship_type: item.relationshipType,
  })),
});

writeInsert({
  table: 'documents',
  columns: [
    'id',
    'title',
    'product_model',
    'product_id',
    'company_id',
    'series_id',
    'variant_id',
    'quote_batch_id',
    'document_kind',
    'file_type',
    'category',
    'file_url',
    'storage_path',
    'source_sheet_name',
    'sort_order',
    'is_primary',
    'tags',
    'created_at',
    'updated_at',
  ],
  conflict: {
    target: '(id)',
    assignments: [
      'title = excluded.title',
      'product_model = excluded.product_model',
      'product_id = excluded.product_id',
      'company_id = excluded.company_id',
      'series_id = excluded.series_id',
      'variant_id = excluded.variant_id',
      'quote_batch_id = excluded.quote_batch_id',
      'document_kind = excluded.document_kind',
      'file_type = excluded.file_type',
      'category = excluded.category',
      'file_url = excluded.file_url',
      'storage_path = excluded.storage_path',
      'source_sheet_name = excluded.source_sheet_name',
      'sort_order = excluded.sort_order',
      'is_primary = excluded.is_primary',
      'tags = excluded.tags',
      'updated_at = excluded.updated_at',
    ],
  },
  rows: documentRows.map((item) => ({
    category: item.category,
    company_id: item.companyId,
    created_at: catalog.metadata.generatedAt,
    document_kind: item.documentKind,
    file_type: item.fileType,
    file_url: `storage://product-documents/${item.storagePath}`,
    id: item.id,
    is_primary: item.isPrimary || false,
    product_id: item.productId,
    product_model: item.variantModel,
    quote_batch_id: null,
    series_id: item.seriesId,
    sort_order: item.sortOrder,
    source_sheet_name: item.sourceSheetName || null,
    storage_path: item.storagePath,
    tags: item.tags || [],
    title: item.title,
    updated_at: catalog.metadata.generatedAt,
    variant_id: item.variantId,
  })),
});

writeInsert({
  table: 'quote_batches',
  columns: [
    'id',
    'company_id',
    'source_document_id',
    'batch_title',
    'published_at',
    'effective_from',
    'currency',
    'status',
    'entry_mode',
    'global_note',
    'created_at',
    'updated_at',
  ],
  conflict: {
    target: '(id)',
    assignments: [
      'company_id = excluded.company_id',
      'source_document_id = excluded.source_document_id',
      'batch_title = excluded.batch_title',
      'published_at = excluded.published_at',
      'effective_from = excluded.effective_from',
      'currency = excluded.currency',
      'status = excluded.status',
      'entry_mode = excluded.entry_mode',
      'global_note = excluded.global_note',
      'updated_at = excluded.updated_at',
    ],
  },
  rows: quoteBatchRows.map((item) => ({
    batch_title: item.batchTitle,
    company_id: item.companyId,
    created_at: catalog.metadata.generatedAt,
    currency: item.currency,
    effective_from: item.effectiveFrom || null,
    entry_mode: 'demo_seed',
    global_note: item.globalNote || null,
    id: item.id,
    published_at: item.publishedAt || null,
    source_document_id: item.sourceDocumentId,
    status: item.status,
    updated_at: catalog.metadata.generatedAt,
  })),
});

writeInsert({
  table: 'quote_lines',
  columns: [
    'id',
    'quote_batch_id',
    'variant_id',
    'standard_config_text',
    'row_note',
    'sort_order',
    'status',
    'created_at',
    'updated_at',
  ],
  conflict: {
    target: '(id)',
    assignments: [
      'quote_batch_id = excluded.quote_batch_id',
      'variant_id = excluded.variant_id',
      'standard_config_text = excluded.standard_config_text',
      'row_note = excluded.row_note',
      'sort_order = excluded.sort_order',
      'status = excluded.status',
      'updated_at = excluded.updated_at',
    ],
  },
  rows: quoteLineRows.map((item) => ({
    created_at: catalog.metadata.generatedAt,
    id: item.id,
    quote_batch_id: item.batch.id,
    row_note: item.rowNote || null,
    sort_order: item.sortOrder,
    standard_config_text: item.standardConfigText || null,
    status: item.batch.status === 'archived' ? 'inactive' : 'active',
    updated_at: catalog.metadata.generatedAt,
    variant_id: item.variantId,
  })),
});

writeInsert({
  table: 'quote_price_tiers',
  columns: [
    'id',
    'quote_line_id',
    'min_quantity',
    'max_quantity',
    'unit_price',
    'currency',
    'sort_order',
    'created_at',
    'updated_at',
  ],
  conflict: {
    target: '(id)',
    assignments: [
      'quote_line_id = excluded.quote_line_id',
      'min_quantity = excluded.min_quantity',
      'max_quantity = excluded.max_quantity',
      'unit_price = excluded.unit_price',
      'currency = excluded.currency',
      'sort_order = excluded.sort_order',
      'updated_at = excluded.updated_at',
    ],
  },
  rows: quoteTierRows.map((item) => ({
    created_at: catalog.metadata.generatedAt,
    currency: item.currency || 'CNY',
    id: item.id,
    max_quantity: item.maxQuantity || null,
    min_quantity: item.minQuantity,
    quote_line_id: item.quoteLineId,
    sort_order: item.sortOrder,
    unit_price: item.unitPrice,
    updated_at: catalog.metadata.generatedAt,
  })),
});

writeInsert({
  table: 'quote_options',
  columns: [
    'id',
    'scope_type',
    'quote_batch_id',
    'quote_line_id',
    'option_type',
    'delta_type',
    'price_delta',
    'currency',
    'option_name',
    'description',
    'sort_order',
    'created_at',
    'updated_at',
  ],
  conflict: {
    target: '(id)',
    assignments: [
      'scope_type = excluded.scope_type',
      'quote_batch_id = excluded.quote_batch_id',
      'quote_line_id = excluded.quote_line_id',
      'option_type = excluded.option_type',
      'delta_type = excluded.delta_type',
      'price_delta = excluded.price_delta',
      'currency = excluded.currency',
      'option_name = excluded.option_name',
      'description = excluded.description',
      'sort_order = excluded.sort_order',
      'updated_at = excluded.updated_at',
    ],
  },
  rows: quoteOptionRows.map((item) => ({
    created_at: catalog.metadata.generatedAt,
    currency: item.currency || null,
    delta_type: item.deltaType,
    description: item.description || null,
    id: item.id,
    option_name: item.optionName,
    option_type: item.optionType,
    price_delta: item.priceDelta ?? null,
    quote_batch_id: item.quoteBatchId,
    quote_line_id: item.quoteLineId,
    scope_type: item.scopeType || 'line',
    sort_order: item.sortOrder,
    updated_at: catalog.metadata.generatedAt,
  })),
});

for (const document of documentRows) {
  if (!document.quoteBatchId) {
    continue;
  }

  push(
    `update public.documents set quote_batch_id = ${sqlLiteral(document.quoteBatchId)} where id = ${sqlLiteral(document.id)};`,
  );
}
push();

push(
  `delete from public.updates where product_model in (${flattenedVariants
    .map((item) => sqlLiteral(item.modelCode))
    .join(', ')}) or quote_batch_id in (${quoteBatchRows
    .map((item) => sqlLiteral(item.id))
    .join(', ')}) or title in (${quoteBatchRows
    .map((item) => sqlLiteral(`${item.batchTitle} 报价更新`))
    .join(', ')});`,
);
push();

writeInsert({
  table: 'updates',
  columns: [
    'id',
    'type',
    'title',
    'content',
    'product_model',
    'series_id',
    'variant_id',
    'quote_batch_id',
    'old_value',
    'new_value',
    'created_at',
  ],
  conflict: {
    target: '(id)',
    assignments: [
      'type = excluded.type',
      'title = excluded.title',
      'content = excluded.content',
      'product_model = excluded.product_model',
      'series_id = excluded.series_id',
      'variant_id = excluded.variant_id',
      'quote_batch_id = excluded.quote_batch_id',
      'old_value = excluded.old_value',
      'new_value = excluded.new_value',
      'created_at = excluded.created_at',
    ],
  },
  rows: updateRows.map((item) => ({
    content: item.content || null,
    created_at: item.createdAt,
    id: item.id,
    new_value: null,
    old_value: null,
    product_model: item.variantModel || null,
    quote_batch_id: item.quoteBatchId,
    series_id: item.seriesId,
    title: item.title,
    type: item.type,
    variant_id: item.variantId,
  })),
});

push('commit;');
push();

const output = `${lines.join('\n')}\n`;
const target = path.join(getRepoRoot(), 'supabase', 'seed.sql');
fs.writeFileSync(target, output, 'utf8');
console.log(`Wrote ${target}`);
