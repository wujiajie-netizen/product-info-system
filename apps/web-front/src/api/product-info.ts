import { isSupabaseConfigured, supabase } from '#/lib/supabase';
import { getDemoData } from './demo-data';

export interface ProductRecord {
  brand_id?: null | string;
  category: string;
  category_id?: null | string;
  company_id?: null | string;
  created_at: string;
  description?: null | string;
  id: string;
  model: string;
  name: string;
  os_name?: null | string;
  os_version?: null | string;
  product_type?: null | string;
  ram_gb?: null | number;
  resolution_height?: null | number;
  resolution_width?: null | number;
  series_code?: null | string;
  series_id?: null | string;
  series_name?: null | string;
  size_inch?: null | number;
  spec_json: Record<string, unknown>;
  status: string;
  storage_gb?: null | number;
  summary_config_text?: null | string;
  tags: string[];
  updated_at: string;
}

export interface CategoryRecord {
  description: null | string;
  id: string;
  name: string;
  parent_id: null | string;
  slug: string;
  sort_order: number;
  status: string;
}

export interface BrandRecord {
  aliases: string[];
  description: null | string;
  id: string;
  name: string;
  slug: string;
  status: string;
}

export interface CompanyRecord {
  description: null | string;
  id: string;
  name: string;
  slug: string;
  status: string;
  type: string;
}

export interface ProductCompanyRecord {
  company_id: string;
  created_at: string;
  notes: null | string;
  product_id: string;
  relationship_type: string;
}

export interface DocumentRecord {
  category: string;
  company_id?: null | string;
  created_at: string;
  created_by: null | string;
  document_kind?: null | string;
  file_type: 'image' | 'other' | 'quote' | 'spec' | 'technical';
  file_url: string;
  id: string;
  is_primary?: boolean;
  product_id?: null | string;
  product_model: null | string;
  quote_batch_id?: null | string;
  series_id?: null | string;
  storage_path: null | string;
  variant_id?: null | string;
  tags: string[];
  title: string;
  updated_at: string;
}

export interface QuoteRecord {
  batch_id?: string;
  batch_title?: null | string;
  company_id: string;
  created_at: string;
  currency: string;
  id: string;
  min_order_quantity: null | number;
  product_id: string;
  product_model?: null | string;
  quote_no: null | string;
  quote_tiers?: Array<{
    currency: string;
    max_quantity?: null | number;
    min_quantity: number;
    unit_price: number;
  }>;
  remarks: null | string;
  status: string;
  unit_price: null | number;
  updated_at: string;
  valid_from?: null | string;
  valid_until: null | string;
}

export interface QuoteDocumentRecord {
  created_at: string;
  document_id: string;
  quote_id: string;
}

export interface ProductQuoteItem extends QuoteRecord {
  attachments: DocumentRecord[];
}

export interface UpdateRecord {
  content: null | string;
  created_at: string;
  created_by: null | string;
  id: string;
  new_value: null | string;
  old_value: null | string;
  product_model: null | string;
  quote_batch_id?: null | string;
  series_id?: null | string;
  title: string;
  type: 'notice' | 'price_update' | 'product';
  variant_id?: null | string;
}

export interface SpecEntry {
  key: string;
  label: string;
  value: string;
}

export interface ProductListItem {
  brand: null | string;
  brandId: null | string;
  brandSlug: null | string;
  category: string;
  categoryId: null | string;
  categorySlug: null | string;
  company: string;
  companyId: null | string;
  companyType?: null | string;
  companyCount: number;
  documentCount: number;
  documentTypes?: DocumentRecord['file_type'][];
  id: string;
  imageUrl: string;
  latestQuote: null | QuoteRecord;
  model: string;
  name: string;
  priceRange: string;
  quoteCount: number;
  specEntries: SpecEntry[];
  status: string;
  summary: string;
  tags: string[];
  updatedAt: string;
}

export interface ProductListOptions {
  brandSlugs?: string[];
  categorySlug?: string;
  keyword?: string;
  maxPrice?: number;
  minPrice?: number;
  page?: number;
  pageSize?: number;
  sortBy?: '价格从低到高' | '最新更新' | '相关度';
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface CategorySummary {
  count: number;
  description: null | string;
  id: string;
  latestUpdatedAt: string;
  latestUpdatedAtLabel: string;
  name: string;
  sampleModels: string[];
  slug: string;
}

export interface BrandSummary {
  count: number;
  description: null | string;
  id: string;
  name: string;
  sampleModels: string[];
  slug: string;
}

export interface DashboardSummary {
  brands: BrandSummary[];
  categories: CategorySummary[];
  companies: CompanyRecord[];
  documentCount: number;
  products: ProductListItem[];
  quoteCount: number;
}

export interface ProductDetailData {
  companies: CompanyRecord[];
  documents: DocumentRecord[];
  product: ProductListItem;
  quotes: ProductQuoteItem[];
  updates: UpdateRecord[];
}

const BUCKET = 'product-documents';
const DATE_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const demoData = getDemoData();
const demoCategories = demoData.categories;
const demoBrands = demoData.brands;
const demoCompanies = demoData.companies;
const demoProductCompanies = demoData.productCompanies;
const demoProducts = demoData.products;
const demoDocuments = demoData.documents;
const demoQuotes = demoData.quotes;
const demoQuoteDocuments = demoData.quoteDocuments;
const demoUpdates = demoData.updates;
const DEFAULT_PRODUCT_PAGE_SIZE = 20;

function assertSupabaseClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      'Supabase 尚未配置，请先设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。',
    );
  }

  return supabase;
}

