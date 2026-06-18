import { isSupabaseConfigured, supabase } from '#/lib/supabase';

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
export type QaQuestionStatus = 'answered' | 'archived' | 'pending';
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
  source: 'imported' | 'manual' | 'product_generated';
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

interface QaQuestionRecord {
  answer?: null | string;
  answered_at?: null | string;
  answered_by?: null | string;
  asked_by?: null | string;
  asker_role?: null | string;
  category: QaQuestionCategory;
  created_at: string;
  helpful_count?: null | number;
  id: string;
  priority?: null | QaQuestionPriority;
  product_id?: null | string;
  product_model?: null | string;
  product_name?: null | string;
  question: string;
  question_no: string;
  source?: null | QaQuestionItem['source'];
  status: QaQuestionStatus;
  tags?: null | string[];
  title: string;
  updated_at: string;
  view_count?: null | number;
}

interface QaQuestionSpecRecord {
  id?: string;
  question_id: string;
  sort_order?: null | number;
  spec_key: string;
  spec_label: string;
  spec_value: string;
}

interface QaQuestionDocumentRecord {
  document_id: string;
  question_id: string;
  relation_type?: null | DocumentRecord['file_type'];
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
const PUBLIC_STATUSES: QaQuestionStatus[] = ['answered', 'pending'];

function getSupabaseClient() {
  return isSupabaseConfigured && supabase ? supabase : null;
}

function normalizeKeyword(keyword?: string) {
  return keyword?.trim().toLowerCase() || '';
}

function normalizePaginationValue(value: number | undefined, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1, Math.floor(value || fallback));
}

function sanitizeIlikeValue(value: string) {
  return value.replaceAll(/[,%()]/g, ' ').trim();
}

function buildQuestionNo(index: number) {
  return `QA-${String(100_000 + index).slice(1)}`;
}

function emptyCategoryCounts() {
  return QA_CATEGORY_OPTIONS.reduce(
    (result, item) => ({ ...result, [item.key]: 0 }),
    {} as Record<QaQuestionCategory, number>,
  );
}

function mapDocumentRef(record: DocumentRecord): QaDocumentRef {
  return {
    fileType: record.file_type,
    fileTypeLabel: formatDocumentType(record.file_type),
    id: record.id,
    title: record.title,
    url: record.file_url,
  };
}

function mapQaRecordToItem(
  record: QaQuestionRecord,
  specs: QaQuestionSpecRecord[] = [],
  documents: DocumentRecord[] = [],
): QaQuestionItem {
  return {
    answer: record.answer || '',
    answeredAt: record.answered_at || null,
    answeredBy: record.answered_by || null,
    askerRole: record.asker_role || '前台用户',
    category: record.category,
    categoryName: CATEGORY_LABELS[record.category],
    createdAt: record.created_at,
    helpfulCount: record.helpful_count || 0,
    id: record.id,
    priority: record.priority || 'medium',
    productId: record.product_id || null,
    productModel: record.product_model || '未关联型号',
    productName: record.product_name || record.product_model || '未关联商品',
    question: record.question,
    questionNo: record.question_no,
    relatedDocuments: documents.map(mapDocumentRef),
    relatedSpecs: specs
      .toSorted((left, right) => (left.sort_order || 0) - (right.sort_order || 0))
      .map((item) => ({
        key: item.spec_key,
        label: item.spec_label,
        value: item.spec_value,
      })),
    source: record.source || 'manual',
    status: record.status,
    tags: record.tags || [],
    title: record.title,
    updatedAt: record.updated_at,
    viewCount: record.view_count || 0,
  };
}

