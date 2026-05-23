import type {
  DocumentKind,
  DocumentRecord,
  ProductRecord,
  QuoteWithRelations,
  UpdateRecord,
} from './types';

import { listBrands } from './brands';
import { listCategories } from './categories';
import { listCompanies } from './companies';
import { listDocuments } from './documents';
import { listProducts } from './products';
import { listQuotes } from './quotes';
import { listUpdates } from './updates';

export interface AdminDashboardMetric {
  title: string;
  totalTitle: string;
  totalValue: number;
  value: number;
}

export interface AdminDashboardTrendSeries {
  color: string;
  data: number[];
  name: string;
}

export interface AdminDashboardTrendTab {
  categories: string[];
  label: string;
  series: AdminDashboardTrendSeries[];
  value: string;
}

export interface AdminDashboardDistributionItem {
  name: string;
  value: number;
}

export interface AdminDashboardLatestUpdate {
  createdAt: string;
  id: string;
  productModel: null | string;
  referenceLabel: string;
  title: string;
  type: UpdateRecord['type'];
  typeLabel: string;
}

export interface AdminDashboardPendingVariant {
  category: string;
  missingImage: boolean;
  missingQuote: boolean;
  missingSpec: boolean;
  model: string;
  seriesName: string;
  updatedAt: string;
  variantId: string;
}

export interface AdminDashboardData {
  categoryCoverage: AdminDashboardDistributionItem[];
  documentKindDistribution: AdminDashboardDistributionItem[];
  latestUpdates: AdminDashboardLatestUpdate[];
  overview: {
    activeModels: AdminDashboardMetric;
    activeQuotes: AdminDashboardMetric;
    documents: AdminDashboardMetric;
    pendingModels: AdminDashboardMetric;
  };
  pendingVariants: AdminDashboardPendingVariant[];
  quoteCompanyDistribution: AdminDashboardDistributionItem[];
  trendTabs: AdminDashboardTrendTab[];
}

const DAY_WINDOW = 30;
const DOCUMENT_KIND_LABELS: Partial<Record<DocumentKind, string>> = {
  certificate: '认证文件',
  drawing: '图纸',
  manual: '说明书',
  other: '其他资料',
  product_image: '产品图片',
  quote_workbook: '报价附件',
  spec_sheet: '规格书',
  technical: '技术文件',
};
const UPDATE_TYPE_LABELS: Record<UpdateRecord['type'], string> = {
  notice: '内部通知',
  price_update: '价格更新',
  product: '产品动态',
};
const CHART_COLORS = ['#5ab1ef', '#019680', '#f59e0b', '#8b5cf6', '#f87171'] as const;

export async function getAdminDashboard() {
  const [products, brands, categories, companies, documents, quotes, updates] =
    await Promise.all([
      listProducts(),
      listBrands({ status: 'active' }),
      listCategories({ status: 'active' }),
      listCompanies({ status: 'active' }),
      listDocuments(),
      listQuotes({ status: 'active' }),
      listUpdates(),
    ]);

  const activeBrandIds = new Set(brands.map((item) => item.id));
  const activeCategoryIds = new Set(categories.map((item) => item.id));
  const activeCompanyIds = new Set(companies.map((item) => item.id));

  const activeProducts = products.filter((product) =>
    isProductEnabled(product, {
      activeBrandIds,
      activeCategoryIds,
      activeCompanyIds,
    }),
  );
  const activeProductIds = new Set(activeProducts.map((item) => item.id));
  const activeSeriesIds = new Set(
    activeProducts
      .map((item) => item.series_id)
      .filter((item): item is string => Boolean(item)),
  );
  const activeProductModels = new Set(activeProducts.map((item) => item.model));

  const activeQuotes = quotes.filter(
    (quote) =>
      activeProductIds.has(quote.product_id) &&
      (!quote.company_id || activeCompanyIds.has(quote.company_id)),
  );
  const quoteBatchSnapshots = dedupeQuoteBatches(activeQuotes);
  const activeQuoteBatchIds = new Set(quoteBatchSnapshots.map((item) => item.id));

  const relevantDocuments = documents.filter((document) =>
    isDocumentRelevant(document, {
      activeCompanyIds,
      activeProductIds,
      activeProductModels,
      activeQuoteBatchIds,
      activeSeriesIds,
    }),
  );
  const relevantUpdates = updates.filter((update) =>
    isUpdateRelevant(update, {
      activeProductIds,
      activeProductModels,
      activeQuoteBatchIds,
      activeSeriesIds,
    }),
  );

  const pendingVariants = buildPendingVariants(activeProducts, relevantDocuments, activeQuotes);
  const completeVariantCount = activeProducts.length - pendingVariants.length;
  const completionRate =
    activeProducts.length === 0
      ? 0
      : Math.round((completeVariantCount / activeProducts.length) * 100);

  return {
    categoryCoverage: buildCategoryCoverage(activeProducts, categories),
    documentKindDistribution: buildDocumentKindDistribution(relevantDocuments),
    latestUpdates: buildLatestUpdates(relevantUpdates, quoteBatchSnapshots),
    overview: {
      activeModels: {
        title: '在库型号',
        totalTitle: '全部型号',
        totalValue: products.length,
        value: activeProducts.length,
      },
      activeQuotes: {
        title: '有效报价',
        totalTitle: '有效批次',
        totalValue: quoteBatchSnapshots.length,
        value: activeQuotes.length,
      },
      documents: {
        title: '资料总量',
        totalTitle: '近7天新增',
        totalValue: countRecentItems(relevantDocuments, 7, (item) => item.created_at),
        value: relevantDocuments.length,
      },
      pendingModels: {
        title: '待完善型号',
        totalTitle: '完整率(%)',
        totalValue: completionRate,
        value: pendingVariants.length,
      },
    },
    pendingVariants: pendingVariants.slice(0, 10),
    quoteCompanyDistribution: buildQuoteCompanyDistribution(activeQuotes, companies),
    trendTabs: buildTrendTabs(relevantDocuments, quoteBatchSnapshots, relevantUpdates),
  } satisfies AdminDashboardData;
}