function keyToLabel(key: string) {
  const labels: Record<string, string> = {
    battery: '电池',
    brightness: '亮度',
    capacity: '容量',
    cell_type: '电芯',
    energy: '能量',
    flash: 'Flash',
    interface: '接口',
    memory: '内存',
    os: '系统',
    package: '封装',
    panel: '面板类型',
    ram: 'RAM',
    refresh_rate: '刷新率',
    resolution: '分辨率',
    response_time: '响应时间',
    screen_size: '屏幕尺寸',
    speed: '主频',
    voltage: '工作电压',
  };

  return labels[key] || key.replaceAll('_', ' ');
}

function formatSpecValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => formatSpecValue(item)).join(' / ');
  }

  if (typeof value === 'boolean') {
    return value ? '是' : '否';
  }

  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

function normalizeSearchKeyword(keyword?: string) {
  return keyword?.trim() || '';
}

function sanitizeIlikeValue(value: string) {
  return value.replaceAll(/[,%()]/g, ' ').trim();
}

function buildIlikeOrFilter(fields: string[], keyword: string) {
  const sanitized = sanitizeIlikeValue(keyword);
  if (!sanitized) {
    return '';
  }

  return fields.map((field) => `${field}.ilike.%${sanitized}%`).join(',');
}

function intersectIds(current: null | Set<string>, nextIds: Iterable<string>) {
  const next = new Set<string>();
  for (const id of nextIds) {
    if (id) {
      next.add(id);
    }
  }

  if (current === null) {
    return next;
  }

  return new Set([...current].filter((id) => next.has(id)));
}

function getPriceNumber(value: string) {
  const normalized = value.replaceAll(',', '').replace(/[^\d.-]/g, '');
  return Number(normalized) || 0;
}

function normalizePaginationValue(value: number | undefined, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1, Math.floor(value || fallback));
}

export function paginateItems<T>(
  items: T[],
  {
    page,
    pageSize,
  }: {
    page?: number;
    pageSize?: number;
  } = {},
): PaginatedResult<T> {
  const normalizedPageSize = normalizePaginationValue(
    pageSize,
    DEFAULT_PRODUCT_PAGE_SIZE,
  );
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / normalizedPageSize));
  const normalizedPage = Math.min(
    normalizePaginationValue(page, 1),
    totalPages,
  );
  const start = (normalizedPage - 1) * normalizedPageSize;

  return {
    items: items.slice(start, start + normalizedPageSize),
    page: normalizedPage,
    pageSize: normalizedPageSize,
    total,
    totalPages,
  };
}

function normalizeSpecEntries(specJson: Record<string, unknown>) {
  return Object.entries(specJson)
    .filter(([key]) => !['description', 'summary'].includes(key))
    .map(([key, value]) => ({
      key,
      label: keyToLabel(key),
      value: formatSpecValue(value),
    }));
}

function buildProductSummary(record: ProductRecord, specEntries: SpecEntry[]) {
  const summary =
    typeof record.spec_json.summary === 'string'
      ? record.spec_json.summary
      : (typeof record.description === 'string'
        ? record.description
        : '');

  if (summary.trim()) {
    return summary.trim();
  }

  if (specEntries.length > 0) {
    return specEntries
      .slice(0, 3)
      .map((entry) => `${entry.label}: ${entry.value}`)
      .join(' · ');
  }

  return `${record.category} · ${formatStatus(record.status)}`;
}

async function mapProduct(
  record: ProductRecord,
  {
    brands,
    categories,
    companies,
    documents,
    productCompanies,
    quotes,
  }: {
    brands: BrandRecord[];
    categories: CategoryRecord[];
    companies: CompanyRecord[];
    documents: DocumentRecord[];
    productCompanies: ProductCompanyRecord[];
    quotes: QuoteRecord[];
  },
): Promise<ProductListItem> {
  const specEntries = normalizeSpecEntries(record.spec_json || {});
  const productQuotes = quotes.filter(
    (item) => item.product_id === record.id && isVisibleQuote(item),
  );
  const latestQuote = productQuotes[0] || null;
  const brand = brands.find((item) => item.id === record.brand_id) || null;
  const categoryRecord =
    categories.find(
      (item) => item.id === record.category_id || item.name === record.category,
    ) || null;
  const linkedCompanyIds = new Set(
    productCompanies
      .filter((item) => item.product_id === record.id)
      .map((item) => item.company_id),
  );
  if (latestQuote) {
    linkedCompanyIds.add(latestQuote.company_id);
  }
  const linkedCompanies = companies.filter((item) =>
    linkedCompanyIds.has(item.id),
  );
  const primaryCompany = linkedCompanies[0] || null;
  const productDocuments = documents.filter(
    (item) =>
      item.product_id === record.id || item.product_model === record.model,
  );
  const documentTypes = [...new Set(
    productDocuments
      .filter((item) => item.file_type !== 'image')
      .map((item) => item.file_type),
  )];

  return {
    brand: brand?.name || null,
    brandId: record.brand_id || null,
    brandSlug: brand?.slug || null,
    category: record.category,
    categoryId: record.category_id || null,
    categorySlug: categoryRecord?.slug || null,
    company: primaryCompany?.name || '未关联公司',
    companyId: primaryCompany?.id || record.company_id || null,
    companyType: primaryCompany?.type || null,
    companyCount: linkedCompanies.length,
    documentCount: productDocuments.filter((item) => item.file_type !== 'image')
      .length,
    documentTypes,
    id: record.id,
    imageUrl: await buildProductImage(record, productDocuments),
    latestQuote,
    model: record.model,
    name: record.name,
    priceRange: formatMoney(latestQuote),
    quoteCount: productQuotes.length,
    specEntries,
    status: record.status,
    summary: buildProductSummary(record, specEntries),
    tags: record.tags || [],
    updatedAt: record.updated_at,
  };
}

