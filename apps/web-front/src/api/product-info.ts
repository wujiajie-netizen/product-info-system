import { isSupabaseConfigured, supabase } from '#/lib/supabase';

export interface ProductRecord {
  brand_id?: null | string;
  category: string;
  category_id?: null | string;
  created_at: string;
  description?: null | string;
  id: string;
  model: string;
  name: string;
  spec_json: Record<string, unknown>;
  status: string;
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
  file_type: 'image' | 'other' | 'quote' | 'spec' | 'technical';
  file_url: string;
  id: string;
  product_id?: null | string;
  product_model: null | string;
  storage_path: null | string;
  tags: string[];
  title: string;
  updated_at: string;
}

export interface QuoteRecord {
  company_id: string;
  created_at: string;
  currency: string;
  id: string;
  min_order_quantity: null | number;
  product_id: string;
  quote_no: null | string;
  remarks: null | string;
  status: string;
  unit_price: null | number;
  updated_at: string;
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
  title: string;
  type: 'notice' | 'price_update' | 'product';
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
  companyCount: number;
  documentCount: number;
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
}

const BUCKET = 'product-documents';
const DATE_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const demoCategories: CategoryRecord[] = [
  {
    description: '显示器、触控屏、一体机等显示类产品',
    id: 'cat-display',
    name: 'LCD 显示器',
    parent_id: null,
    slug: 'display',
    sort_order: 10,
    status: 'active',
  },
  {
    description: '平板电脑、三防平板和消费平板',
    id: 'cat-tablet',
    name: '安卓平板',
    parent_id: null,
    slug: 'tablet',
    sort_order: 20,
    status: 'active',
  },
  {
    description: '无人机电池、图传模块、云台相机',
    id: 'cat-drone',
    name: '无人机配件',
    parent_id: null,
    slug: 'drone-parts',
    sort_order: 30,
    status: 'active',
  },
  {
    description: '工业主板、通信模组、传感器等元器件',
    id: 'cat-components',
    name: '工业元件',
    parent_id: null,
    slug: 'components',
    sort_order: 40,
    status: 'active',
  },
];

const demoBrands: BrandRecord[] = [
  {
    aliases: ['AOC'],
    description: null,
    id: 'brand-aoc',
    name: 'AOC',
    slug: 'aoc',
    status: 'active',
  },
  {
    aliases: ['ASUS'],
    description: null,
    id: 'brand-asus',
    name: 'ASUS',
    slug: 'asus',
    status: 'active',
  },
  {
    aliases: ['DJI'],
    description: null,
    id: 'brand-dji',
    name: 'DJI',
    slug: 'dji',
    status: 'active',
  },
  {
    aliases: ['Lenovo'],
    description: null,
    id: 'brand-lenovo',
    name: 'Lenovo',
    slug: 'lenovo',
    status: 'active',
  },
  {
    aliases: ['ViewTech'],
    description: null,
    id: 'brand-viewtech',
    name: 'ViewTech',
    slug: 'viewtech',
    status: 'active',
  },
  {
    aliases: ['STM'],
    description: null,
    id: 'brand-stm',
    name: 'STMicroelectronics',
    slug: 'stm',
    status: 'active',
  },
];

const demoCompanies: CompanyRecord[] = [
  {
    description: '显示器与工业屏供应商',
    id: 'co-view',
    name: '深圳视界科技有限公司',
    slug: 'view-sz',
    status: 'active',
    type: 'supplier',
  },
  {
    description: '平板整机制造商',
    id: 'co-huawei',
    name: '华硕电脑(上海)有限公司',
    slug: 'asus-sh',
    status: 'active',
    type: 'manufacturer',
  },
  {
    description: '无人机与配件代理商',
    id: 'co-drone',
    name: '大疆创新科技有限公司',
    slug: 'dji',
    status: 'active',
    type: 'brand_owner',
  },
  {
    description: '工业元器件报价来源',
    id: 'co-chip',
    name: '意法半导体渠道中心',
    slug: 'stm-channel',
    status: 'active',
    type: 'distributor',
  },
];

const now = '2026-05-03T10:00:00.000Z';

const demoProductCompanies: ProductCompanyRecord[] = [
  createDemoProductCompany('prod-27u4k', 'co-view', 'supplier'),
  createDemoProductCompany('prod-27u4k', 'co-huawei', 'manufacturer'),
  createDemoProductCompany('prod-vg32', 'co-huawei', 'manufacturer'),
  createDemoProductCompany('prod-p30', 'co-huawei', 'manufacturer'),
  createDemoProductCompany('prod-tb60', 'co-drone', 'brand_owner'),
  createDemoProductCompany('prod-stm32', 'co-chip', 'distributor'),
];