export async function getDashboardSummary() {
  const [dashboard, updates] = await Promise.all([getAdminDashboard(), listUpdates()]);

  return {
    documentCount: dashboard.overview.documents.value,
    latestUpdates: dashboard.latestUpdates.map((item) => ({
      created_at: item.createdAt,
      id: item.id,
      product_model: item.productModel,
      title: item.title,
      type: item.type,
    })) as UpdateRecord[],
    pendingDocumentCount: dashboard.overview.pendingModels.value,
    productCount: dashboard.overview.activeModels.value,
    quoteCount: dashboard.overview.activeQuotes.value,
    weekUpdateCount: countRecentItems(updates, 7, (item) => item.created_at),
  };
}

function buildCategoryCoverage(
  products: ProductRecord[],
  categories: Awaited<ReturnType<typeof listCategories>>,
) {
  const countMap = new Map<string, number>();

  for (const category of categories) {
    countMap.set(category.name, 0);
  }

  for (const product of products) {
    const categoryName = product.category || '未分类';
    countMap.set(categoryName, (countMap.get(categoryName) || 0) + 1);
  }

  return [...countMap.entries()]
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0 || item.name === '未分类')
    .toSorted(
      (left, right) => right.value - left.value || left.name.localeCompare(right.name),
    );
}

function buildDocumentKindDistribution(documents: DocumentRecord[]) {
  const countMap = new Map<string, number>();

  for (const document of documents) {
    const kindKey = document.document_kind as DocumentKind | null | undefined;
    const name =
      (kindKey && DOCUMENT_KIND_LABELS[kindKey]) ||
      (document.document_kind ? String(document.document_kind) : '未分类资料');
    countMap.set(name, (countMap.get(name) || 0) + 1);
  }

  return [...countMap.entries()]
    .map(([name, value]) => ({ name, value }))
    .toSorted(
      (left, right) => right.value - left.value || left.name.localeCompare(right.name),
    );
}

function buildLatestUpdates(
  updates: UpdateRecord[],
  quoteBatchSnapshots: QuoteBatchSnapshot[],
) {
  const quoteBatchMap = new Map(quoteBatchSnapshots.map((item) => [item.id, item]));

  return updates.slice(0, 5).map((update) => {
    const batch = update.quote_batch_id ? quoteBatchMap.get(update.quote_batch_id) : null;
    const referenceParts = [
      update.product_model,
      batch?.title || null,
      batch?.companyName || null,
    ].filter((item): item is string => Boolean(item));

    return {
      createdAt: update.created_at,
      id: update.id,
      productModel: update.product_model,
      referenceLabel: referenceParts.join(' / ') || '全局动态',
      title: update.title,
      type: update.type,
      typeLabel: UPDATE_TYPE_LABELS[update.type],
    } satisfies AdminDashboardLatestUpdate;
  });
}