async function buildProductImage(
  record: ProductRecord,
  documents: DocumentRecord[],
) {
  const imageDocument = documents.find((item) => item.file_type === 'image');
  if (imageDocument) {
    const url = await createDocumentSignedUrl(imageDocument);
    if (url && url !== '#') {
      return url;
    }
  }

  const label = encodeURIComponent(record.model.slice(0, 10));
  return `https://placehold.co/240x180/eaf2ff/0f3f88?text=${label}`;
}

function buildCategories(
  products: ProductListItem[],
  categories: CategoryRecord[],
) {
  const summaries = categories.map((category) => {
    const items = products.filter(
      (product) =>
        product.categoryId === category.id ||
        product.category === category.name,
    );
    const sortedItems = [...items].toSorted((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    );
    const latestUpdatedAt = sortedItems[0]?.updatedAt || '';

    return {
      count: items.length,
      description: category.description,
      id: category.id,
      latestUpdatedAt,
      latestUpdatedAtLabel: formatDate(latestUpdatedAt),
      name: category.name,
      sampleModels: sortedItems.slice(0, 3).map((item) => item.model),
      slug: category.slug,
    };
  });

  return summaries.toSorted((left, right) => right.count - left.count);
}

function buildBrands(products: ProductListItem[], brands: BrandRecord[]) {
  return brands
    .map((brand) => {
      const items = products.filter((product) => product.brandId === brand.id);

      return {
        count: items.length,
        description: brand.description,
        id: brand.id,
        name: brand.name,
        sampleModels: items.slice(0, 3).map((item) => item.model),
        slug: brand.slug,
      };
    })
    .toSorted(
      (left, right) =>
        right.count - left.count || left.name.localeCompare(right.name),
    );
}

function isActiveRecord<T extends { status?: string }>(record: T) {
  return record.status === 'active';
}

function isVisibleQuote(record: QuoteRecord) {
  if (!isActiveRecord(record)) {
    return false;
  }

  if (!record.valid_until) {
    return true;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    new Date(`${record.valid_until}T23:59:59`).getTime() >= today.getTime()
  );
}

async function queryTable<T extends { status?: string }>(
  table: string,
  fallback: T[],
  { activeOnly = false }: { activeOnly?: boolean } = {},
) {
  if (!isSupabaseConfigured) {
    return activeOnly
      ? fallback.filter((record) => isActiveRecord(record))
      : fallback;
  }

  const client = assertSupabaseClient();
  let query = client.from(table).select('*');

  if (activeOnly) {
    query = query.eq('status', 'active');
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []) as T[];
}

export function isUsingDemoData() {
  return !isSupabaseConfigured;
}

export function formatDate(value?: null | string) {
  if (!value) {
    return '-';
  }

  return DATE_FORMATTER.format(new Date(value));
}

export function formatMoney(quote?: null | QuoteRecord) {
  if (!quote || quote.unit_price === null) {
    return '待报价';
  }

  const currency = quote.currency === 'CNY' ? '¥' : quote.currency;
  return `${currency} ${quote.unit_price.toLocaleString('zh-CN')}`;
}

export function formatCompanyType(type: string) {
  switch (type) {
    case 'brand_owner': {
      return '品牌方';
    }
    case 'distributor': {
      return '渠道商';
    }
    case 'manufacturer': {
      return '制造商';
    }
    case 'other': {
      return '其他';
    }
    case 'supplier': {
      return '供应商';
    }
    default: {
      return type;
    }
  }
}

export function formatDocumentType(fileType: DocumentRecord['file_type']) {
  switch (fileType) {
    case 'image': {
      return '图片';
    }
    case 'other': {
      return '其他';
    }
    case 'quote': {
      return '报价附件';
    }
    case 'spec': {
      return '规格书';
    }
    case 'technical': {
      return '技术资料';
    }
  }
}

export function formatStatus(status: string) {
  switch (status) {
    case 'active': {
      return '在售';
    }
    case 'inactive': {
      return '停用';
    }
    default: {
      return status;
    }
  }
}

export function formatUpdateType(type: UpdateRecord['type']) {
  switch (type) {
    case 'notice': {
      return '通知';
    }
    case 'price_update': {
      return '报价更新';
    }
    case 'product': {
      return '产品更新';
    }
  }
}

function filterProductsLocally(
  products: ProductListItem[],
  {
    brandSlugs,
    categorySlug,
    keyword,
    maxPrice,
    minPrice,
  }: ProductListOptions = {},
) {
  const normalizedKeyword = normalizeSearchKeyword(keyword).toLowerCase();
  const hasMinPrice = typeof minPrice === 'number' && Number.isFinite(minPrice);
  const hasMaxPrice = typeof maxPrice === 'number' && Number.isFinite(maxPrice);

  let filtered = products.filter((product) => {
    if (categorySlug && product.categorySlug !== categorySlug) {
      return false;
    }

    if (brandSlugs?.length && !brandSlugs.includes(product.brandSlug || '')) {
      return false;
    }

    const productPrice = getPriceNumber(product.priceRange);
    if (hasMinPrice && productPrice < (minPrice || 0)) {
      return false;
    }

    if (hasMaxPrice && productPrice > (maxPrice || 0)) {
      return false;
    }

    if (!normalizedKeyword) {
      return true;
    }

    const haystack = [
      product.name,
      product.model,
      product.summary,
      product.brand || '',
      product.company,
      ...product.tags,
      ...product.specEntries.map((spec) => `${spec.label} ${spec.value}`),
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedKeyword);
  });
  return filtered;
}

function sortProducts(
  products: ProductListItem[],
  sortBy: ProductListOptions['sortBy'],
) {
  if (sortBy === '价格从低到高') {
    return [...products].sort(
      (left, right) =>
        getPriceNumber(left.priceRange) - getPriceNumber(right.priceRange),
    );
  }

  if (sortBy === '最新更新') {
    return [...products].sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    );
  }

  return products;
}