async function listQaRelations(questionIds: string[]) {
  const client = getSupabaseClient();
  if (!client || questionIds.length === 0) {
    return {
      documentsByQuestionId: new Map<string, DocumentRecord[]>(),
      specsByQuestionId: new Map<string, QaQuestionSpecRecord[]>(),
    };
  }

  const [specResult, relationResult] = await Promise.all([
    client
      .from('qa_question_specs')
      .select('*')
      .in('question_id', questionIds)
      .order('sort_order', { ascending: true }),
    client
      .from('qa_question_documents')
      .select('*')
      .in('question_id', questionIds),
  ]);

  if (specResult.error) {
    throw specResult.error;
  }

  if (relationResult.error) {
    throw relationResult.error;
  }

  const specsByQuestionId = new Map<string, QaQuestionSpecRecord[]>();
  for (const item of (specResult.data || []) as QaQuestionSpecRecord[]) {
    specsByQuestionId.set(item.question_id, [
      ...(specsByQuestionId.get(item.question_id) || []),
      item,
    ]);
  }

  const relations = (relationResult.data || []) as QaQuestionDocumentRecord[];
  const documentIds = [...new Set(relations.map((item) => item.document_id).filter(Boolean))];
  const documentsById = new Map<string, DocumentRecord>();

  if (documentIds.length > 0) {
    const documentResult = await client
      .from('documents')
      .select('*')
      .in('id', documentIds);

    if (documentResult.error) {
      throw documentResult.error;
    }

    for (const document of (documentResult.data || []) as DocumentRecord[]) {
      documentsById.set(document.id, document);
    }
  }

  const documentsByQuestionId = new Map<string, DocumentRecord[]>();
  for (const relation of relations) {
    const document = documentsById.get(relation.document_id);
    if (!document) {
      continue;
    }

    documentsByQuestionId.set(relation.question_id, [
      ...(documentsByQuestionId.get(relation.question_id) || []),
      document,
    ]);
  }

  return {
    documentsByQuestionId,
    specsByQuestionId,
  };
}

async function listSupabaseQaQuestions(
  options: QaListOptions = {},
): Promise<PaginatedResult<QaQuestionItem>> {
  const client = getSupabaseClient();
  if (!client) {
    return listMockQaQuestions(options);
  }

  const pageSize = normalizePaginationValue(options.pageSize, DEFAULT_PAGE_SIZE);
  const page = normalizePaginationValue(options.page, 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const keyword = sanitizeIlikeValue(options.keyword || '');

  let query = client
    .from('qa_questions')
    .select('*', { count: 'exact' })
    .in('status', options.status ? [options.status] : PUBLIC_STATUSES);

  if (options.category) {
    query = query.eq('category', options.category);
  }

  if (options.productId) {
    query = query.eq('product_id', options.productId);
  }

  if (keyword) {
    query = query.or(
      [
        `title.ilike.%${keyword}%`,
        `question.ilike.%${keyword}%`,
        `answer.ilike.%${keyword}%`,
        `product_model.ilike.%${keyword}%`,
        `product_name.ilike.%${keyword}%`,
      ].join(','),
    );
  }

  if (options.sortBy === 'latest') {
    query = query.order('updated_at', { ascending: false });
  } else if (options.sortBy === 'answered') {
    query = query
      .order('status', { ascending: true })
      .order('helpful_count', { ascending: false });
  } else {
    query = query
      .order('helpful_count', { ascending: false })
      .order('view_count', { ascending: false })
      .order('updated_at', { ascending: false });
  }

  const { count, data, error } = await query.range(from, to);

  if (error) {
    throw error;
  }

  const records = (data || []) as QaQuestionRecord[];
  const questionIds = records.map((item) => item.id);
  const { documentsByQuestionId, specsByQuestionId } = await listQaRelations(questionIds);
  const total = count || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items: records.map((record) =>
      mapQaRecordToItem(
        record,
        specsByQuestionId.get(record.id) || [],
        documentsByQuestionId.get(record.id) || [],
      ),
    ),
    page: Math.min(page, totalPages),
    pageSize,
    total,
    totalPages,
  };
}

async function listSupabaseQaCategories() {
  const client = getSupabaseClient();
  if (!client) {
    return listMockQaCategories();
  }

  const { data, error } = await client
    .from('qa_questions')
    .select('category')
    .in('status', PUBLIC_STATUSES);

  if (error) {
    throw error;
  }

  const counts = emptyCategoryCounts();
  for (const item of (data || []) as Array<Pick<QaQuestionRecord, 'category'>>) {
    counts[item.category] += 1;
  }

  return QA_CATEGORY_OPTIONS.map((item) => ({
    ...item,
    count: counts[item.key],
  }));
}