const demoProducts: ProductRecord[] = [
  {
    brand_id: 'brand-viewtech',
    category: 'LCD 显示器',
    category_id: 'cat-display',
    created_at: now,
    description: '4K 工业与商显场景通用型号，资料齐全，近期有报价更新。',
    id: 'prod-27u4k',
    model: '27U4K-X1',
    name: '27 英寸 4K LCD 显示器',
    spec_json: {
      brightness: '350 cd/m2',
      interface: 'HDMI x 2, DP x 1',
      panel: 'IPS',
      refresh_rate: '60Hz',
      resolution: '3840 x 2160',
      screen_size: '27 英寸',
      summary: '27 英寸、3840x2160、IPS 面板、60Hz、99% sRGB',
    },
    status: 'active',
    tags: ['IPS', '4K', '低蓝光', 'HDR10'],
    updated_at: '2026-05-02T09:20:00.000Z',
  },
  {
    brand_id: 'brand-asus',
    category: 'LCD 显示器',
    category_id: 'cat-display',
    created_at: now,
    description: '电竞显示器，适合高刷新率报价对比。',
    id: 'prod-vg32',
    model: 'VG32VQ',
    name: '32 英寸电竞显示器',
    spec_json: {
      panel: 'VA',
      refresh_rate: '165Hz',
      resolution: '2560 x 1440',
      response_time: '1ms',
      screen_size: '32 英寸',
      summary: '32 英寸、2K、曲面、165Hz、HDR10',
    },
    status: 'active',
    tags: ['2K', '曲面', '165Hz'],
    updated_at: '2026-05-01T08:30:00.000Z',
  },
  {
    brand_id: 'brand-lenovo',
    category: '安卓平板',
    category_id: 'cat-tablet',
    created_at: now,
    description: '企业移动展业与资料演示常用平板。',
    id: 'prod-p30',
    model: 'P30 Pro',
    name: '安卓平板 P30 Pro',
    spec_json: {
      battery: '8000mAh',
      memory: '8GB+256GB',
      os: 'Android 13',
      resolution: '2K',
      screen_size: '11.0 英寸',
      summary: '11.0 英寸、Android 13、8GB+256GB、8000mAh',
    },
    status: 'active',
    tags: ['Android 13', 'Wi-Fi', '高亮屏'],
    updated_at: '2026-04-30T14:00:00.000Z',
  },
  {
    brand_id: 'brand-dji',
    category: '无人机配件',
    category_id: 'cat-drone',
    created_at: now,
    description: '长续航电池模组，关联认证与测试报告。',
    id: 'prod-tb60',
    model: 'TB60 6S',
    name: '无人机电池模组',
    spec_json: {
      capacity: '5935mAh',
      cell_type: 'LiPo 6S',
      energy: '135Wh',
      voltage: '22.8V',
      summary: '22.8V、5935mAh、LiPo 6S、智能电池',
    },
    status: 'active',
    tags: ['大容量', '智能电芯', '高能量'],
    updated_at: '2026-04-28T12:00:00.000Z',
  },
  {
    brand_id: 'brand-stm',
    category: '工业元件',
    category_id: 'cat-components',
    created_at: now,
    description: '工业控制 MCU，适合报价与规格资料演示。',
    id: 'prod-stm32',
    model: 'STM32F103C8T6',
    name: '32 位微控制器 MCU',
    spec_json: {
      flash: '64KB',
      package: 'LQFP-48',
      ram: '20KB',
      speed: '72MHz',
      voltage: '2.0V - 3.6V',
      summary: '72MHz、64KB Flash、20KB RAM、LQFP-48',
    },
    status: 'active',
    tags: ['MCU', '32位', 'Cortex-M3'],
    updated_at: '2026-04-27T10:40:00.000Z',
  },
];