export async function listAllProducts(
  options: Omit<ProductListOptions, 'page' | 'pageSize'> = {},
) {
  const records = await queryProductRecords(options);
  const productIds = records.map((record) => record.id);

  if (productIds.length === 0) {
    return [] as ProductListItem[];
  }

  const [
    brands,
    categories,
    companies,
    documents,
    quotes,
    productCompanies,
  ] = await Promise.all([
    listBrands(),
    listCategories(),
    listCompanies(),
    listDocuments({ productIds }),
    listQuotes({ productIds }),
    listProductCompanies({ productIds }),
  ]);

  const mappedProducts = await Promise.all(
    records
      .toSorted((left, right) =>
        right.updated_at.localeCompare(left.updated_at),
      )
      .map((record) =>
        mapProduct(record, {
          brands,
          categories,
          companies,
          documents,
          productCompanies,
          quotes,
        }),
      ),
  );

  const filteredProducts = isSupabaseConfigured
    ? mappedProducts
    : filterProductsLocally(mappedProducts, options);

  return sortProducts(filteredProducts, options.sortBy);
}

export async function listProducts(
  options: ProductListOptions = {},
): Promise<PaginatedResult<ProductListItem>> {
  const items = await listAllProducts(options);
  return paginateItems(items, options);
}

export async function exportProductsCsv(
  options: Omit<ProductListOptions, 'page' | 'pageSize'> = {},
) {
  const items = await listAllProducts(options);
  const rows = [
    [
      '产品名称',
      '型号',
      '分类',
      '品牌',
      '关联公司',
      '公司类型',
      '价格',
      '起订量',
      '资料数量',
      '报价数量',
      '更新时间',
      '摘要',
    ],
    ...items.map((item) => [
      item.name,
      item.model,
      item.category,
      item.brand || '',
      item.company,
      item.companyType ? formatCompanyType(item.companyType) : '',
      item.priceRange,
      item.latestQuote?.min_order_quantity
        ? String(item.latestQuote.min_order_quantity)
        : '',
      String(item.documentCount),
      String(item.quoteCount),
      item.updatedAt,
      item.summary,
    ]),
  ];

  return rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(','),
    )
    .join('\n');
}

export async function listCategories() {
  const data = await queryTable<CategoryRecord>('categories', demoCategories, {
    activeOnly: true,
  });
  return data.toSorted(
    (left, right) =>
      left.sort_order - right.sort_order || left.name.localeCompare(right.name),
  );
}

export async function listBrands() {
  const data = await queryTable<BrandRecord>('brands', demoBrands, {
    activeOnly: true,
  });
  return data.toSorted((left, right) => left.name.localeCompare(right.name));
}

export async function listCompanies() {
  const data = await queryTable<CompanyRecord>('companies', demoCompanies, {
    activeOnly: true,
  });
  return data.toSorted((left, right) => left.name.localeCompare(right.name));
}

export async function listProductCompanies({
  productIds,
  productId,
}: {
  productIds?: string[];
  productId?: string;
} = {}) {
  if (!isSupabaseConfigured) {
    return demoProductCompanies.filter(
      (item) =>
        (!productId || item.product_id === productId) &&
        (!productIds?.length || productIds.includes(item.product_id)),
    );
  }

  const client = assertSupabaseClient();
  let query = client.from('product_companies').select('*');

  if (productId) {
    query = query.eq('product_id', productId);
  }

  if (productIds?.length) {
    query = query.in('product_id', productIds);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []) as ProductCompanyRecord[];
}

export async function listDocuments({
  fileType,
  productIds,
  productId,
  productModel,
}: {
  fileType?: DocumentRecord['file_type'];
  productIds?: string[];
  productId?: string;
  productModel?: string;
} = {}) {
  if (!isSupabaseConfigured) {
    return demoDocuments.filter((item) => {
      return (
        (!fileType || item.file_type === fileType) &&
        (!productId || item.product_id === productId) &&
        (!productIds?.length || (!!item.product_id && productIds.includes(item.product_id))) &&
        (!productModel || item.product_model === productModel)
      );
    });
  }

  const client = assertSupabaseClient();
  let query = client
    .from('documents')
    .select('*')
    .order('updated_at', { ascending: false });

  if (fileType) {
    query = query.eq('file_type', fileType);
  }

  if (productId) {
    query = query.eq('variant_id', productId);
  }

  if (productIds?.length) {
    query = query.in('variant_id', productIds);
  }

  if (productModel) {
    query = query.eq('product_model', productModel);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []) as DocumentRecord[];
}

export async function listQuotes({
  productIds,
  productId,
}: {
  productIds?: string[];
  productId?: string;
} = {}) {
  if (!isSupabaseConfigured) {
    return demoQuotes.filter(
      (item) =>
        isVisibleQuote(item) &&
        (!productId || item.product_id === productId) &&
        (!productIds?.length || productIds.includes(item.product_id)),
    );
  }

  return fetchRealQuotes({ productId, productIds });
}

