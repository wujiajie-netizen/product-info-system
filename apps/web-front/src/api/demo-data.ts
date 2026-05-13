import type {
  BrandRecord,
  CategoryRecord,
  CompanyRecord,
  DocumentRecord,
  ProductCompanyRecord,
  ProductRecord,
  QuoteDocumentRecord,
  QuoteRecord,
  UpdateRecord,
} from './product-info';

import catalog from '../../../../demo-data/catalog.json';

type CatalogData = typeof catalog;
type CatalogSeries = {
  baseDescription: string;
  brandSlug: string;
  categorySlug: string;
  companySlug: string;
  productType: string;
  seriesCode: string;
  seriesName: string;
  variants: CatalogVariant[];
};
type CatalogVariant = {
  brightnessNits?: null | number;
  chipset?: null | string;
  displayName: string;
  modelCode: string;
  osName?: null | string;
  osVersion?: null | string;
  productCompanies?: string[];
  ramGb?: null | number;
  resolutionHeight?: null | number;
  resolutionWidth?: null | number;
  sizeInch?: null | number;
  specs: Record<string, unknown>;
  storageGb?: null | number;
  summaryConfigText: string;
  tags: string[];
};
type CatalogQuoteTier = {
  currency?: string;
  maxQuantity?: null | number;
  minQuantity: number;
  sortOrder?: number;
  unitPrice: number;
};
type CatalogQuoteBatch = {
  batchTitle: string;
  companySlug: string;
  currency: string;
  effectiveFrom?: null | string;
  globalNote?: null | string;
  key: string;
  lines: Array<{
    rowNote?: null | string;
    tiers: CatalogQuoteTier[];
    variantModel: string;
  }>;
  publishedAt?: string;
  status: string;
};
type CatalogDocument = {
  category: string;
  companySlug?: string;
  documentKind?: null | string;
  fileType: DocumentRecord['file_type'];
  isPrimary?: boolean;
  key: string;
  quoteBatchKey?: string;
  sortOrder?: number;
  sourceSheetName?: string;
  storagePath: string;
  tags: string[];
  title: string;
  variantModel: string;
};
type CatalogUpdate = {
  content?: null | string;
  createdAt?: string;
  key: string;
  quoteBatchKey?: string;
  seriesCode?: string;
  title: string;
  type: UpdateRecord['type'];
  variantModel?: null | string;
};

type DemoDataSet = {
  brands: BrandRecord[];
  categories: CategoryRecord[];
  companies: CompanyRecord[];
  documents: DocumentRecord[];
  productCompanies: ProductCompanyRecord[];
  products: ProductRecord[];
  quoteDocuments: QuoteDocumentRecord[];
  quotes: QuoteRecord[];
  updates: UpdateRecord[];
};

const generatedAt = catalog.metadata.generatedAt;

function stableId(scope: string, key: string) {
  return `demo-${scope}-${key}`.toLowerCase().replaceAll(/[^a-z0-9-]/g, '-');
}