const demoDocuments: DocumentRecord[] = [
  createDemoImageDocument(
    'doc-27-image',
    '27U4K-X1 产品图片',
    'prod-27u4k',
    '27U4K-X1',
    'LCD',
  ),
  createDemoDocument(
    'doc-27-spec',
    '27U4K-X1 规格书',
    'prod-27u4k',
    '27U4K-X1',
    'spec',
    '规格书',
  ),
  createDemoDocument(
    'doc-27-manual',
    '27U4K-X1 用户手册',
    'prod-27u4k',
    '27U4K-X1',
    'technical',
    '用户手册',
  ),
  createDemoDocument(
    'doc-27-quote',
    '27U4K-X1 报价单',
    'prod-27u4k',
    '27U4K-X1',
    'quote',
    '报价单',
  ),
  createDemoImageDocument(
    'doc-vg32-image',
    'VG32VQ 产品图片',
    'prod-vg32',
    'VG32VQ',
    'Display',
  ),
  createDemoImageDocument(
    'doc-p30-image',
    'P30 Pro 产品图片',
    'prod-p30',
    'P30 Pro',
    'Tablet',
  ),
  createDemoDocument(
    'doc-p30-cert',
    'P30 Pro 认证资料',
    'prod-p30',
    'P30 Pro',
    'technical',
    '认证资料',
  ),
  createDemoImageDocument(
    'doc-tb60-image',
    'TB60 6S 产品图片',
    'prod-tb60',
    'TB60',
    'Battery',
  ),
  createDemoDocument(
    'doc-tb60-test',
    'TB60 6S 测试报告',
    'prod-tb60',
    'TB60 6S',
    'spec',
    '测试报告',
  ),
  createDemoImageDocument(
    'doc-stm-image',
    'STM32F103C8T6 产品图片',
    'prod-stm32',
    'STM32F103C8T6',
    'MCU',
  ),
  createDemoDocument(
    'doc-stm-data',
    'STM32F103x8 Datasheet',
    'prod-stm32',
    'STM32F103C8T6',
    'spec',
    '数据手册',
  ),
];

const demoQuotes: QuoteRecord[] = [
  createDemoQuote('quote-27-a', 'prod-27u4k', 'co-view', 680, '2026-06-30'),
  createDemoQuote('quote-27-b', 'prod-27u4k', 'co-huawei', 920, '2026-06-15'),
  createDemoQuote('quote-p30', 'prod-p30', 'co-huawei', 1299, '2026-05-30'),
  createDemoQuote('quote-tb60', 'prod-tb60', 'co-drone', 469, '2026-05-28'),
  createDemoQuote('quote-stm', 'prod-stm32', 'co-chip', 8.35, '2026-05-31'),
];

const demoQuoteDocuments: QuoteDocumentRecord[] = [
  createDemoQuoteDocument('quote-27-a', 'doc-27-quote'),
];

const demoUpdates: UpdateRecord[] = [
  {
    content: '27U4K-X1 规格书 Rev. B 已上传。',
    created_at: '2026-05-02T09:20:00.000Z',
    created_by: null,
    id: 'update-doc-27',
    new_value: null,
    old_value: null,
    product_model: '27U4K-X1',
    title: '资料更新：27U4K-X1 规格书',
    type: 'product',
  },
  {
    content: 'STM32F103C8T6 新报价已生效。',
    created_at: '2026-05-01T10:20:00.000Z',
    created_by: null,
    id: 'update-quote-stm',
    new_value: 'CNY 8.35',
    old_value: null,
    product_model: 'STM32F103C8T6',
    title: '报价更新：STM32F103C8T6',
    type: 'price_update',
  },
];

function createDemoDocument(
  id: string,
  title: string,
  productId: string,
  productModel: string,
  fileType: DocumentRecord['file_type'],
  category: string,
): DocumentRecord {
  return {
    category,
    created_at: now,
    created_by: null,
    file_type: fileType,
    file_url: '#',
    id,
    product_id: productId,
    product_model: productModel,
    storage_path: null,
    tags: [category],
    title,
    updated_at: '2026-05-01T09:00:00.000Z',
  };
}

function createDemoImageDocument(
  id: string,
  title: string,
  productId: string,
  productModel: string,
  label: string,
): DocumentRecord {
  return {
    ...createDemoDocument(
      id,
      title,
      productId,
      productModel,
      'image',
      '产品图片',
    ),
    file_url: `https://placehold.co/480x360/eaf2ff/1766c5?text=${encodeURIComponent(label)}`,
  };
}

function createDemoProductCompany(
  productId: string,
  companyId: string,
  relationshipType: string,
): ProductCompanyRecord {
  return {
    company_id: companyId,
    created_at: now,
    notes: null,
    product_id: productId,
    relationship_type: relationshipType,
  };
}

function createDemoQuote(
  id: string,
  productId: string,
  companyId: string,
  unitPrice: number,
  validUntil: string,
): QuoteRecord {
  return {
    company_id: companyId,
    created_at: now,
    currency: 'CNY',
    id,
    min_order_quantity: 10,
    product_id: productId,
    quote_no: id.toUpperCase(),
    remarks: '现货 / 1-2 周',
    status: 'active',
    unit_price: unitPrice,
    updated_at: now,
    valid_until: validUntil,
  };
}

