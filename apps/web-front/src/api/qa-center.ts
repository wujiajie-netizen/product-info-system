import type {
  DocumentRecord,
  PaginatedResult,
  ProductListItem,
  SpecEntry,
} from './product-info';

import {
  formatDocumentType,
  listAllProducts,
  listDocuments,
  paginateItems,
} from './product-info';

export type QaQuestionCategory =
  | 'after_sales'
  | 'product'
  | 'quote'
  | 'spec'
  | 'technical';
export type QaQuestionPriority = 'high' | 'low' | 'medium';
export type QaQuestionStatus = 'answered' | 'pending';
export type QaSortBy = 'answered' | 'hot' | 'latest';

export interface QaCategoryOption {
  count: number;
  description: string;
  key: QaQuestionCategory;
  label: string;
}

export interface QaDocumentRef {
  fileType: DocumentRecord['file_type'];
  fileTypeLabel: string;
  id: string;
  title: string;
  url: string;
}

export interface QaQuestionItem {
  answer: string;
  answeredAt: null | string;
  answeredBy: null | string;
  askerRole: string;
  category: QaQuestionCategory;
  categoryName: string;
  createdAt: string;
  helpfulCount: number;
  id: string;
  priority: QaQuestionPriority;
  productId: null | string;
  productModel: string;
  productName: string;
  question: string;
  questionNo: string;
  relatedDocuments: QaDocumentRef[];
  relatedSpecs: SpecEntry[];
  source: 'manual' | 'product_generated';
  status: QaQuestionStatus;
  tags: string[];
  title: string;
  updatedAt: string;
  viewCount: number;
}

export interface QaListOptions {
  category?: QaQuestionCategory;
  keyword?: string;
  page?: number;
  pageSize?: number;
  productId?: string;
  sortBy?: QaSortBy;
  status?: QaQuestionStatus;
}

export interface QaCenterOverview {
  answeredQuestions: number;
  categoryCounts: Record<QaQuestionCategory, number>;
  featuredQuestions: QaQuestionItem[];
  pendingQuestions: number;
  productCoverage: number;
  relatedDocumentCount: number;
  totalQuestions: number;
}

export interface CreateQaQuestionPayload {
  category: QaQuestionCategory;
  contact?: string;
  productModel?: string;
  question: string;
  tags?: string[];
  title: string;
}

const QA_CATEGORY_OPTIONS: Array<Omit<QaCategoryOption, 'count'>> = [
  {
    description: '商品定位、适用场景、型号差异和采购建议',
    key: 'product',
    label: '商品问题',
  },
  {
    description: '接口、系统、芯片、供电、通信和结构等技术方向',
    key: 'technical',
    label: '技术问题',
  },
  {
    description: '屏幕、尺寸、分辨率、容量、亮度等参数规格',
    key: 'spec',
    label: '规格参数',
  },
  {
    description: '有效报价、阶梯价、起订量和报价附件',
    key: 'quote',
    label: '报价采购',
  },
  {
    description: '资料验收、质保确认、测试要点和交付边界',
    key: 'after_sales',
    label: '交付售后',
  },
];

const CATEGORY_LABELS: Record<QaQuestionCategory, string> = {
  after_sales: '交付售后',
  product: '商品问题',
  quote: '报价采购',
  spec: '规格参数',
  technical: '技术问题',
};

const DEFAULT_PAGE_SIZE = 8;

function normalizeKeyword(keyword?: string) {
  return keyword?.trim().toLowerCase() || '';
}

function pickSpecs(product: ProductListItem, keywords: string[]) {
  const matched = product.specEntries.filter((spec) => {
    const value = `${spec.key} ${spec.label}`.toLowerCase();
    return keywords.some((keyword) => value.includes(keyword));
  });

  return (matched.length > 0 ? matched : product.specEntries).slice(0, 4);
}

function specsToText(specs: SpecEntry[]) {
  if (specs.length === 0) {
    return '当前商品暂未补充完整规格，需要以最新规格书或供应商确认信息为准。';
  }

  return specs.map((spec) => `${spec.label}为 ${spec.value}`).join('，');
}

function buildDocumentRefs(product: ProductListItem, documents: DocumentRecord[]) {
  return documents
    .filter(
      (item) =>
        item.product_id === product.id ||
        item.variant_id === product.id ||
        item.product_model === product.model,
    )
    .filter((item) => item.file_type !== 'image')
    .slice(0, 3)
    .map((item) => ({
      fileType: item.file_type,
      fileTypeLabel: formatDocumentType(item.file_type),
      id: item.id,
      title: item.title,
      url: item.file_url,
    }));
}

function buildQuestionNo(index: number) {
  return `QA-${String(100_000 + index).slice(1)}`;
}