export async function listQuoteDocuments({
  quoteIds,
}: {
  quoteIds?: string[];
} = {}) {
  if (!isSupabaseConfigured) {
    return demoQuoteDocuments.filter(
      (item) => !quoteIds?.length || quoteIds.includes(item.quote_id),
    );
  }

  if (quoteIds?.length === 0) {
    return [];
  }

  return fetchRealQuoteDocuments(quoteIds);
}

export async function listUpdates({
  keyword,
  productModel,
  quoteBatchId,
  type,
  variantId,
}: {
  keyword?: string;
  productModel?: string;
  quoteBatchId?: string;
  type?: UpdateRecord['type'];
  variantId?: string;
} = {}) {
  if (!isSupabaseConfigured) {
    const normalizedKeyword = keyword?.trim().toLowerCase();
    return demoUpdates.filter((item) => {
      if (productModel && item.product_model !== productModel) {
        return false;
      }

      if (variantId && item.variant_id !== variantId) {
        return false;
      }

      if (quoteBatchId && item.quote_batch_id !== quoteBatchId) {
        return false;
      }

      if (type && item.type !== type) {
        return false;
      }

      if (!normalizedKeyword) {
        return true;
      }

      return `${item.title} ${item.content || ''} ${item.product_model || ''}`
        .toLowerCase()
        .includes(normalizedKeyword);
    });
  }

  const client = assertSupabaseClient();
  let query = client
    .from('updates')
    .select('*')
    .order('created_at', { ascending: false });

  if (productModel) {
    query = query.eq('product_model', productModel);
  }

  if (variantId) {
    query = query.eq('variant_id', variantId);
  }

  if (quoteBatchId) {
    query = query.eq('quote_batch_id', quoteBatchId);
  }

  if (type) {
    query = query.eq('type', type);
  }

  if (keyword?.trim()) {
    const normalized = keyword.trim();
    query = query.or(
      `title.ilike.%${normalized}%,content.ilike.%${normalized}%,product_model.ilike.%${normalized}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []) as UpdateRecord[];
}

export async function getDashboardSummary() {
  const [products, categories, brands, companies, documents, quotes] =
    await Promise.all([
      listAllProducts(),
      listCategories(),
      listBrands(),
      listCompanies(),
      listDocuments(),
      listQuotes(),
    ]);

  return {
    brands: buildBrands(products, brands),
    categories: buildCategories(products, categories),
    companies,
    documentCount: documents.length,
    products,
    quoteCount: quotes.length,
  } satisfies DashboardSummary;
}

export async function getProductDetail(idOrModel: string) {
  const [products, documents, quotes, companies, productCompanies, updates] =
    await Promise.all([
      listAllProducts(),
      listDocuments(),
      listQuotes(),
      listCompanies(),
      listProductCompanies(),
      listUpdates(),
    ]);
  const product =
    products.find(
      (item) => item.id === idOrModel || item.model === idOrModel,
    ) || null;

  if (!product) {
    return null;
  }

  const productQuotes = quotes.filter(
    (item) => item.product_id === product.id && isVisibleQuote(item),
  );
  const quoteDocuments = await listQuoteDocuments({
    quoteIds: productQuotes.map((item) => item.id),
  });
  const companyIds = new Set([
    ...(product.companyId ? [product.companyId] : []),
    ...productQuotes.map((item) => item.company_id),
    ...productCompanies
      .filter((item) => item.product_id === product.id)
      .map((item) => item.company_id),
  ]);

  return {
    companies: companies.filter((item) => companyIds.has(item.id)),
    documents: documents.filter(
      (item) =>
        item.product_id === product.id ||
        item.variant_id === product.id ||
        item.product_model === product.model,
    ),
    product,
    quotes: productQuotes.map((quote) => ({
      ...quote,
      attachments: quoteDocuments
        .filter((item) => item.quote_id === quote.id)
        .map((item) =>
          documents.find((document) => document.id === item.document_id),
        )
        .filter((document): document is DocumentRecord => Boolean(document)),
    })),
    updates: updates.filter(
      (item) =>
        item.product_model === product.model ||
        item.variant_id === product.id ||
        productQuotes.some((quote) => quote.batch_id === item.quote_batch_id),
    ),
  } satisfies ProductDetailData;
}

export async function createDocumentSignedUrl(document: DocumentRecord) {
  if (!document.storage_path) {
    return document.file_url;
  }

  const client = assertSupabaseClient();
  const { data, error } = await client.storage
    .from(BUCKET)
    .createSignedUrl(document.storage_path, 60 * 10);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

async function fetchVariantIdsBySeriesIds(seriesIds: string[]) {
  if (seriesIds.length === 0) {
    return [] as string[];
  }

  const client = assertSupabaseClient();
  const { data, error } = await client
    .from('product_variants')
    .select('id')
    .eq('status', 'active')
    .in('series_id', seriesIds);

  if (error) {
    throw error;
  }

  return ((data || []) as Array<{ id: string }>).map((item) => item.id);
}

async function resolveVariantIdsForKeyword(keyword: string) {
  const normalizedKeyword = normalizeSearchKeyword(keyword);
  if (!normalizedKeyword) {
    return null;
  }

  const sanitizedKeyword = sanitizeIlikeValue(normalizedKeyword);
  if (!sanitizedKeyword) {
    return null;
  }

  const client = assertSupabaseClient();
  let variantIds = new Set<string>();

  const variantFilter = buildIlikeOrFilter(
    [
      'display_name',
      'model_code',
      'summary_config_text',
      'chipset',
      'os_name',
      'os_version',
      'material',
      'vesa_spec',
      'speaker_spec',
    ],
    sanitizedKeyword,
  );
  if (variantFilter) {
    const { data, error } = await client
      .from('product_variants')
      .select('id')
      .eq('status', 'active')
      .or(variantFilter);

    if (error) {
      throw error;
    }

    for (const item of (data || []) as Array<{ id: string }>) {
      variantIds.add(item.id);
    }
  }

  const seriesFilter = buildIlikeOrFilter(
    ['series_name', 'series_code', 'product_type', 'base_description'],
    sanitizedKeyword,
  );
  if (seriesFilter) {
    const { data, error } = await client
      .from('product_series')
      .select('id')
      .eq('status', 'active')
      .or(seriesFilter);

    if (error) {
      throw error;
    }

    const seriesVariantIds = await fetchVariantIdsBySeriesIds(
      ((data || []) as Array<{ id: string }>).map((item) => item.id),
    );
    for (const id of seriesVariantIds) {
      variantIds.add(id);
    }
  }

  const specFilter = buildIlikeOrFilter(
    ['section_key', 'section_label', 'spec_key', 'spec_label', 'spec_value_text'],
    sanitizedKeyword,
  );
  if (specFilter) {
    const { data, error } = await client
      .from('product_spec_items')
      .select('variant_id')
      .or(specFilter);

    if (error) {
      throw error;
    }

    for (const item of (data || []) as Array<{ variant_id: string }>) {
      variantIds.add(item.variant_id);
    }
  }

  const [matchedBrands, matchedCategories, matchedCompanies] = await Promise.all([
    client
      .from('brands')
      .select('id')
      .eq('status', 'active')
      .or(buildIlikeOrFilter(['name', 'slug'], sanitizedKeyword)),
    client
      .from('categories')
      .select('id')
      .eq('status', 'active')
      .or(buildIlikeOrFilter(['name', 'slug'], sanitizedKeyword)),
    client
      .from('companies')
      .select('id')
      .eq('status', 'active')
      .or(buildIlikeOrFilter(['name', 'slug', 'type'], sanitizedKeyword)),
  ]);

  if (matchedBrands.error) {
    throw matchedBrands.error;
  }

  if (matchedCategories.error) {
    throw matchedCategories.error;
  }

  if (matchedCompanies.error) {
    throw matchedCompanies.error;
  }

  const matchedBrandIds = ((matchedBrands.data || []) as Array<{ id: string }>).map(
    (item) => item.id,
  );
  const matchedCategoryIds = ((matchedCategories.data || []) as Array<{ id: string }>).map(
    (item) => item.id,
  );
  const matchedCompanyIds = ((matchedCompanies.data || []) as Array<{ id: string }>).map(
    (item) => item.id,
  );

  if (
    matchedBrandIds.length > 0 ||
    matchedCategoryIds.length > 0 ||
    matchedCompanyIds.length > 0
  ) {
    const seriesIdSet = new Set<string>();
    const seriesQueries: Array<PromiseLike<{ data: null | { id: string }[]; error: unknown }>> = [];

    if (matchedBrandIds.length > 0) {
      seriesQueries.push(
        client
          .from('product_series')
          .select('id')
          .eq('status', 'active')
          .in('brand_id', matchedBrandIds),
      );
    }

    if (matchedCategoryIds.length > 0) {
      seriesQueries.push(
        client
          .from('product_series')
          .select('id')
          .eq('status', 'active')
          .in('category_id', matchedCategoryIds),
      );
    }

    if (matchedCompanyIds.length > 0) {
      seriesQueries.push(
        client
          .from('product_series')
          .select('id')
          .eq('status', 'active')
          .in('company_id', matchedCompanyIds),
      );
    }

    const seriesResponses = await Promise.all(seriesQueries);
    for (const response of seriesResponses) {
      if (response.error) {
        throw response.error;
      }

      for (const item of (response.data || []) as Array<{ id: string }>) {
        seriesIdSet.add(item.id);
      }
    }

    const seriesVariantIds = await fetchVariantIdsBySeriesIds(
      [...seriesIdSet],
    );
    for (const id of seriesVariantIds) {
      variantIds.add(id);
    }
  }

  return variantIds;
}

async function resolveVariantIdsByCategorySlug(categorySlug: string) {
  const client = assertSupabaseClient();
  const { data: categories, error: categoryError } = await client
    .from('categories')
    .select('id')
    .eq('status', 'active')
    .eq('slug', categorySlug)
    .limit(1);

  if (categoryError) {
    throw categoryError;
  }

  const categoryId = (categories?.[0] as { id: string } | undefined)?.id;
  if (!categoryId) {
    return new Set<string>();
  }

  const { data: series, error: seriesError } = await client
    .from('product_series')
    .select('id')
    .eq('status', 'active')
    .eq('category_id', categoryId);

  if (seriesError) {
    throw seriesError;
  }

  return new Set(
    await fetchVariantIdsBySeriesIds(
      ((series || []) as Array<{ id: string }>).map((item) => item.id),
    ),
  );
}

async function resolveVariantIdsByBrandSlugs(brandSlugs: string[]) {
  if (brandSlugs.length === 0) {
    return null;
  }

  const client = assertSupabaseClient();
  const { data: brands, error: brandError } = await client
    .from('brands')
    .select('id')
    .eq('status', 'active')
    .in('slug', brandSlugs);

  if (brandError) {
    throw brandError;
  }

  const brandIds = ((brands || []) as Array<{ id: string }>).map((item) => item.id);
  if (brandIds.length === 0) {
    return new Set<string>();
  }

  const { data: series, error: seriesError } = await client
    .from('product_series')
    .select('id')
    .eq('status', 'active')
    .in('brand_id', brandIds);

  if (seriesError) {
    throw seriesError;
  }

  return new Set(
    await fetchVariantIdsBySeriesIds(
      ((series || []) as Array<{ id: string }>).map((item) => item.id),
    ),
  );
}

async function resolveVariantIdsByPriceRange({
  maxPrice,
  minPrice,
}: Pick<ProductListOptions, 'maxPrice' | 'minPrice'>) {
  const hasMinPrice = typeof minPrice === 'number' && Number.isFinite(minPrice);
  const hasMaxPrice = typeof maxPrice === 'number' && Number.isFinite(maxPrice);

  if (!hasMinPrice && !hasMaxPrice) {
    return null;
  }

  const client = assertSupabaseClient();
  let tierQuery = client.from('quote_price_tiers').select('quote_line_id');

  if (hasMinPrice) {
    tierQuery = tierQuery.gte('unit_price', minPrice || 0);
  }

  if (hasMaxPrice) {
    tierQuery = tierQuery.lte('unit_price', maxPrice || 0);
  }

  const { data: tiers, error: tierError } = await tierQuery;
  if (tierError) {
    throw tierError;
  }

  const quoteLineIds = ((tiers || []) as Array<{ quote_line_id: string }>).map(
    (item) => item.quote_line_id,
  );
  if (quoteLineIds.length === 0) {
    return new Set<string>();
  }

  const { data: lines, error: lineError } = await client
    .from('quote_lines')
    .select('id, quote_batch_id, variant_id, status')
    .in('id', quoteLineIds)
    .eq('status', 'active');

  if (lineError) {
    throw lineError;
  }

  const batchIds = [...new Set(
    ((lines || []) as Array<{ quote_batch_id: string }>).map(
      (item) => item.quote_batch_id,
    ),
  )];
  if (batchIds.length === 0) {
    return new Set<string>();
  }

  const { data: batches, error: batchError } = await client
    .from('quote_batches')
    .select('id')
    .in('id', batchIds)
    .eq('status', 'active');

  if (batchError) {
    throw batchError;
  }

  const activeBatchIds = new Set(
    ((batches || []) as Array<{ id: string }>).map((item) => item.id),
  );

  return new Set(
    ((lines || []) as Array<{
      quote_batch_id: string;
      variant_id: string;
    }>)
      .filter((item) => activeBatchIds.has(item.quote_batch_id))
      .map((item) => item.variant_id),
  );
}

async function resolveFilteredVariantIds(options: ProductListOptions) {
  let variantIds: null | Set<string> = null;

  if (options.categorySlug) {
    variantIds = intersectIds(
      variantIds,
      await resolveVariantIdsByCategorySlug(options.categorySlug),
    );
  }

  if (options.brandSlugs?.length) {
    variantIds = intersectIds(
      variantIds,
      (await resolveVariantIdsByBrandSlugs(options.brandSlugs)) || [],
    );
  }

  const keywordVariantIds = await resolveVariantIdsForKeyword(options.keyword || '');
  if (keywordVariantIds !== null) {
    variantIds = intersectIds(variantIds, keywordVariantIds);
  }

  const priceVariantIds = await resolveVariantIdsByPriceRange(options);
  if (priceVariantIds !== null) {
    variantIds = intersectIds(variantIds, priceVariantIds);
  }

  return variantIds;
}

async function queryProductRecords(options: ProductListOptions = {}) {
  if (!isSupabaseConfigured) {
    return demoProducts.filter((record) => isActiveRecord(record));
  }

  const filteredVariantIds = await resolveFilteredVariantIds(options);
  if (filteredVariantIds && filteredVariantIds.size === 0) {
    return [] as ProductRecord[];
  }

  const client = assertSupabaseClient();
  let query = client
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
    .eq('status', 'active');

  if (filteredVariantIds && filteredVariantIds.size > 0) {
    query = query.in('id', [...filteredVariantIds]);
  }

  query = query.order('updated_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return ((data || []) as Array<
    {
      specs?: Array<{
        spec_key: string;
        spec_value_number: null | number;
        spec_value_text: null | string;
        value_json: null | Record<string, unknown>;
      }>;
      series?: {
        base_description?: null | string;
        brand?: null | BrandRecord;
        brand_id?: null | string;
        category?: null | CategoryRecord;
        category_id?: null | string;
        company_id?: null | string;
        id: string;
        product_type?: null | string;
        series_code: string;
        series_name: string;
      } | null;
    } & Record<string, unknown>
  >).map((record) => {
    const series = record.series;
    const specs = record.specs || [];
    const specJson: Record<string, unknown> = {};

    for (const item of specs) {
      specJson[item.spec_key] =
        item.spec_value_text ??
        item.spec_value_number ??
        item.value_json ??
        null;
    }

    if (!specJson.summary && typeof record.summary_config_text === 'string') {
      specJson.summary = record.summary_config_text;
    }

    if (!specJson.cpu && typeof record.chipset === 'string') {
      specJson.cpu = record.chipset;
    }

    if (
      !specJson.resolution &&
      typeof record.resolution_width === 'number' &&
      typeof record.resolution_height === 'number'
    ) {
      specJson.resolution = `${record.resolution_width} x ${record.resolution_height}`;
    }

    return {
      brand_id: series?.brand_id || null,
      category: series?.category?.name || series?.product_type || '未分类',
      category_id: series?.category_id || null,
      company_id: series?.company_id || null,
      created_at: String(record.created_at),
      description: series?.base_description || null,
      id: String(record.id),
      model: String(record.model_code),
      name: String(record.display_name),
      os_name:
        typeof record.os_name === 'string' ? record.os_name : null,
      os_version:
        typeof record.os_version === 'string' ? record.os_version : null,
      product_type: series?.product_type || null,
      ram_gb:
        typeof record.ram_gb === 'number' ? record.ram_gb : null,
      resolution_height:
        typeof record.resolution_height === 'number'
          ? record.resolution_height
          : null,
      resolution_width:
        typeof record.resolution_width === 'number'
          ? record.resolution_width
          : null,
      series_code: series?.series_code || null,
      series_id: series?.id || null,
      series_name: series?.series_name || null,
      size_inch:
        typeof record.size_inch === 'number' ? record.size_inch : null,
      spec_json: specJson,
      status: String(record.status),
      storage_gb:
        typeof record.storage_gb === 'number' ? record.storage_gb : null,
      summary_config_text:
        typeof record.summary_config_text === 'string'
          ? record.summary_config_text
          : null,
      tags: extractRecordTags(specJson),
      updated_at: String(record.updated_at),
    } satisfies ProductRecord;
  });
}

async function fetchRealQuotes({
  productIds,
  productId,
}: {
  productIds?: string[];
  productId?: string;
}) {
  const client = assertSupabaseClient();
  let lineQuery = client
    .from('quote_lines')
    .select('*')
    .order('created_at', { ascending: false });

  if (productId) {
    lineQuery = lineQuery.eq('variant_id', productId);
  } else if (productIds?.length) {
    lineQuery = lineQuery.in('variant_id', productIds);
  }

  const { data: lines, error: lineError } = await lineQuery;

  if (lineError) {
    throw lineError;
  }

  const lineRows = (lines || []) as Array<{
    created_at: string;
    id: string;
    quote_batch_id: string;
    row_note: null | string;
    updated_at: string;
    variant_id: string;
  }>;

  if (lineRows.length === 0) {
    return [] as QuoteRecord[];
  }

  const { data: batches, error: batchError } = await client
    .from('quote_batches')
    .select('*')
    .in(
      'id',
      lineRows.map((item) => item.quote_batch_id),
    );

  if (batchError) {
    throw batchError;
  }

  const { data: tiers, error: tierError } = await client
    .from('quote_price_tiers')
    .select('*')
    .in(
      'quote_line_id',
      lineRows.map((item) => item.id),
    )
    .order('sort_order', { ascending: true });

  if (tierError) {
    throw tierError;
  }

  const records: QuoteRecord[] = [];
  for (const line of lineRows) {
    const batch = (batches || []).find((item) => item.id === line.quote_batch_id);
    if (!batch || batch.status !== 'active') {
      continue;
    }

    const lineTiers = ((tiers || []) as Array<{
      currency: string;
      max_quantity: null | number;
      min_quantity: number;
      quote_line_id: string;
      unit_price: number;
    }>)
      .filter((item) => item.quote_line_id === line.id)
      .sort((left, right) => left.min_quantity - right.min_quantity);
    const primaryTier = lineTiers[0] || null;

    records.push({
      batch_id: batch.id as string,
      batch_title: batch.batch_title as string,
      company_id: batch.company_id as string,
      created_at: line.created_at,
      currency: primaryTier?.currency || String(batch.currency),
      id: line.id,
      min_order_quantity: primaryTier?.min_quantity || null,
      product_id: line.variant_id,
      quote_no: (batch.batch_title as string) || null,
      quote_tiers: lineTiers,
      remarks: line.row_note || (batch.global_note as string) || null,
      status: String(batch.status),
      unit_price: primaryTier?.unit_price || null,
      updated_at: line.updated_at,
      valid_until: null,
    });
  }

  return records.filter((record) => isVisibleQuote(record));
}

async function fetchRealQuoteDocuments(quoteIds?: string[]) {
  if (!quoteIds?.length) {
    return [] as QuoteDocumentRecord[];
  }

  const client = assertSupabaseClient();
  const { data: lines, error: lineError } = await client
    .from('quote_lines')
    .select('id, quote_batch_id')
    .in('id', quoteIds);

  if (lineError) {
    throw lineError;
  }

  const batchIdByQuoteId = new Map(
    ((lines || []) as Array<{ id: string; quote_batch_id: string }>).map(
      (item) => [item.id, item.quote_batch_id],
    ),
  );
  const batchIds = [...new Set(batchIdByQuoteId.values())];

  if (batchIds.length === 0) {
    return [] as QuoteDocumentRecord[];
  }

  const { data: documents, error } = await client
    .from('documents')
    .select('id, created_at, quote_batch_id')
    .in('quote_batch_id', batchIds);

  if (error) {
    throw error;
  }

  const relations: QuoteDocumentRecord[] = [];
  for (const [quoteId, batchId] of batchIdByQuoteId.entries()) {
    for (const document of (documents || []) as Array<{
      created_at: string;
      id: string;
      quote_batch_id: string;
    }>) {
      if (document.quote_batch_id === batchId) {
        relations.push({
          created_at: document.created_at,
          document_id: document.id,
          quote_id: quoteId,
        });
      }
    }
  }

  return relations;
}

function extractRecordTags(specJson: Record<string, unknown>) {
  const tags = new Set<string>();
  for (const key of ['cpu', 'os', 'poe', 'summary']) {
    const value = specJson[key];
    if (typeof value === 'string' && value.trim()) {
      tags.add(value.trim());
    }
  }
  return [...tags].slice(0, 6);
}