function svgDataUri(label: string, accent: string, background: string) {
  const lines = label.length > 12 ? [label.slice(0, 12), label.slice(12, 24)] : [label];
  const text = lines
    .map(
      (line, index) =>
        `<text x="72" y="${index === 0 ? 78 : 108}" text-anchor="middle" font-size="${index === 0 ? 22 : 18}" font-family="Segoe UI, Arial" fill="#ffffff">${line}</text>`,
    )
    .join('');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 144">
      <rect width="144" height="144" rx="28" fill="${background}" />
      <rect x="20" y="20" width="104" height="104" rx="18" fill="${accent}" />
      <rect x="34" y="34" width="76" height="42" rx="12" fill="rgba(255,255,255,0.2)" />
      ${text}
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function textDataUri(title: string, model: string, category: string) {
  const content = `${title}\n\n型号: ${model}\n分类: ${category}\n\n本地 fallback 资料，仅用于无 Supabase 配置时的演示预览。`;
  return `data:text/plain;charset=UTF-8,${encodeURIComponent(content)}`;
}

function toTimestamp(value?: string) {
  if (!value) {
    return generatedAt;
  }

  return value.includes('T') ? value : `${value}T00:00:00.000Z`;
}

function accentForModel(model: string) {
  if (model.startsWith('HDM') || model.startsWith('HT')) {
    return { accent: '#1677ff', background: '#1f3b64' };
  }

  if (model.startsWith('TAB') || model.startsWith('DT')) {
    return { accent: '#0ea5e9', background: '#233451' };
  }

  if (model.startsWith('AX') || model.startsWith('BAT') || model.startsWith('TX')) {
    return { accent: '#f97316', background: '#2c2c54' };
  }

  return { accent: '#18a36d', background: '#1f4f46' };
}

function buildDemoData(data: CatalogData): DemoDataSet {
  const categoryBySlug = new Map(
    data.categories.map((item) => [
      item.slug,
      {
        description: item.description,
        id: stableId('category', item.slug),
        name: item.name,
        parent_id: null,
        slug: item.slug,
        sort_order: item.sortOrder,
        status: 'active',
      } satisfies CategoryRecord,
    ]),
  );

  const brandBySlug = new Map(
    data.brands.map((item) => [
      item.slug,
      {
        aliases: item.aliases,
        description: item.description,
        id: stableId('brand', item.slug),
        name: item.name,
        slug: item.slug,
        status: 'active',
      } satisfies BrandRecord,
    ]),
  );

  const companyBySlug = new Map(
    data.companies.map((item) => [
      item.slug,
      {
        description: item.description,
        id: stableId('company', item.slug),
        name: item.name,
        slug: item.slug,
        status: 'active',
        type: item.type,
      } satisfies CompanyRecord,
    ]),
  );

  const products: ProductRecord[] = [];
  const productCompanies: ProductCompanyRecord[] = [];
  const seriesCodeByModel = new Map<string, string>();
  const seriesNameByModel = new Map<string, string>();
  const companySlugByModel = new Map<string, string>();

  for (const series of data.series as CatalogSeries[]) {
    const category = categoryBySlug.get(series.categorySlug);
    const brand = brandBySlug.get(series.brandSlug);
    const company = companyBySlug.get(series.companySlug);
    const seriesId = stableId('series', series.seriesCode);

    for (const variant of series.variants as CatalogVariant[]) {
      const id = stableId('variant', variant.modelCode);
      products.push({
        brand_id: brand?.id || null,
        category: category?.name || series.productType,
        category_id: category?.id || null,
        company_id: company?.id || null,
        created_at: generatedAt,
        description: series.baseDescription,
        id,
        model: variant.modelCode,
        name: variant.displayName,
        os_name: variant.osName || null,
        os_version: variant.osVersion || null,
        product_type: series.productType,
        ram_gb: variant.ramGb || null,
        resolution_height: variant.resolutionHeight || null,
        resolution_width: variant.resolutionWidth || null,
        series_code: series.seriesCode,
        series_id: seriesId,
        series_name: series.seriesName,
        size_inch: variant.sizeInch || null,
        spec_json: variant.specs,
        status: 'active',
        storage_gb: variant.storageGb || null,
        summary_config_text: variant.summaryConfigText,
        tags: variant.tags,
        updated_at: generatedAt,
      });

      for (const relation of variant.productCompanies || []) {
        const relatedCompany = companyBySlug.get(relation);
        productCompanies.push({
          company_id: relatedCompany?.id || stableId('company', relation),
          created_at: generatedAt,
          notes: null,
          product_id: id,
          relationship_type: relatedCompany?.type || 'supplier',
        });
      }

      seriesCodeByModel.set(variant.modelCode, series.seriesCode);
      seriesNameByModel.set(variant.modelCode, series.seriesName);
      companySlugByModel.set(variant.modelCode, series.companySlug);
    }
  }

  const latestBatchByModel = new Map<string, { id: string; batchTitle: string }>();
  const quotes: QuoteRecord[] = [];

  for (const batch of data.quoteBatches as CatalogQuoteBatch[]) {
    const batchId = stableId('quote-batch', batch.key);
    const company = companyBySlug.get(batch.companySlug);
    const createdAt = toTimestamp(batch.publishedAt);

    for (const line of batch.lines) {
      const id = stableId('quote-line', `${batch.key}-${line.variantModel}`);
      const product = products.find((item) => item.model === line.variantModel);
      const tiers = (line.tiers || []).map((tier, index) => ({
        currency: tier.currency || batch.currency,
        created_at: createdAt,
        id: stableId('quote-tier', `${batch.key}-${line.variantModel}-${index}`),
        max_quantity: tier.maxQuantity || null,
        min_quantity: tier.minQuantity,
        quote_line_id: id,
        sort_order: tier.sortOrder || index,
        unit_price: tier.unitPrice,
        updated_at: createdAt,
      }));

      quotes.push({
        batch_id: batchId,
        batch_title: batch.batchTitle,
        company_id: company?.id || stableId('company', batch.companySlug),
        created_at: createdAt,
        currency: batch.currency,
        id,
        min_order_quantity: tiers[0]?.min_quantity || null,
        product_id: product?.id || stableId('variant', line.variantModel),
        product_model: line.variantModel,
        quote_no: batch.batchTitle,
        quote_tiers: tiers,
        remarks: line.rowNote || batch.globalNote || null,
        status: batch.status,
        unit_price: tiers[0]?.unit_price || null,
        updated_at: createdAt,
        valid_from: batch.effectiveFrom || null,
        valid_until: batch.status === 'expired' ? batch.effectiveFrom || null : null,
      });

      const current = latestBatchByModel.get(line.variantModel);
      if (!current || batch.status === 'active') {
        latestBatchByModel.set(line.variantModel, {
          batchTitle: batch.batchTitle,
          id: batchId,
        });
      }
    }
  }

  const documents: DocumentRecord[] = (data.documents as CatalogDocument[]).map((item, index) => {
    const product = products.find((record) => record.model === item.variantModel);
    const { accent, background } = accentForModel(item.variantModel);
    const quoteBatch =
      item.fileType === 'quote'
        ? latestBatchByModel.get(item.variantModel)
        : undefined;

    return {
      category: item.category,
      company_id:
        companyBySlug.get(item.companySlug || companySlugByModel.get(item.variantModel) || '')
          ?.id || null,
      created_at: generatedAt,
      created_by: null,
      document_kind: item.documentKind || null,
      file_type: item.fileType,
      file_url:
        item.fileType === 'image'
          ? svgDataUri(item.variantModel, accent, background)
          : textDataUri(item.title, item.variantModel, item.category),
      id: stableId('document', item.key),
      is_primary: item.isPrimary || false,
      product_id: product?.id || null,
      product_model: item.variantModel,
      quote_batch_id: item.quoteBatchKey
        ? stableId('quote-batch', item.quoteBatchKey)
        : quoteBatch?.id || null,
      series_id: stableId('series', seriesCodeByModel.get(item.variantModel) || item.variantModel),
      sort_order: item.sortOrder ?? index,
      source_sheet_name: item.sourceSheetName || null,
      storage_path: null,
      tags: item.tags || [],
      title: item.title,
      updated_at: generatedAt,
      variant_id: product?.id || null,
    };
  });

  const quoteDocuments: QuoteDocumentRecord[] = documents
    .filter((item) => item.file_type === 'quote' && item.quote_batch_id)
    .map((item) => {
      const quote = quotes.find((row) => row.batch_id === item.quote_batch_id);
      return quote
        ? {
            created_at: generatedAt,
            document_id: item.id,
            quote_id: quote.id,
          }
        : null;
    })
    .filter((item): item is QuoteDocumentRecord => Boolean(item));

  const updates: UpdateRecord[] = (data.updates as CatalogUpdate[]).map((item) => ({
    content: item.content || null,
    created_at: toTimestamp(item.createdAt),
    created_by: null,
    id: stableId('update', item.key),
    new_value: null,
    old_value: null,
    product_model: item.variantModel || null,
    quote_batch_id: item.quoteBatchKey
      ? stableId('quote-batch', item.quoteBatchKey)
      : null,
    series_id: item.seriesCode
      ? stableId('series', item.seriesCode)
      : item.variantModel
        ? stableId('series', seriesCodeByModel.get(item.variantModel) || item.variantModel)
        : null,
    title: item.title,
    type: item.type,
    variant_id: item.variantModel
      ? stableId('variant', item.variantModel)
      : null,
  }));

  return {
    brands: [...brandBySlug.values()],
    categories: [...categoryBySlug.values()],
    companies: [...companyBySlug.values()],
    documents,
    productCompanies,
    products,
    quoteDocuments,
    quotes,
    updates,
  };
}

const demoData = buildDemoData(catalog);

export function getDemoData() {
  return demoData;
}