function buildPendingVariants(
  products: ProductRecord[],
  documents: DocumentRecord[],
  quotes: QuoteWithRelations[],
) {
  const quoteProductIds = new Set(quotes.map((item) => item.product_id));

  return products
    .map((product) => {
      const relatedDocuments = documents.filter(
        (document) =>
          document.variant_id === product.id ||
          document.product_id === product.id ||
          document.product_model === product.model ||
          (product.series_id && document.series_id === product.series_id),
      );
      const missingImage = !relatedDocuments.some(isImageDocument);
      const missingSpec = !relatedDocuments.some(isSpecDocument);
      const missingQuote = !quoteProductIds.has(product.id);

      return {
        category: product.category || '未分类',
        missingImage,
        missingQuote,
        missingSpec,
        model: product.model,
        seriesName: product.series_name || product.name,
        updatedAt: product.updated_at,
        variantId: product.id,
      } satisfies AdminDashboardPendingVariant;
    })
    .filter((item) => item.missingImage || item.missingQuote || item.missingSpec)
    .toSorted((left, right) => {
      const missingDiff = getMissingCount(right) - getMissingCount(left);
      if (missingDiff !== 0) {
        return missingDiff;
      }

      return right.updatedAt.localeCompare(left.updatedAt);
    });
}

function buildQuoteCompanyDistribution(
  quotes: QuoteWithRelations[],
  companies: Awaited<ReturnType<typeof listCompanies>>,
) {
  const companyMap = new Map(companies.map((item) => [item.id, item.name]));
  const countMap = new Map<string, number>();

  for (const quote of quotes) {
    const name = quote.company?.name || companyMap.get(quote.company_id) || '未关联公司';
    countMap.set(name, (countMap.get(name) || 0) + 1);
  }

  return [...countMap.entries()]
    .map(([name, value]) => ({ name, value }))
    .toSorted(
      (left, right) => right.value - left.value || left.name.localeCompare(right.name),
    );
}

function buildTrendTabs(
  documents: DocumentRecord[],
  quoteBatches: QuoteBatchSnapshot[],
  updates: UpdateRecord[],
) {
  const { buckets, categories } = createDateBuckets(DAY_WINDOW);

  for (const update of updates) {
    const dateKey = toDateKey(update.created_at);
    const bucket = buckets.get(dateKey);
    if (!bucket) {
      continue;
    }

    bucket[update.type] = (bucket[update.type] || 0) + 1;
  }

  const businessSeries = [
    {
      color: getChartColor(0),
      data: fillSeriesByDate(categories, documents, (item) => item.created_at),
      name: '资料新增',
    },
    {
      color: getChartColor(1),
      data: fillSeriesByDate(categories, quoteBatches, (item) => item.trendAt),
      name: '报价批次',
    },
    {
      color: getChartColor(2),
      data: fillSeriesByDate(categories, updates, (item) => item.created_at),
      name: '动态新增',
    },
  ] satisfies AdminDashboardTrendSeries[];

  const updateSeries = (['product', 'price_update', 'notice'] as const).map(
    (type, index) => ({
      color: getChartColor(index),
      data: categories.map((dateKey) => buckets.get(dateKey)?.[type] || 0),
      name: UPDATE_TYPE_LABELS[type],
    }),
  );

  return [
    {
      categories: categories.map(formatDateLabel),
      label: '业务新增趋势',
      series: businessSeries,
      value: 'business',
    },
    {
      categories: categories.map(formatDateLabel),
      label: '动态类型趋势',
      series: updateSeries,
      value: 'updates',
    },
  ] satisfies AdminDashboardTrendTab[];
}

function countRecentItems<T>(
  items: T[],
  dayCount: number,
  getValue: (item: T) => null | string,
) {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - (dayCount - 1));
  threshold.setHours(0, 0, 0, 0);

  return items.filter((item) => {
    const value = getValue(item);
    return typeof value === 'string' && new Date(value) >= threshold;
  }).length;
}

function createDateBuckets(dayCount: number) {
  const buckets = new Map<
    string,
    Partial<Record<UpdateRecord['type'], number>>
  >();
  const categories: string[] = [];

  for (let index = dayCount - 1; index >= 0; index -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - index);
    const key = toDateKey(date.toISOString());
    buckets.set(key, {});
    categories.push(key);
  }

  return { buckets, categories };
}