async function getSupabaseQaCenterOverview(): Promise<QaCenterOverview> {
  const client = getSupabaseClient();
  if (!client) {
    return getMockQaCenterOverview();
  }

  const { data, error } = await client
    .from('qa_questions')
    .select('id, category, product_id, status')
    .in('status', PUBLIC_STATUSES);

  if (error) {
    throw error;
  }

  const records = (data || []) as Pick<QaQuestionRecord, 'category' | 'id' | 'product_id' | 'status'>[];
  const categoryCounts = emptyCategoryCounts();
  const productIds = new Set<string>();
  const questionIds = records.map((item) => item.id);

  for (const question of records) {
    categoryCounts[question.category] += 1;

    if (question.product_id) {
      productIds.add(question.product_id);
    }
  }

  const featuredQuestions = await listSupabaseQaQuestions({
    page: 1,
    pageSize: 4,
    sortBy: 'hot',
  });
  const { documentsByQuestionId } = await listQaRelations(questionIds);
  const documentIds = new Set<string>();

  for (const documents of documentsByQuestionId.values()) {
    for (const document of documents) {
      documentIds.add(document.id);
    }
  }

  return {
    answeredQuestions: records.filter((item) => item.status === 'answered').length,
    categoryCounts,
    featuredQuestions: featuredQuestions.items,
    pendingQuestions: records.filter((item) => item.status === 'pending').length,
    productCoverage: productIds.size,
    relatedDocumentCount: documentIds.size,
    totalQuestions: records.length,
  };
}

async function createSupabaseQaQuestion(
  payload: CreateQaQuestionPayload,
): Promise<QaQuestionItem> {
  const client = getSupabaseClient();
  if (!client) {
    return createMockQaQuestion(payload);
  }

  const now = new Date().toISOString();
  const productModel = payload.productModel?.trim() || null;
  const title = payload.title.trim();
  const question = payload.question.trim();
  const questionNo = `QA-${String(Date.now()).slice(-6)}`;

  const insertPayload = {
    answer: null,
    answered_at: null,
    answered_by: null,
    asker_role: payload.contact?.trim() || '前台用户',
    category: payload.category,
    created_at: now,
    helpful_count: 0,
    priority: 'medium' as QaQuestionPriority,
    product_id: null,
    product_model: productModel,
    product_name: productModel,
    question,
    question_no: questionNo,
    source: 'manual' as const,
    status: 'pending' as QaQuestionStatus,
    tags: [...new Set(payload.tags || [])],
    title,
    updated_at: now,
    view_count: 0,
  };

  const { data, error } = await client
    .from('qa_questions')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return mapQaRecordToItem(data as QaQuestionRecord);
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
    .map(mapDocumentRef);
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

async function listAllMockQaQuestions() {
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

    if (!PUBLIC_STATUSES.includes(item.status)) {
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

async function listMockQaCategories() {
  const questions = await listAllMockQaQuestions();
  const counts = emptyCategoryCounts();

  for (const question of questions) {
    counts[question.category] += 1;
  }

  return QA_CATEGORY_OPTIONS.map((item) => ({
    ...item,
    count: counts[item.key],
  }));
}

async function listMockQaQuestions(
  options: QaListOptions = {},
): Promise<PaginatedResult<QaQuestionItem>> {
  const questions = await listAllMockQaQuestions();
  const filtered = filterQuestions(questions, options);
  const sorted = sortQuestions(filtered, options.sortBy);

  return paginateItems(sorted, {
    page: options.page,
    pageSize: options.pageSize || DEFAULT_PAGE_SIZE,
  });
}

async function getMockQaCenterOverview(): Promise<QaCenterOverview> {
  const questions = await listAllMockQaQuestions();
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

async function createMockQaQuestion(
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

export async function listQaCategories() {
  return listSupabaseQaCategories();
}

export async function listQaQuestions(
  options: QaListOptions = {},
): Promise<PaginatedResult<QaQuestionItem>> {
  return listSupabaseQaQuestions(options);
}

export async function getQaCenterOverview(): Promise<QaCenterOverview> {
  return getSupabaseQaCenterOverview();
}

export async function createQaQuestion(
  payload: CreateQaQuestionPayload,
): Promise<QaQuestionItem> {
  return createSupabaseQaQuestion(payload);
}