function createQuestion({
  answer,
  category,
  documents,
  index,
  priority = 'medium',
  product,
  question,
  specs,
  tags,
  title,
}: {
  answer: string;
  category: QaQuestionCategory;
  documents: QaDocumentRef[];
  index: number;
  priority?: QaQuestionPriority;
  product: ProductListItem;
  question: string;
  specs: SpecEntry[];
  tags: string[];
  title: string;
}): QaQuestionItem {
  const answered = index % 9 !== 0;
  const updatedAt = product.updatedAt;

  return {
    answer: answered ? answer : '该问题已进入商品知识库待补充，后续由产品/技术同事确认后发布正式回答。',
    answeredAt: answered ? updatedAt : null,
    answeredBy: answered ? '商品知识库' : null,
    askerRole: index % 2 === 0 ? '销售/采购' : '产品/技术',
    category,
    categoryName: CATEGORY_LABELS[category],
    createdAt: updatedAt,
    helpfulCount: answered ? 12 + index * 2 : 0,
    id: `qa-${product.id}-${category}-${index}`,
    priority,
    productId: product.id,
    productModel: product.model,
    productName: product.name,
    question,
    questionNo: buildQuestionNo(index),
    relatedDocuments: documents,
    relatedSpecs: specs,
    source: 'product_generated',
    status: answered ? 'answered' : 'pending',
    tags: [...new Set([product.category, product.brand || '', ...tags, ...product.tags])]
      .filter(Boolean)
      .slice(0, 6),
    title,
    updatedAt,
    viewCount: 86 + index * 17,
  };
}

function buildProductQuestions(
  product: ProductListItem,
  documents: DocumentRecord[],
  productIndex: number,
) {
  const offset = productIndex * 10;
  const documentRefs = buildDocumentRefs(product, documents);
  const specSpecs = pickSpecs(product, [
    'battery',
    'brightness',
    'capacity',
    'display',
    'interface',
    'memory',
    'ram',
    'resolution',
    'screen',
    'storage',
    'voltage',
  ]);
  const technicalSpecs = pickSpecs(product, [
    'chip',
    'interface',
    'os',
    'package',
    'power',
    'speed',
    'voltage',
  ]);
  const quote = product.latestQuote;
  const quoteAnswer = quote && quote.unit_price !== null
    ? `${product.model} 当前有效报价为 ${product.priceRange}，起订量 ${quote.min_order_quantity ? `${quote.min_order_quantity} 件/台` : '需按报价单确认'}，最终交付价格应结合供应商、阶梯价和报价有效期复核。`
    : `${product.model} 当前未发布结构化有效报价，建议先查看报价中心或联系采购补充最新报价批次。`;
  const documentAnswer = documentRefs.length > 0
    ? `已关联 ${documentRefs.map((item) => item.fileTypeLabel).join('、')}，可用于核对技术规格、选型边界和交付资料；如涉及客户确认，优先引用最新上传的规格书或技术资料。`
    : '当前商品暂无可见技术资料，建议补充规格书、结构图或测试说明后再对外确认。';

  return [
    createQuestion({
      answer: `${product.name}（${product.model}）属于${product.category}，${product.summary} 适合围绕“型号确认、参数匹配、资料齐套、报价有效性”进行采购沟通。`,
      category: 'product',
      documents: documentRefs,
      index: offset + 1,
      product,
      question: `${product.name}（${product.model}）主要适合哪些商品选型或采购场景？`,
      specs: specSpecs.slice(0, 3),
      tags: ['选型', '商品定位'],
      title: `${product.model} 的商品定位和适用场景是什么？`,
    }),
    createQuestion({
      answer: `${product.model} 的核心规格可以先看：${specsToText(specSpecs)}。如客户需要完整参数，应继续关联规格书、图纸或技术资料进行确认。`,
      category: 'spec',
      documents: documentRefs,
      index: offset + 2,
      priority: 'high',
      product,
      question: `${product.model} 需要优先确认哪些规格参数？`,
      specs: specSpecs,
      tags: ['规格', '参数'],
      title: `${product.model} 的核心规格参数有哪些？`,
    }),
    createQuestion({
      answer: `${product.model} 技术确认建议重点看：${specsToText(technicalSpecs)}。${documentAnswer}`,
      category: 'technical',
      documents: documentRefs,
      index: offset + 3,
      priority: documentRefs.length > 0 ? 'medium' : 'high',
      product,
      question: `${product.model} 在接口、系统、供电或结构上有什么技术确认点？`,
      specs: technicalSpecs,
      tags: ['技术确认', '资料'],
      title: `${product.model} 的技术资料和确认点怎么查？`,
    }),
    createQuestion({
      answer: quoteAnswer,
      category: 'quote',
      documents: documentRefs.filter((item) => item.fileType === 'quote'),
      index: offset + 4,
      product,
      question: `${product.model} 的报价、起订量和有效期应该怎么确认？`,
      specs: specSpecs.slice(0, 2),
      tags: ['报价', '起订量'],
      title: `${product.model} 的采购报价是否已可用？`,
    }),
    createQuestion({
      answer: `${product.model} 交付验收建议至少核对型号、外观/包装、核心规格、资料附件和报价条款。若涉及屏幕、模组、电池或通信类商品，还应补充测试记录和客户确认截图。`,
      category: 'after_sales',
      documents: documentRefs,
      index: offset + 5,
      product,
      question: `${product.model} 交付后验收和售后确认要注意什么？`,
      specs: specSpecs.slice(0, 3),
      tags: ['验收', '售后'],
      title: `${product.model} 的交付验收重点是什么？`,
    }),
  ];
}