function dedupeQuoteBatches(quotes: QuoteWithRelations[]) {
  const batchMap = new Map<string, QuoteBatchSnapshot>();

  for (const quote of quotes) {
    const id = quote.batch_id || quote.id;
    if (batchMap.has(id)) {
      continue;
    }

    batchMap.set(id, {
      companyName: quote.company?.name || '未关联公司',
      createdAt: quote.created_at,
      id,
      title: quote.batch_title || quote.quote_no || '未命名批次',
      trendAt: quote.published_at || quote.created_at,
    });
  }

  return [...batchMap.values()];
}

function fillSeriesByDate<T>(
  categories: string[],
  items: T[],
  getValue: (item: T) => string,
) {
  const countMap = new Map<string, number>();
  const categorySet = new Set(categories);

  for (const item of items) {
    const value = getValue(item);
    const dateKey = toDateKey(value);
    if (!categorySet.has(dateKey)) {
      continue;
    }

    countMap.set(dateKey, (countMap.get(dateKey) || 0) + 1);
  }

  return categories.map((dateKey) => countMap.get(dateKey) || 0);
}

function formatDateLabel(dateKey: string) {
  return dateKey.slice(5).replace('-', '/');
}

function getChartColor(index: number) {
  return CHART_COLORS[index] || CHART_COLORS[0];
}

function getMissingCount(item: AdminDashboardPendingVariant) {
  return Number(item.missingImage) + Number(item.missingSpec) + Number(item.missingQuote);
}

function isDocumentRelevant(
  document: DocumentRecord,
  context: {
    activeCompanyIds: Set<string>;
    activeProductIds: Set<string>;
    activeProductModels: Set<string>;
    activeQuoteBatchIds: Set<string>;
    activeSeriesIds: Set<string>;
  },
) {
  const {
    activeCompanyIds,
    activeProductIds,
    activeProductModels,
    activeQuoteBatchIds,
    activeSeriesIds,
  } = context;

  if (document.variant_id && activeProductIds.has(document.variant_id)) {
    return true;
  }

  if (document.product_id && activeProductIds.has(document.product_id)) {
    return true;
  }

  if (document.product_model && activeProductModels.has(document.product_model)) {
    return true;
  }

  if (document.series_id && activeSeriesIds.has(document.series_id)) {
    return true;
  }

  if (document.quote_batch_id && activeQuoteBatchIds.has(document.quote_batch_id)) {
    return true;
  }

  if (document.company_id && activeCompanyIds.has(document.company_id)) {
    return true;
  }

  return !document.variant_id &&
    !document.product_id &&
    !document.product_model &&
    !document.series_id &&
    !document.quote_batch_id &&
    !document.company_id;
}

function isImageDocument(document: DocumentRecord) {
  return (
    document.file_type === 'image' || document.document_kind === 'product_image'
  );
}

function isProductEnabled(
  product: ProductRecord,
  context: {
    activeBrandIds: Set<string>;
    activeCategoryIds: Set<string>;
    activeCompanyIds: Set<string>;
  },
) {
  const { activeBrandIds, activeCategoryIds, activeCompanyIds } = context;

  return product.status === 'active' &&
    (!product.brand_id || activeBrandIds.has(product.brand_id)) &&
    (!product.category_id || activeCategoryIds.has(product.category_id)) &&
    (!product.company_id || activeCompanyIds.has(product.company_id));
}

function isSpecDocument(document: DocumentRecord) {
  return (
    document.file_type === 'spec' ||
    document.file_type === 'technical' ||
    document.document_kind === 'drawing' ||
    document.document_kind === 'manual' ||
    document.document_kind === 'spec_sheet' ||
    document.document_kind === 'technical'
  );
}

function isUpdateRelevant(
  update: UpdateRecord,
  context: {
    activeProductIds: Set<string>;
    activeProductModels: Set<string>;
    activeQuoteBatchIds: Set<string>;
    activeSeriesIds: Set<string>;
  },
) {
  const {
    activeProductIds,
    activeProductModels,
    activeQuoteBatchIds,
    activeSeriesIds,
  } = context;

  if (update.variant_id && activeProductIds.has(update.variant_id)) {
    return true;
  }

  if (update.product_model && activeProductModels.has(update.product_model)) {
    return true;
  }

  if (update.series_id && activeSeriesIds.has(update.series_id)) {
    return true;
  }

  if (update.quote_batch_id && activeQuoteBatchIds.has(update.quote_batch_id)) {
    return true;
  }

  return (
    !update.variant_id &&
    !update.product_model &&
    !update.series_id &&
    !update.quote_batch_id
  );
}

function toDateKey(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface QuoteBatchSnapshot {
  companyName: string;
  createdAt: string;
  id: string;
  title: string;
  trendAt: string;
}
