import { isSupabaseConfigured, supabase } from '#/lib/supabase';

export interface ProductRecord {
  category: string;
  created_at: string;
  id: string;
  model: string;
  name: string;
  spec_json: Record<string, unknown>;
  status: string;
  tags: string[];
  updated_at: string;
}

export interface DocumentRecord {
  category: string;
  created_at: string;
  created_by: null | string;
  file_type: 'image' | 'other' | 'quote' | 'spec' | 'technical';
  file_url: string;
  id: string;
  product_model: null | string;
  storage_path: null | string;
  tags: string[];
  title: string;
  updated_at: string;
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
  category: string;
  id: string;
  model: string;
  name: string;
  specEntries: SpecEntry[];
  status: string;
  summary: string;
  tags: string[];
  updatedAt: string;
}

export interface CategorySummary {
  count: number;
  latestUpdatedAt: string;
  latestUpdatedAtLabel: string;
  name: string;
  sampleModels: string[];
}

export interface DashboardSummary {
  categories: CategorySummary[];
  documentCount: number;
  latestQuotes: DocumentRecord[];
  latestUpdates: UpdateRecord[];
  products: ProductListItem[];
  quoteCount: number;
  updateCount: number;
}

export interface ProductDetailData {
  documents: DocumentRecord[];
  product: ProductListItem;
  updates: UpdateRecord[];
}

const BUCKET = 'product-documents';
const DATE_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function assertSupabaseClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      'Supabase 尚未配置，请先设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。',
    );
  }

  return supabase;
}

function keyToLabel(key: string) {
  return key
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (value) => value.toUpperCase());
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

function isFlatSpecValue(value: unknown) {
  return (
    Array.isArray(value) ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'string'
  );
}

function normalizeSpecEntries(specJson: Record<string, unknown>) {
  return Object.entries(specJson)
    .filter(
      ([key, value]) =>
        !['description', 'summary'].includes(key) && isFlatSpecValue(value),
    )
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
      : typeof record.spec_json.description === 'string'
        ? record.spec_json.description
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

function mapProduct(record: ProductRecord): ProductListItem {
  const specEntries = normalizeSpecEntries(record.spec_json || {});

  return {
    category: record.category,
    id: record.id,
    model: record.model,
    name: record.name,
    specEntries,
    status: record.status,
    summary: buildProductSummary(record, specEntries),
    tags: record.tags || [],
    updatedAt: record.updated_at,
  };
}

function buildCategories(products: ProductListItem[]) {
  const grouped = new Map<string, ProductListItem[]>();

  for (const product of products) {
    const group = grouped.get(product.category) || [];
    group.push(product);
    grouped.set(product.category, group);
  }

  return [...grouped.entries()]
    .map(([name, items]) => {
      const sortedItems = [...items].sort((left, right) =>
        right.updatedAt.localeCompare(left.updatedAt),
      );
      const latestUpdatedAt = sortedItems[0]?.updatedAt || '';

      return {
        count: items.length,
        latestUpdatedAt,
        latestUpdatedAtLabel: formatDate(latestUpdatedAt),
        name,
        sampleModels: sortedItems.slice(0, 3).map((item) => item.model),
      } satisfies CategorySummary;
    })
    .sort((left, right) => right.count - left.count);
}

export function formatDate(value?: null | string) {
  if (!value) {
    return '-';
  }

  return DATE_FORMATTER.format(new Date(value));
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
      return '报价';
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
      return '启用';
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
  const client = assertSupabaseClient();
  const { data, error } = await client
    .from('products')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return ((data || []) as ProductRecord[]).map(mapProduct);
}

export async function listDocuments({
  fileType,
  productModel,
}: {
  fileType?: DocumentRecord['file_type'];
  productModel?: string;
} = {}) {
  const client = assertSupabaseClient();
  let query = client
    .from('documents')
    .select('*')
    .order('updated_at', { ascending: false });

  if (fileType) {
    query = query.eq('file_type', fileType);
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

export async function listUpdates({
  productModel,
}: {
  productModel?: string;
} = {}) {
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
  const [products, documents, updates] = await Promise.all([
    listProducts(),
    listDocuments(),
    listUpdates(),
  ]);

  const latestQuotes = documents.filter((item) => item.file_type === 'quote');

  return {
    categories: buildCategories(products),
    documentCount: documents.length,
    latestQuotes: latestQuotes.slice(0, 5),
    latestUpdates: updates.slice(0, 5),
    products,
    quoteCount: latestQuotes.length,
    updateCount: updates.length,
  } satisfies DashboardSummary;
}

export async function getProductDetail(model: string) {
  const client = assertSupabaseClient();
  const { data, error } = await client
    .from('products')
    .select('*')
    .eq('model', model)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const [documents, updates] = await Promise.all([
    listDocuments({ productModel: model }),
    listUpdates({ productModel: model }),
  ]);

  return {
    documents,
    product: mapProduct(data as ProductRecord),
    updates,
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