async function listAllQaQuestions() {
  const products = await listAllProducts({ sortBy: '最新更新' });
  const productIds = products.map((item) => item.id);
  const documents = await listDocuments({ productIds });

  return products
    .slice(0, 24)
    .flatMap((product, index) => buildProductQuestions(product, documents, index));
}

function filterQuestions(questions: QaQuestionItem[], options: QaListOptions) {
  const keyword = normalizeKeyword(options.keyword);

  return questions.filter((item) => {
    if (options.category && item.category !== options.category) {
      return false;
    }

    if (options.status && item.status !== options.status) {
      return false;
    }

    if (options.productId && item.productId !== options.productId) {
      return false;
    }

    if (!keyword) {
      return true;
    }

    return [
      item.answer,
      item.categoryName,
      item.productModel,
      item.productName,
      item.question,
      item.title,
      item.tags.join(' '),
      item.relatedSpecs.map((spec) => `${spec.label} ${spec.value}`).join(' '),
    ]
      .join(' ')
      .toLowerCase()
      .includes(keyword);
  });
}

function sortQuestions(questions: QaQuestionItem[], sortBy: QaSortBy = 'hot') {
  if (sortBy === 'latest') {
    return [...questions].sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    );
  }

  if (sortBy === 'answered') {
    return [...questions].sort((left, right) => {
      if (left.status !== right.status) {
        return left.status === 'answered' ? -1 : 1;
      }

      return right.helpfulCount - left.helpfulCount;
    });
  }

  return [...questions].sort(
    (left, right) =>
      right.viewCount + right.helpfulCount * 2 -
      (left.viewCount + left.helpfulCount * 2),
  );
}

function emptyCategoryCounts() {
  return QA_CATEGORY_OPTIONS.reduce(
    (result, item) => ({ ...result, [item.key]: 0 }),
    {} as Record<QaQuestionCategory, number>,
  );
}

export async function listQaCategories() {
  const questions = await listAllQaQuestions();
  const counts = emptyCategoryCounts();

  for (const question of questions) {
    counts[question.category] += 1;
  }

  return QA_CATEGORY_OPTIONS.map((item) => ({
    ...item,
    count: counts[item.key],
  }));
}

export async function listQaQuestions(
  options: QaListOptions = {},
): Promise<PaginatedResult<QaQuestionItem>> {
  const questions = await listAllQaQuestions();
  const filtered = filterQuestions(questions, options);
  const sorted = sortQuestions(filtered, options.sortBy);

  return paginateItems(sorted, {
    page: options.page,
    pageSize: options.pageSize || DEFAULT_PAGE_SIZE,
  });
}

export async function getQaCenterOverview(): Promise<QaCenterOverview> {
  const questions = await listAllQaQuestions();
  const categoryCounts = emptyCategoryCounts();
  const productIds = new Set<string>();
  const documentIds = new Set<string>();

  for (const question of questions) {
    categoryCounts[question.category] += 1;

    if (question.productId) {
      productIds.add(question.productId);
    }

    for (const document of question.relatedDocuments) {
      documentIds.add(document.id);
    }
  }

  return {
    answeredQuestions: questions.filter((item) => item.status === 'answered').length,
    categoryCounts,
    featuredQuestions: sortQuestions(questions, 'hot').slice(0, 4),
    pendingQuestions: questions.filter((item) => item.status === 'pending').length,
    productCoverage: productIds.size,
    relatedDocumentCount: documentIds.size,
    totalQuestions: questions.length,
  };
}

export async function createQaQuestion(
  payload: CreateQaQuestionPayload,
): Promise<QaQuestionItem> {
  const now = new Date().toISOString();
  const productModel = payload.productModel?.trim() || '待关联型号';
  const title = payload.title.trim();
  const question = payload.question.trim();

  return {
    answer: '问题已提交到商品知识库，后续需要产品、技术或采购同事确认正式回答后发布。',
    answeredAt: null,
    answeredBy: null,
    askerRole: payload.contact?.trim() || '前台用户',
    category: payload.category,
    categoryName: CATEGORY_LABELS[payload.category],
    createdAt: now,
    helpfulCount: 0,
    id: `qa-local-${Date.now()}`,
    priority: 'medium',
    productId: null,
    productModel,
    productName: productModel,
    question,
    questionNo: `QA-${String(Date.now()).slice(-5)}`,
    relatedDocuments: [],
    relatedSpecs: [],
    source: 'manual',
    status: 'pending',
    tags: [...new Set([payload.category, ...(payload.tags || [])])],
    title,
    updatedAt: now,
    viewCount: 0,
  };
}