function createDemoQuoteDocument(
  quoteId: string,
  documentId: string,
): QuoteDocumentRecord {
  return {
    created_at: now,
    document_id: documentId,
    quote_id: quoteId,
  };
}

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
      : typeof record.description === 'string'
        ? record.description
        : '';

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

  return {
    brand: brand?.name || null,
    brandId: record.brand_id || null,
    brandSlug: brand?.slug || null,
    category: record.category,
    categoryId: record.category_id || null,
    categorySlug: categoryRecord?.slug || null,
    company: primaryCompany?.name || '未关联公司',
    companyCount: linkedCompanies.length,
    documentCount: productDocuments.filter((item) => item.file_type !== 'image')
      .length,
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
    const sortedItems = [...items].sort((left, right) =>
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

  return summaries.sort((left, right) => right.count - left.count);
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
    .sort(
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
    return activeOnly ? fallback.filter(isActiveRecord) : fallback;
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
    case 'supplier': {
      return '供应商';
    }
    case 'other': {
      return '其他';
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

export async function listProducts() {
  const [
    records,
    brands,
    categories,
    companies,
    documents,
    quotes,
    productCompanies,
  ] = await Promise.all([
    queryTable<ProductRecord>('products', demoProducts, { activeOnly: true }),
    listBrands(),
    listCategories(),
    listCompanies(),
    listDocuments(),
    listQuotes(),
    listProductCompanies(),
  ]);

  return Promise.all(
    records
      .sort((left, right) => right.updated_at.localeCompare(left.updated_at))
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
}

export async function listCategories() {
  const data = await queryTable<CategoryRecord>('categories', demoCategories, {
    activeOnly: true,
  });
  return data.sort(
    (left, right) =>
      left.sort_order - right.sort_order || left.name.localeCompare(right.name),
  );
}

export async function listBrands() {
  const data = await queryTable<BrandRecord>('brands', demoBrands, {
    activeOnly: true,
  });
  return data.sort((left, right) => left.name.localeCompare(right.name));
}

export async function listCompanies() {
  const data = await queryTable<CompanyRecord>('companies', demoCompanies, {
    activeOnly: true,
  });
  return data.sort((left, right) => left.name.localeCompare(right.name));
}

export async function listProductCompanies({
  productId,
}: {
  productId?: string;
} = {}) {
  if (!isSupabaseConfigured) {
    return demoProductCompanies.filter(
      (item) => !productId || item.product_id === productId,
    );
  }

  const client = assertSupabaseClient();
  let query = client.from('product_companies').select('*');

  if (productId) {
    query = query.eq('product_id', productId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []) as ProductCompanyRecord[];
}

export async function listDocuments({
  fileType,
  productId,
  productModel,
}: {
  fileType?: DocumentRecord['file_type'];
  productId?: string;
  productModel?: string;
} = {}) {
  if (!isSupabaseConfigured) {
    return demoDocuments.filter((item) => {
      return (
        (!fileType || item.file_type === fileType) &&
        (!productId || item.product_id === productId) &&
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
    query = query.eq('product_id', productId);
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
  productId,
}: {
  productId?: string;
} = {}) {
  if (!isSupabaseConfigured) {
    return demoQuotes.filter(
      (item) =>
        isVisibleQuote(item) && (!productId || item.product_id === productId),
    );
  }

  const client = assertSupabaseClient();
  let query = client
    .from('quotes')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (productId) {
    query = query.eq('product_id', productId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return ((data || []) as QuoteRecord[]).filter(isVisibleQuote);
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

  const client = assertSupabaseClient();
  let query = client.from('quote_documents').select('*');

  if (quoteIds?.length) {
    query = query.in('quote_id', quoteIds);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []) as QuoteDocumentRecord[];
}

export async function listUpdates({
  productModel,
}: {
  productModel?: string;
} = {}) {
  if (!isSupabaseConfigured) {
    return demoUpdates.filter(
      (item) => !productModel || item.product_model === productModel,
    );
  }

  const client = assertSupabaseClient();
  let query = client
    .from('updates')
    .select('*')
    .order('created_at', { ascending: false });

  if (productModel) {
    query = query.eq('product_model', productModel);
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
      listProducts(),
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
  const [products, documents, quotes, companies, productCompanies] =
    await Promise.all([
      listProducts(),
      listDocuments(),
      listQuotes(),
      listCompanies(),
      listProductCompanies(),
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
    ...productQuotes.map((item) => item.company_id),
    ...productCompanies
      .filter((item) => item.product_id === product.id)
      .map((item) => item.company_id),
  ]);

  return {
    companies: companies.filter((item) => companyIds.has(item.id)),
    documents: documents.filter(
      (item) =>
        item.product_id === product.id || item.product_model === product.model,
    ),
    product,
    quotes: productQuotes.map((quote) => ({
      ...quote,
      attachments: quoteDocuments
        .filter((item) => item.quote_id === quote.id)
        .map((item) =>
          documents.find((document) => document.id === item.document_id),
        )
        .filter((item): item is DocumentRecord => Boolean(item)),
    })),
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
