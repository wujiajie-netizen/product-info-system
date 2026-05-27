<script lang="ts" setup>
import type {
  BrandRecord,
  CategoryRecord,
  CompanyRecord,
  DocumentRecord,
  ImportTemplateRecord,
  ProductRecord,
  SaveProductInput,
  SaveQuoteTierInput,
} from '#/api';
import type { CheckboxValueType, UploadFile } from 'element-plus';
import type { WorkSheet } from 'xlsx';
import type { ExcelImageCandidate } from './utils/excel-image-extractor';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElCard,
  ElCheckbox,
  ElDatePicker,
  ElDialog,
  ElDivider,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElProgress,
  ElSelect,
  ElSpace,
  ElStep,
  ElSteps,
  ElTable,
  ElTableColumn,
  ElTabPane,
  ElTabs,
  ElTag,
  ElUpload,
} from 'element-plus';
import { read, utils } from 'xlsx';

import {
  createImportHistory,
  createProduct,
  createQuote,
  listBrands,
  listCategories,
  listCompanies,
  listImportTemplates,
  listProducts,
  saveQuoteWorkbookAttachments,
  updateProduct,
} from '#/api';

import ExcelImageImportPanel from './components/excel-image-import-panel.vue';
import ImportHistoryPanel from './components/import-history-panel.vue';
import ImportTemplatesPanel from './components/import-templates-panel.vue';
import ManualEntryPanel from './components/manual-entry-panel.vue';
import QuickCreateDictionaries from './components/quick-create-dictionaries.vue';
import { extractExcelEmbeddedImages } from './utils/excel-image-extractor';

type QuoteTierDraft = SaveQuoteTierInput;
type ImportStatus = 'error' | 'imported' | 'ready' | 'skipped' | 'warning';
type DuplicateStrategy = 'create_new' | 'only_quote' | 'skip' | 'update_existing';
type FieldMergeStrategy = 'fill_empty' | 'overwrite';

interface DraftProduct {
  brandId: string;
  brightnessNits?: number;
  category: string;
  categoryId: string;
  chipset: string;
  companyId: string;
  description: string;
  duplicateStrategy: DuplicateStrategy;
  errors: string[];
  fieldMergeStrategy: FieldMergeStrategy;
  importedProductId?: string;
  model: string;
  name: string;
  osName: string;
  osVersion: string;
  poeStandard: string;
  poeSupported?: boolean;
  productType: string;
  quoteRemarks: string;
  quoteTiers: QuoteTierDraft[];
  ramGb?: number;
  resolutionHeight?: number;
  resolutionWidth?: number;
  rowKey: string;
  selected: boolean;
  seriesCode: string;
  seriesName: string;
  sizeInch?: number;
  sourceSheetName: string;
  specJson: Record<string, unknown>;
  status: ImportStatus;
  storageGb?: number;
  summaryConfigText: string;
  tags: string[];
  warnings: string[];
}

interface TemplateDetailMapResult {
  chipset?: string;
  model?: string;
  osName?: string;
  ramGb?: string;
  resolution?: string;
  rowValues: Record<string, string>;
  sizeInch?: string;
  storageGb?: string;
}

type WorkbenchTab = 'excel-import' | 'import-history' | 'import-templates' | 'manual-entry';

const route = useRoute();
const userStore = useUserStore();
const isAdmin = computed(() => userStore.userRoles.includes('admin'));

const categories = ref<CategoryRecord[]>([]);
const brands = ref<BrandRecord[]>([]);
const companies = ref<CompanyRecord[]>([]);
const existingProducts = ref<ProductRecord[]>([]);
const importTemplates = ref<ImportTemplateRecord[]>([]);
const drafts = ref<DraftProduct[]>([]);
const parsing = ref(false);
const importing = ref(false);
const fileName = ref('');
const sourceExcelFile = ref<File>();
const excelImageCandidates = ref<ExcelImageCandidate[]>([]);
const uploadedExcelImageDocuments = ref<DocumentRecord[]>([]);
const workbookSheetNames = ref<string[]>([]);
const quoteSheetName = ref('');
const quoteBatchTitle = ref('');
const detectedCompanyName = ref('');
const parseSummary = ref('尚未上传 Excel');
const importOnlyNormal = ref(false);
const anomalyDialogVisible = ref(false);
const importConfirmVisible = ref(false);
const bulkDuplicateStrategy = ref<DuplicateStrategy>('only_quote');
const workbenchTab = ref<WorkbenchTab>('excel-import');
const selectedTemplateId = ref('');
const historyPanelRef = ref<InstanceType<typeof ImportHistoryPanel>>();

const defaults = reactive({
  brandId: '',
  category: 'KDS 厨房显示屏',
  categoryId: '',
  companyId: '',
  currency: 'USD',
  publishedAt: '',
  seriesName: 'KDS 厨房系列',
  status: 'draft' as 'active' | 'draft',
  validFrom: '',
});

const currentTemplate = computed(
  () =>
    importTemplates.value.find((item) => item.id === selectedTemplateId.value) ||
    importTemplates.value.find((item) => item.is_default) ||
    undefined,
);

const activeStep = computed(() => {
  if (importing.value) return 3;
  if (drafts.value.some((item) => item.status === 'imported')) return 4;
  if (drafts.value.length > 0) return 2;
  if (fileName.value) return 1;
  return 0;
});

const selectedDrafts = computed(() =>
  drafts.value.filter((item) => item.selected && item.status !== 'imported'),
);

const readyCount = computed(
  () => selectedDrafts.value.filter((item) => item.errors.length === 0).length,
);

const importedCount = computed(
  () => drafts.value.filter((item) => item.status === 'imported').length,
);

const completionPercent = computed(() => {
  if (drafts.value.length === 0) return 0;
  return Math.round((importedCount.value / drafts.value.length) * 100);
});

const duplicateDrafts = computed(() =>
  drafts.value.filter((draft) => Boolean(findExistingProduct(draft.model))),
);

const anomalyRows = computed(() =>
  drafts.value.filter((item) => item.errors.length > 0 || item.warnings.length > 0),
);

const importTargets = computed(() =>
  selectedDrafts.value.filter(
    (draft) =>
      draft.errors.length === 0 &&
      draft.duplicateStrategy !== 'skip' &&
      (!importOnlyNormal.value || draft.warnings.length === 0),
  ),
);

const duplicateModelGroups = computed(() => {
  const modelMap = new Map<string, DraftProduct[]>();
  for (const draft of drafts.value) {
    const key = lower(draft.model);
    if (!key) continue;
    modelMap.set(key, [...(modelMap.get(key) || []), draft]);
  }
  return [...modelMap.values()].filter((items) => items.length > 1);
});

const preflightReport = computed(() => {
  const targets = importTargets.value;
  const existingMatches = targets.filter((draft) => Boolean(findExistingProduct(draft.model)));
  const quoteRows = targets.filter((draft) => draft.quoteTiers.length > 0 && draft.companyId);
  const quoteTierCount = quoteRows.reduce(
    (total, draft) => total + draft.quoteTiers.length,
    0,
  );
  const quoteOnlyRows = targets.filter((draft) => draft.duplicateStrategy === 'only_quote');
  const updateRows = targets.filter((draft) => draft.duplicateStrategy === 'update_existing');
  const newProductRows = targets.filter(
    (draft) => draft.duplicateStrategy === 'create_new' || !findExistingProduct(draft.model),
  );

  return {
    anomalyCount: anomalyRows.value.length,
    duplicateExistingCount: existingMatches.length,
    duplicateInFileCount: duplicateModelGroups.value.reduce(
      (total, group) => total + group.length,
      0,
    ),
    importableCount: targets.length,
    missingBrandCount: targets.filter((draft) => !draft.brandId).length,
    missingCategoryCount: targets.filter((draft) => !draft.category && !draft.categoryId).length,
    missingCompanyCount: targets.filter((draft) => !draft.companyId).length,
    missingImageCount: targets.length,
    missingQuoteCount: targets.filter((draft) => draft.quoteTiers.length === 0).length,
    missingSpecCount: targets.filter((draft) => !draft.sourceSheetName).length,
    newProductCount: newProductRows.length,
    normalCount: selectedDrafts.value.filter(
      (draft) => draft.errors.length === 0 && draft.warnings.length === 0,
    ).length,
    quoteBatchCount: quoteRows.length,
    quoteOnlyCount: quoteOnlyRows.length,
    quoteTierCount,
    selectedCount: selectedDrafts.value.length,
    skippedCount: selectedDrafts.value.length - targets.length,
    updateProductCount: updateRows.length,
  };
});

function normalizeText(value: unknown) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function lower(value: unknown) {
  return normalizeText(value).toLowerCase();
}

function normalizeWorkbenchTab(value: unknown): WorkbenchTab {
  if (
    value === 'manual-entry' ||
    value === 'import-templates' ||
    value === 'import-history' ||
    value === 'excel-import'
  ) {
    return value;
  }
  return 'excel-import';
}

function handleWorkbenchTabChange(tab: string | number) {
  workbenchTab.value = normalizeWorkbenchTab(tab);
}

function parseNumber(value: unknown) {
  const matched = normalizeText(value).match(/-?\d+(?:\.\d+)?/);
  return matched ? Number(matched[0]) : undefined;
}

function parseBoolean(value: unknown) {
  const text = lower(value);
  if (!text) return undefined;
  if (['no', 'none', '否', '不支持', 'n/a'].some((item) => text.includes(item))) return false;
  if (['yes', 'support', '支持', '802.3', 'poe'].some((item) => text.includes(item))) return true;
  return undefined;
}

function parseResolution(value: unknown) {
  const text = normalizeText(value);
  const matched = text.match(/(\d{3,5})\s*[xX*×]\s*(\d{3,5})/);
  if (!matched) return {};
  return {
    resolutionHeight: Number(matched[2]),
    resolutionWidth: Number(matched[1]),
  };
}

function getCell(row: unknown[], index: number) {
  return normalizeText(row[index]);
}

function findHeaderIndex(rows: unknown[][]) {
  return rows.findIndex((row) =>
    row.some((cell) => ['机型', '型号', 'model', 'model no'].includes(lower(cell))),
  );
}

function findColumn(headers: unknown[], patterns: Array<RegExp | string>) {
  return headers.findIndex((header) => {
    const text = lower(header);
    return patterns.some((pattern) =>
      typeof pattern === 'string' ? text.includes(pattern) : pattern.test(text),
    );
  });
}

function getByColumn(row: unknown[], index: number) {
  return index >= 0 ? getCell(row, index) : '';
}

function findColumnByTemplate(headers: unknown[], columnName?: null | string) {
  if (!columnName) return -1;
  const target = lower(columnName);
  return headers.findIndex((header) => lower(header) === target || lower(header).includes(target));
}

function findTierColumnsByTemplate(headers: unknown[], template?: ImportTemplateRecord) {
  const mappings = template?.tier_mappings || [];
  if (!mappings.length) return [];
  return mappings
    .map((mapping) => {
      const index = findColumnByTemplate(headers, mapping.column);
      return index >= 0
        ? {
            currency: mapping.currency || defaults.currency,
            index,
            minQuantity: mapping.minQuantity,
          }
        : null;
    })
    .filter(
      (
        item,
      ): item is {
        currency: string;
        index: number;
        minQuantity: number;
      } => Boolean(item),
    );
}

function findExistingProduct(model: string) {
  const normalizedModel = lower(model);
  return existingProducts.value.find((item) => lower(item.model) === normalizedModel);
}

function existingProductInfo(model: string) {
  const product = findExistingProduct(model);
  if (!product) return '';
  return [
    product.model,
    product.name,
    product.series_name,
    product.category,
    product.updated_at ? `更新：${product.updated_at.slice(0, 10)}` : '',
  ]
    .filter(Boolean)
    .join(' / ');
}

function duplicateStrategyLabel(strategy: DuplicateStrategy) {
  return {
    create_new: '作为新商品创建',
    only_quote: '只新增报价',
    skip: '跳过该商品',
    update_existing: '更新已有商品',
  }[strategy];
}

function findCompanyName(rows: unknown[][]) {
  const allText = rows
    .slice(0, 8)
    .flat()
    .map((cell) => normalizeText(cell))
    .filter(Boolean);
  return allText.find((text) => /co\.?\s*,?\s*ltd|company|公司/i.test(text)) || '';
}

function findQuoteSheet(sheetNames: string[], template?: ImportTemplateRecord) {
  const targetSheet = normalizeText(template?.quote_sheet_name);
  if (targetSheet) {
    const matchedByName = sheetNames.find((name) => lower(name) === lower(targetSheet));
    if (matchedByName) return matchedByName;
  }

  const matcher = normalizeText(template?.quote_sheet_matcher);
  if (matcher) {
    const matchedByRule = sheetNames.find((name) => lower(name).includes(lower(matcher)));
    if (matchedByRule) return matchedByRule;
  }

  return (
    sheetNames.find((name) => name.includes('报价')) ||
    sheetNames.find((name) => /quote/i.test(name)) ||
    sheetNames[0] ||
    ''
  );
}

function getSheetRows(workbook: ReturnType<typeof read>, sheetName: string) {
  const sheet = workbook.Sheets[sheetName] as WorkSheet | undefined;
  if (!sheet) {
    return [];
  }

  return utils.sheet_to_json<unknown[]>(sheet, {
    defval: '',
    header: 1,
    raw: false,
  });
}

function extractQuoteRows(workbook: ReturnType<typeof read>, template?: ImportTemplateRecord) {
  const sheetName = findQuoteSheet(workbook.SheetNames, template);
  const rows = getSheetRows(workbook, sheetName);
  const headerIndex =
    typeof template?.header_row === 'number' && template.header_row > 0
      ? template.header_row - 1
      : findHeaderIndex(rows);
  const headers = rows[headerIndex] || [];
  const modelColumn =
    findColumnByTemplate(headers, template?.model_column) >= 0
      ? findColumnByTemplate(headers, template?.model_column)
      : findColumn(headers, ['型号', '型号', 'model']);
  const sizeColumn =
    findColumnByTemplate(headers, template?.size_column) >= 0
      ? findColumnByTemplate(headers, template?.size_column)
      : findColumn(headers, ['尺寸', 'size']);
  const configColumn =
    findColumnByTemplate(headers, template?.summary_config_column) >= 0
      ? findColumnByTemplate(headers, template?.summary_config_column)
      : findColumn(headers, ['标准配置', '配置', 'config']);
  const imageColumn = findColumn(headers, ['产品图片', '图片', 'image']);
  const remarkColumn =
    findColumnByTemplate(headers, template?.remark_column) >= 0
      ? findColumnByTemplate(headers, template?.remark_column)
      : findColumn(headers, ['备注', '选配', 'remark']);
  const templateTiers = findTierColumnsByTemplate(headers, template);
  const tierColumns =
    templateTiers.length > 0
      ? templateTiers
      : (headers
          .map((header, index) => ({ header: normalizeText(header), index }))
          .map((item) => {
            const quantity = parseNumber(item.header);
            const isPriceColumn = /价|price|usd|cny|eur/i.test(item.header);
            return quantity && isPriceColumn
              ? { currency: defaults.currency, index: item.index, minQuantity: quantity }
              : null;
          })
          .filter(Boolean) as Array<{ currency: string; index: number; minQuantity: number }>);

  const dataRows = headerIndex >= 0 ? rows.slice(headerIndex + 1) : [];
  const quoteMap = new Map<string, Partial<DraftProduct>>();

  for (const row of dataRows) {
    const model = getByColumn(row, modelColumn);
    if (!model || !/[a-z0-9]/i.test(model)) continue;

    const tiers = tierColumns
      .map((column) => ({
        currency: column.currency || defaults.currency,
        minQuantity: column.minQuantity,
        unitPrice: parseNumber(row[column.index]),
      }))
      .filter((tier) => typeof tier.unitPrice === 'number') as QuoteTierDraft[];

    const sizeValue = getByColumn(row, sizeColumn);
    const configText = getByColumn(row, configColumn);
    const remarks = [getByColumn(row, remarkColumn), imageColumn >= 0 ? getByColumn(row, imageColumn) : '']
      .filter(Boolean)
      .join(' / ');

    quoteMap.set(model, {
      model,
      name: model,
      quoteRemarks: remarks,
      quoteTiers: tiers,
      seriesCode: model.replace(/\d{2,}.*/i, ''),
      seriesName: defaults.seriesName,
      sizeInch: parseNumber(sizeValue),
      summaryConfigText: configText,
    });
  }

  quoteSheetName.value = sheetName;
  quoteBatchTitle.value =
    rows
      .slice(0, Math.max(headerIndex, 1))
      .flat()
      .map((cell) => normalizeText(cell))
      .find((cell) => cell.length > 8) || `${fileName.value} 报价批次`;
  detectedCompanyName.value = findCompanyName(rows);
  return quoteMap;
}

function findValue(rows: unknown[][], labels: string[]) {
  const normalizedLabels = labels.map((item) => item.toLowerCase());
  for (const row of rows) {
    for (let index = 0; index < row.length; index += 1) {
      const text = lower(row[index]);
      if (!text) continue;
      if (normalizedLabels.some((label) => text === label || text.includes(label))) {
        for (let offset = 1; offset <= 4; offset += 1) {
          const value = normalizeText(row[index + offset]);
          if (value && !normalizedLabels.includes(value.toLowerCase())) return value;
        }
      }
    }
  }
  return '';
}

function extractTemplateDetails(rows: unknown[][], template?: ImportTemplateRecord): TemplateDetailMapResult {
  const result: TemplateDetailMapResult = { rowValues: {} };
  const mappings = template?.detail_mappings || {};
  if (!Object.keys(mappings).length) {
    return result;
  }

  for (const row of rows) {
    const key = normalizeText(row[0] || row[1]);
    const value = normalizeText(row[1] || row[2]);
    if (key && value) {
      result.rowValues[key] = value;
    }
  }

  for (const [label, field] of Object.entries(mappings)) {
    const matched = Object.entries(result.rowValues).find(
      ([key]) => lower(key) === lower(label) || lower(key).includes(lower(label)),
    );
    if (matched) {
      ((result as unknown) as Record<string, string | Record<string, string> | undefined>)[field] =
        matched[1];
    }
  }
  return result;
}

function shouldUseDetailSheet(sheetName: string, template?: ImportTemplateRecord) {
  const rule = normalizeText(template?.detail_sheet_rule);
  if (!rule) return true;
  return lower(sheetName).includes(lower(rule));
}

function extractSpecFromSheet(workbook: ReturnType<typeof read>, sheetName: string, template?: ImportTemplateRecord) {
  const rows = getSheetRows(workbook, sheetName);
  const templateDetails = extractTemplateDetails(rows, template);
  const model = normalizeText(templateDetails.model) || findValue(rows, ['model no', 'model', '型号']) || sheetName;
  const productType = findValue(rows, ['product type', '产品类型']);
  const description = findValue(rows, ['product description', 'description', '产品描述']);
  const cpu = normalizeText(templateDetails.chipset) || findValue(rows, ['cpu', 'chipset', '芯片']);
  const ram = normalizeText(templateDetails.ramGb) || findValue(rows, ['ram', 'memory', '内存']);
  const storage = normalizeText(templateDetails.storageGb) || findValue(rows, ['internal memory', 'storage', '存储']);
  const os = normalizeText(templateDetails.osName) || findValue(rows, ['operation system', 'os', '系统']);
  const panelSize = normalizeText(templateDetails.sizeInch) || findValue(rows, ['panel size', 'size', '尺寸']);
  const resolution = normalizeText(templateDetails.resolution) || findValue(rows, ['resolution', '分辨率']);
  const luminance = findValue(rows, ['luminance', 'brightness', '亮度']);
  const poe = findValue(rows, ['poe']);
  const productName = description || `${model} ${productType || ''}`.trim();
  const resolutionResult = parseResolution(resolution);

  const specJson: Record<string, unknown> = {};
  for (const row of rows) {
    const key = normalizeText(row[0] || row[1]);
    const value = normalizeText(row[1] || row[2]);
    if (key && value && key !== value) specJson[key] = value;
  }

  return {
    brightnessNits: parseNumber(luminance),
    chipset: cpu,
    description,
    model,
    name: productName || model,
    osName: os.split(/\s+/)[0] || '',
    osVersion: os.match(/\d+(?:\.\d+)?/)?.[0] || '',
    poeStandard: poe,
    poeSupported: parseBoolean(poe),
    productType,
    ramGb: parseNumber(ram),
    ...resolutionResult,
    sizeInch: parseNumber(panelSize),
    sourceSheetName: sheetName,
    specJson: { ...specJson, luminance, os, panel_size: panelSize, poe, resolution, storage },
    storageGb: parseNumber(storage),
  } as Partial<DraftProduct>;
}

function buildDrafts(workbook: ReturnType<typeof read>) {
  const template = currentTemplate.value;
  const quoteMap = extractQuoteRows(workbook, template);
  const draftMap = new Map<string, DraftProduct>();

  for (const [model, quoteDraft] of quoteMap) {
    draftMap.set(model, createEmptyDraft(model, quoteDraft));
  }

  for (const sheetName of workbook.SheetNames) {
    if (sheetName === quoteSheetName.value) continue;
    if (!shouldUseDetailSheet(sheetName, template)) continue;
    const specDraft = extractSpecFromSheet(workbook, sheetName, template);
    const model = normalizeText(specDraft.model || sheetName);
    const existing = draftMap.get(model) || createEmptyDraft(model, {});
    draftMap.set(model, mergeDraft(existing, specDraft));
  }

  const records = [...draftMap.values()].map(validateDraft);
  drafts.value = records;
  parseSummary.value = `识别 ${workbook.SheetNames.length} 个工作表，生成 ${records.length} 条商品草稿，报价表：${quoteSheetName.value || '未识别'}${template ? `，模板：${template.template_name}` : ''}`;
}

function createEmptyDraft(model: string, partial: Partial<DraftProduct>): DraftProduct {
  return {
    brandId: defaults.brandId,
    category: defaults.category,
    categoryId: defaults.categoryId,
    chipset: '',
    companyId: defaults.companyId,
    description: '',
    duplicateStrategy: 'create_new',
    errors: [],
    fieldMergeStrategy: 'fill_empty',
    model,
    name: model,
    osName: '',
    osVersion: '',
    poeStandard: '',
    productType: '',
    quoteRemarks: '',
    quoteTiers: [],
    rowKey: `${model}-${Math.random().toString(36).slice(2)}`,
    selected: true,
    seriesCode: model.replace(/[\d].*$/, '') || model,
    seriesName: defaults.seriesName,
    sourceSheetName: '',
    specJson: {},
    status: 'ready',
    summaryConfigText: '',
    tags: ['Excel导入', 'KDS'],
    warnings: [],
    ...partial,
  };
}

function mergeDraft(base: DraftProduct, partial: Partial<DraftProduct>) {
  return {
    ...base,
    ...partial,
    brandId: partial.brandId || base.brandId,
    category: partial.category || base.category,
    categoryId: partial.categoryId || base.categoryId,
    companyId: partial.companyId || base.companyId,
    duplicateStrategy: partial.duplicateStrategy || base.duplicateStrategy,
    fieldMergeStrategy: partial.fieldMergeStrategy || base.fieldMergeStrategy,
    quoteRemarks: partial.quoteRemarks || base.quoteRemarks,
    quoteTiers: partial.quoteTiers?.length ? partial.quoteTiers : base.quoteTiers,
    specJson: { ...base.specJson, ...partial.specJson },
    summaryConfigText: partial.summaryConfigText || base.summaryConfigText,
  } satisfies DraftProduct;
}

function validateDraft(draft: DraftProduct) {
  draft.errors = [];
  draft.warnings = [];
  const existing = findExistingProduct(draft.model);

  if (!draft.model) draft.errors.push('缺少型号');
  if (!draft.name) draft.errors.push('缺少产品名称');
  if (!draft.category && !draft.categoryId) draft.errors.push('缺少分类');

  if (existing && draft.duplicateStrategy === 'create_new') {
    draft.warnings.push('型号已存在，当前策略为作为新商品创建');
  }

  if (existing && draft.duplicateStrategy === 'only_quote') {
    draft.warnings.push('型号已存在，将只新增报价并挂到已有商品');
  }

  if (existing && draft.duplicateStrategy === 'update_existing') {
    draft.warnings.push(`型号已存在，将${draft.fieldMergeStrategy === 'overwrite' ? '用 Excel 覆盖已有字段' : '仅补齐已有空字段'}`);
  }

  if (!existing && draft.duplicateStrategy !== 'create_new') {
    draft.errors.push('未找到已有商品，不能执行当前重复处理策略');
  }

  if (!draft.quoteTiers.length) draft.warnings.push('缺少报价阶梯');
  if (!draft.sourceSheetName) draft.warnings.push('缺少详情 Sheet');

  draft.status =
    draft.duplicateStrategy === 'skip'
      ? 'skipped'
      : draft.errors.length
        ? 'error'
        : draft.warnings.length
          ? 'warning'
          : 'ready';
  return draft;
}

async function handleExcelChange(file: UploadFile) {
  const rawFile = file.raw;
  if (!rawFile) return;

  fileName.value = rawFile.name;
  sourceExcelFile.value = rawFile;
  excelImageCandidates.value = [];
  uploadedExcelImageDocuments.value = [];
  parsing.value = true;

  try {
    if (!existingProducts.value.length) {
      await loadOptions();
    }
    const buffer = await rawFile.arrayBuffer();
    const workbook = read(buffer, { cellDates: true, type: 'array' });
    workbookSheetNames.value = workbook.SheetNames;
    buildDrafts(workbook);
    excelImageCandidates.value = await extractExcelEmbeddedImages(rawFile, existingProducts.value);
    ElMessage.success(
      currentTemplate.value
        ? `Excel 解析完成，已套用模板：${currentTemplate.value.template_name}`
        : 'Excel 解析完成，请先查看预检报告再入库',
    );
  } catch (error) {
    ElMessage.error((error as Error).message || 'Excel 解析失败');
  } finally {
    parsing.value = false;
  }
}

async function loadOptions() {
  const [categoryRecords, brandRecords, companyRecords, productRecords, templateRecords] = await Promise.all([
    listCategories(),
    listBrands(),
    listCompanies(),
    listProducts(),
    listImportTemplates(),
  ]);
  categories.value = categoryRecords;
  brands.value = brandRecords;
  companies.value = companyRecords;
  existingProducts.value = productRecords;
  importTemplates.value = templateRecords.filter((item) => item.status === 'active');
  if (!selectedTemplateId.value) {
    selectedTemplateId.value = importTemplates.value.find((item) => item.is_default)?.id || '';
  }
  drafts.value.forEach(validateDraft);
}

function applyDefaults() {
  for (const draft of drafts.value) {
    draft.categoryId = draft.categoryId || defaults.categoryId;
    draft.category = draft.category || defaults.category;
    draft.brandId = draft.brandId || defaults.brandId;
    draft.companyId = draft.companyId || defaults.companyId;
    draft.seriesName = draft.seriesName || defaults.seriesName;
    validateDraft(draft);
  }
}

async function handleImportTemplateChanged() {
  await loadOptions();
}

function handleExcelImagesUploaded(documents: DocumentRecord[]) {
  uploadedExcelImageDocuments.value = documents;
  ElMessage.success(`已关联 ${documents.length} 张 Excel 图片`);
}

function applyDuplicateStrategyToAll() {
  for (const draft of duplicateDrafts.value) {
    draft.duplicateStrategy = bulkDuplicateStrategy.value;
    if (bulkDuplicateStrategy.value === 'skip') draft.selected = false;
    validateDraft(draft);
  }
  ElMessage.success(`已为 ${duplicateDrafts.value.length} 条重复型号设置处理策略`);
}

function toggleAll(value: CheckboxValueType) {
  const checked = value === true;
  for (const draft of drafts.value) {
    if (draft.status !== 'imported') {
      draft.selected = checked;
    }
  }
}

function mergeForFillEmpty(draft: DraftProduct, existing?: ProductRecord) {
  if (!existing || draft.fieldMergeStrategy === 'overwrite') return buildProductInput(draft);
  return {
    ...buildProductInput(draft),
    brandId: existing.brand_id || draft.brandId || undefined,
    brightnessNits: existing.brightness_nits ?? draft.brightnessNits,
    category: existing.category || draft.category || defaults.category || '未分类',
    categoryId: existing.category_id || draft.categoryId || undefined,
    chipset: existing.chipset || draft.chipset || undefined,
    companyId: existing.company_id || draft.companyId || undefined,
    description: existing.description || draft.description || undefined,
    name: existing.name || draft.name.trim(),
    osName: existing.os_name || draft.osName || undefined,
    osVersion: existing.os_version || draft.osVersion || undefined,
    poeStandard: existing.poe_standard || draft.poeStandard || undefined,
    poeSupported: existing.poe_supported ?? draft.poeSupported,
    productType: existing.product_type || draft.productType || undefined,
    ramGb: existing.ram_gb ?? draft.ramGb,
    resolutionHeight: existing.resolution_height ?? draft.resolutionHeight,
    resolutionWidth: existing.resolution_width ?? draft.resolutionWidth,
    seriesCode: existing.series_code || draft.seriesCode || draft.model,
    seriesId: existing.series_id || undefined,
    seriesName: existing.series_name || draft.seriesName || defaults.seriesName || draft.model,
    sizeInch: existing.size_inch ?? draft.sizeInch,
    specJson: { ...draft.specJson, ...existing.spec_json },
    storageGb: existing.storage_gb ?? draft.storageGb,
    summaryConfigText: existing.summary_config_text || draft.summaryConfigText || undefined,
    tags: existing.tags?.length ? existing.tags : draft.tags,
  } satisfies SaveProductInput;
}

function formatQuoteTiers(tiers: QuoteTierDraft[]) {
  return tiers.length
    ? tiers.map((tier) => `${tier.minQuantity}+/${tier.currency} ${tier.unitPrice}`).join(' | ')
    : '-';
}

function buildProductInput(draft: DraftProduct): SaveProductInput {
  return {
    brandId: draft.brandId || undefined,
    brightnessNits: draft.brightnessNits,
    category: draft.category || defaults.category || '未分类',
    categoryId: draft.categoryId || undefined,
    chipset: draft.chipset || undefined,
    companyId: draft.companyId || undefined,
    description: draft.description || undefined,
    model: draft.model.trim(),
    name: draft.name.trim(),
    osName: draft.osName || undefined,
    osVersion: draft.osVersion || undefined,
    poeStandard: draft.poeStandard || undefined,
    poeSupported: draft.poeSupported,
    productType: draft.productType || undefined,
    ramGb: draft.ramGb,
    resolutionHeight: draft.resolutionHeight,
    resolutionWidth: draft.resolutionWidth,
    seriesCode: draft.seriesCode || draft.model,
    seriesName: draft.seriesName || defaults.seriesName || draft.model,
    sizeInch: draft.sizeInch,
    specJson: {
      ...draft.specJson,
      excel_file_name: fileName.value,
      quote_sheet_name: quoteSheetName.value,
      source_sheet_name: draft.sourceSheetName,
    },
    status: 'inactive',
    storageGb: draft.storageGb,
    summaryConfigText: draft.summaryConfigText || undefined,
    tags: draft.tags,
  };
}

function openImportConfirm() {
  if (!isAdmin.value) {
    ElMessage.warning('只有管理员可以执行入库');
    return;
  }
  if (!importTargets.value.length) {
    ElMessage.warning('没有符合当前预检条件的商品草稿');
    return;
  }
  importConfirmVisible.value = true;
}

async function resolveProductForDraft(draft: DraftProduct) {
  const existing = findExistingProduct(draft.model);

  if (draft.duplicateStrategy === 'skip') return undefined;

  if (draft.duplicateStrategy === 'only_quote') {
    if (!existing) throw new Error(`${draft.model} 未找到已有商品，无法只新增报价`);
    draft.importedProductId = existing.id;
    return existing;
  }

  if (draft.duplicateStrategy === 'update_existing') {
    if (!existing) throw new Error(`${draft.model} 未找到已有商品，无法更新`);
    const product = await updateProduct(existing.id, mergeForFillEmpty(draft, existing));
    draft.importedProductId = product.id;
    return product;
  }

  const product = await createProduct(buildProductInput(draft));
  draft.importedProductId = product.id;
  return product;
}

async function executeImport() {
  const targets = [...importTargets.value];
  if (!targets.length) {
    ElMessage.warning('没有可入库的商品草稿');
    return;
  }

  const historyRows: Array<{
    action: 'create' | 'failed' | 'quote_only' | 'skip' | 'update';
    errorMessage?: string;
    modelCode?: string;
    quoteLineId?: string;
    rawPayload?: Record<string, unknown>;
    rowIndex?: number;
    status: 'failed' | 'skipped' | 'success' | 'warning';
    variantId?: string;
    warningMessage?: string;
  }> = [];
  let failedRowCount = 0;
  let newProductCount = 0;
  let newQuoteCount = 0;
  let quoteOnlyCount = 0;
  let skippedRowCount = selectedDrafts.value.length - targets.length;
  let updateProductCount = 0;
  const quoteBatchIds = new Set<string>();

  try {
    importing.value = true;
    importConfirmVisible.value = false;
    for (const [index, draft] of targets.entries()) {
      try {
        const product = await resolveProductForDraft(draft);
        let quoteLineId: string | undefined;

        if (draft.duplicateStrategy === 'only_quote') {
          quoteOnlyCount += 1;
        } else if (draft.duplicateStrategy === 'update_existing') {
          updateProductCount += 1;
        } else {
          newProductCount += 1;
        }

        if (product && draft.quoteTiers.length && draft.companyId) {
          const quote = await createQuote({
            batchTitle: quoteBatchTitle.value || `${draft.model} Excel 报价批次`,
            companyId: draft.companyId,
            currency: defaults.currency,
            productId: product.id,
            publishedAt: defaults.publishedAt || undefined,
            remarks: [
              draft.quoteRemarks,
              `来源文件：${fileName.value}`,
              `重复型号策略：${duplicateStrategyLabel(draft.duplicateStrategy)}`,
            ]
              .filter(Boolean)
              .join('\n'),
            standardConfigText: draft.summaryConfigText || undefined,
            status: defaults.status,
            tiers: draft.quoteTiers,
            validFrom: defaults.validFrom || undefined,
          });
          quoteLineId = quote.id;
          newQuoteCount += 1;
          if (quote.batch_id) {
            quoteBatchIds.add(quote.batch_id);
          }
        }

        draft.status = 'imported';
        draft.selected = false;
        historyRows.push({
          action:
            draft.duplicateStrategy === 'only_quote'
              ? 'quote_only'
              : draft.duplicateStrategy === 'update_existing'
                ? 'update'
                : 'create',
          modelCode: draft.model,
          quoteLineId,
          rawPayload: {
            companyId: draft.companyId,
            duplicateStrategy: draft.duplicateStrategy,
            fieldMergeStrategy: draft.fieldMergeStrategy,
            quoteTierCount: draft.quoteTiers.length,
            sourceSheetName: draft.sourceSheetName,
          },
          rowIndex: index + 1,
          status: draft.warnings.length ? 'warning' : 'success',
          variantId: product?.id,
          warningMessage: draft.warnings.join('；') || undefined,
        });
      } catch (error) {
        failedRowCount += 1;
        draft.status = 'error';
        draft.selected = true;
        historyRows.push({
          action: 'failed',
          errorMessage: (error as Error).message || '入库失败',
          modelCode: draft.model,
          rawPayload: {
            companyId: draft.companyId,
            duplicateStrategy: draft.duplicateStrategy,
            fieldMergeStrategy: draft.fieldMergeStrategy,
            quoteTierCount: draft.quoteTiers.length,
            sourceSheetName: draft.sourceSheetName,
          },
          rowIndex: index + 1,
          status: 'failed',
          warningMessage: draft.warnings.join('；') || undefined,
        });
      }
    }

    if (sourceExcelFile.value && quoteBatchIds.size > 0) {
      await saveQuoteWorkbookAttachments({
        companyId: defaults.companyId || undefined,
        file: sourceExcelFile.value,
        quoteBatchIds: [...quoteBatchIds],
        sourceSheetName: quoteSheetName.value,
        title: fileName.value || sourceExcelFile.value.name,
      });
    }

    await createImportHistory({
      failedRowCount,
      fileName: fileName.value || `excel-import-${Date.now()}.xlsx`,
      newProductCount,
      newQuoteCount,
      quoteOnlyCount,
      rows: historyRows,
      skippedRowCount,
      status:
        failedRowCount > 0
          ? historyRows.some((row) => row.status === 'success' || row.status === 'warning')
            ? 'partial_success'
            : 'failed'
          : 'success',
      templateId: currentTemplate.value?.id,
      totalRows: selectedDrafts.value.length,
      updateProductCount,
      warningSummary: {
        anomalyCount: preflightReport.value.anomalyCount,
        duplicateExistingCount: preflightReport.value.duplicateExistingCount,
        duplicateInFileCount: preflightReport.value.duplicateInFileCount,
      },
    });

    await loadOptions();
    await historyPanelRef.value?.refresh();
    ElMessage.success(failedRowCount > 0 ? '入库完成，已有失败记录写入导入历史' : '入库完成');
  } catch (error) {
    ElMessage.error((error as Error).message || '入库失败');
  } finally {
    importing.value = false;
  }
}

function csvCell(value: unknown) {
  const text = normalizeText(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadErrorReport() {
  if (!anomalyRows.value.length) {
    ElMessage.info('当前没有异常行');
    return;
  }
  const rows = [
    ['型号', '名称', '状态', '重复策略', '已有商品', '错误', '警告', '来源 Sheet'],
    ...anomalyRows.value.map((draft) => [
      draft.model,
      draft.name,
      statusLabel(draft.status),
      duplicateStrategyLabel(draft.duplicateStrategy),
      existingProductInfo(draft.model),
      draft.errors.join('；'),
      draft.warnings.join('；'),
      draft.sourceSheetName,
    ]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\n')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName.value || 'excel-import'}-error-report.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function statusType(status: ImportStatus) {
  if (status === 'imported') return 'success';
  if (status === 'error') return 'danger';
  if (status === 'warning') return 'warning';
  if (status === 'skipped') return 'info';
  return 'primary';
}

function statusLabel(status: ImportStatus) {
  return {
    error: '错误',
    imported: '已入库',
    ready: '可入库',
    skipped: '已跳过',
    warning: '需确认',
  }[status];
}

onMounted(async () => {
  workbenchTab.value = normalizeWorkbenchTab(route.query.tab);
  await loadOptions();
});
</script>

<template>
  <Page
    description="围绕 Excel 导入、快速建档、模板维护和导入追踪的一站式工作台"
    title="商品入库工作台"
  >
    <ElAlert
      class="mb-4"
      :closable="false"
      show-icon
      title="结构化 Excel 导入、手动快速建档、模板维护和导入历史已经收拢到同一个工作台中，便于业务按同一流程完成录入。"
      type="info"
    />

    <ElTabs v-model="workbenchTab" @tab-change="handleWorkbenchTabChange">
      <ElTabPane label="Excel 导入" name="excel-import">
        <ElCard shadow="never">
          <ElSteps :active="activeStep" finish-status="success" simple>
            <ElStep title="上传 Excel" />
            <ElStep title="解析字段" />
            <ElStep title="人工确认" />
            <ElStep title="批量入库" />
            <ElStep title="完成" />
          </ElSteps>
        </ElCard>

        <div class="mt-4 grid gap-4 xl:grid-cols-[360px_1fr]">
          <div class="grid gap-4">
            <ElCard shadow="never">
              <template #header>1. 上传与默认设置</template>

            <ElUpload :auto-upload="false" :limit="1" :on-change="handleExcelChange" accept=".xlsx,.xls" drag>
              <div class="py-6">
                <div class="text-base font-medium">拖拽或选择 Excel</div>
                <div class="mt-2 text-sm text-gray-500">支持报价 Sheet + 多个型号详情 Sheet</div>
              </div>
            </ElUpload>

            <ElDivider />

            <ElForm label-width="96px">
              <ElFormItem label="导入模板">
                <ElSelect v-model="selectedTemplateId" clearable filterable placeholder="可不选，默认按内置规则解析" style="width: 100%">
                  <ElOption v-for="template in importTemplates" :key="template.id" :label="template.template_name" :value="template.id" />
                </ElSelect>
              </ElFormItem>
              <ElFormItem v-if="currentTemplate" label="当前模板">
                <div class="text-sm text-gray-600">
                  {{ currentTemplate.template_name }}
                  <span v-if="currentTemplate.supplier_name"> / {{ currentTemplate.supplier_name }}</span>
                </div>
              </ElFormItem>
              <ElFormItem label="默认分类">
                <ElSelect v-model="defaults.categoryId" clearable filterable style="width: 100%">
                  <ElOption v-for="category in categories" :key="category.id" :label="category.name" :value="category.id" />
                </ElSelect>
              </ElFormItem>
              <ElFormItem label="备用分类">
                <ElInput v-model="defaults.category" placeholder="匹配不到分类时使用" />
              </ElFormItem>
              <ElFormItem label="默认品牌">
                <ElSelect v-model="defaults.brandId" clearable filterable style="width: 100%">
                  <ElOption v-for="brand in brands" :key="brand.id" :label="brand.name" :value="brand.id" />
                </ElSelect>
              </ElFormItem>
              <ElFormItem label="默认公司">
                <ElSelect v-model="defaults.companyId" clearable filterable style="width: 100%">
                  <ElOption v-for="company in companies" :key="company.id" :label="company.name" :value="company.id" />
                </ElSelect>
              </ElFormItem>
              <ElFormItem label="默认系列">
                <ElInput v-model="defaults.seriesName" />
              </ElFormItem>
              <ElFormItem label="币种">
                <ElSelect v-model="defaults.currency" style="width: 100%">
                  <ElOption label="USD" value="USD" />
                  <ElOption label="CNY" value="CNY" />
                  <ElOption label="EUR" value="EUR" />
                </ElSelect>
              </ElFormItem>
              <ElFormItem label="报价状态">
                <ElSelect v-model="defaults.status" style="width: 100%">
                  <ElOption label="草稿" value="draft" />
                  <ElOption label="启用" value="active" />
                </ElSelect>
              </ElFormItem>
              <ElFormItem label="生效日期">
                <ElDatePicker v-model="defaults.validFrom" placeholder="报价生效日期" style="width: 100%" type="date" value-format="YYYY-MM-DD" />
              </ElFormItem>
            </ElForm>

              <ElButton class="w-full" type="primary" @click="applyDefaults">应用默认设置到草稿</ElButton>
            </ElCard>

            <QuickCreateDictionaries @created="loadOptions" />
          </div>

          <div class="grid gap-4">
            <ElCard shadow="never">
              <template #header>2. 解析结果</template>
              <ElSpace wrap>
                <ElTag type="primary">文件：{{ fileName || '-' }}</ElTag>
                <ElTag type="success">报价表：{{ quoteSheetName || '-' }}</ElTag>
                <ElTag type="info">Sheet：{{ workbookSheetNames.length }}</ElTag>
                <ElTag type="warning">公司：{{ detectedCompanyName || '待选择' }}</ElTag>
                <ElTag v-if="currentTemplate" type="warning">模板：{{ currentTemplate.template_name }}</ElTag>
              </ElSpace>
              <p class="mt-3 text-sm text-gray-500">{{ parseSummary }}</p>
              <ElProgress v-if="importedCount" class="mt-3" :percentage="completionPercent" />
            </ElCard>

            <ExcelImageImportPanel
              v-if="fileName || excelImageCandidates.length"
              :candidates="excelImageCandidates"
              :products="existingProducts"
              @uploaded="handleExcelImagesUploaded"
            />

            <ElCard shadow="never">
              <template #header>
                <div class="flex items-center justify-between">
                  <span>2.1 导入预检报告</span>
                  <ElSpace>
                    <ElCheckbox v-model="importOnlyNormal">只导入正常行</ElCheckbox>
                    <ElButton size="small" @click="anomalyDialogVisible = true">查看异常行</ElButton>
                    <ElButton size="small" @click="downloadErrorReport">下载错误报告</ElButton>
                  </ElSpace>
                </div>
              </template>

              <ElSpace wrap>
                <ElTag type="primary">选中 {{ preflightReport.selectedCount }} 条</ElTag>
                <ElTag type="success">将导入 {{ preflightReport.importableCount }} 条</ElTag>
                <ElTag type="info">正常 {{ preflightReport.normalCount }} 条</ElTag>
                <ElTag type="warning">跳过 {{ preflightReport.skippedCount }} 条</ElTag>
                <ElTag type="danger">异常 {{ preflightReport.anomalyCount }} 条</ElTag>
              </ElSpace>

              <div class="mt-4 grid gap-3 md:grid-cols-3">
                <ElCard shadow="never">
                  <div class="text-sm text-gray-500">商品计划</div>
                  <div class="mt-2 text-base font-medium">新增 {{ preflightReport.newProductCount }}，更新 {{ preflightReport.updateProductCount }}</div>
                  <div class="mt-1 text-xs text-gray-500">重复型号 {{ preflightReport.duplicateExistingCount + preflightReport.duplicateInFileCount }}</div>
                </ElCard>
                <ElCard shadow="never">
                  <div class="text-sm text-gray-500">报价计划</div>
                  <div class="mt-2 text-base font-medium">新增批次 {{ preflightReport.quoteBatchCount }}，新增阶梯价 {{ preflightReport.quoteTierCount }}</div>
                  <div class="mt-1 text-xs text-gray-500">只新增报价 {{ preflightReport.quoteOnlyCount }}</div>
                </ElCard>
                <ElCard shadow="never">
                  <div class="text-sm text-gray-500">缺失风险</div>
                  <div class="mt-2 text-xs leading-6 text-gray-600">
                    分类 {{ preflightReport.missingCategoryCount }} / 品牌 {{ preflightReport.missingBrandCount }} / 公司 {{ preflightReport.missingCompanyCount }} / 报价 {{ preflightReport.missingQuoteCount }} / 规格 {{ preflightReport.missingSpecCount }} / 图片 {{ preflightReport.missingImageCount }}
                  </div>
                </ElCard>
              </div>
            </ElCard>

            <ElCard shadow="never">
              <template #header>
                <div class="flex items-center justify-between">
                  <span>2.2 重复型号处理</span>
                  <ElSpace>
                    <ElTag type="warning">重复型号 {{ duplicateDrafts.length }}</ElTag>
                    <ElSelect v-model="bulkDuplicateStrategy" size="small" style="width: 150px">
                      <ElOption label="只新增报价" value="only_quote" />
                      <ElOption label="更新已有商品" value="update_existing" />
                      <ElOption label="跳过该商品" value="skip" />
                      <ElOption label="作为新商品创建" value="create_new" />
                    </ElSelect>
                    <ElButton size="small" @click="applyDuplicateStrategyToAll">批量设置</ElButton>
                  </ElSpace>
                </div>
              </template>
              <ElAlert :closable="false" show-icon title="默认不会静默合并重复型号，需逐行确认是新建、更新、只增报价还是跳过。" type="warning" />
            </ElCard>

            <ElCard shadow="never">
              <template #header>
                <div class="flex items-center justify-between">
                  <span>3. 商品草稿确认</span>
                  <ElSpace>
                    <ElCheckbox @change="toggleAll">全选/取消</ElCheckbox>
                    <ElTag type="success">可入库 {{ readyCount }}</ElTag>
                    <ElTag type="info">总数 {{ drafts.length }}</ElTag>
                  </ElSpace>
                </div>
              </template>

              <ElTable v-if="drafts.length" :data="drafts" max-height="620" stripe>
                <ElTableColumn width="54">
                  <template #default="{ row }">
                    <ElCheckbox v-model="row.selected" :disabled="row.status === 'imported' || row.status === 'skipped'" />
                  </template>
                </ElTableColumn>
                <ElTableColumn label="状态" width="90">
                  <template #default="{ row }">
                    <ElTag :type="statusType(row.status)">{{ statusLabel(row.status) }}</ElTag>
                  </template>
                </ElTableColumn>
                <ElTableColumn label="型号" min-width="150">
                  <template #default="{ row }"><ElInput v-model="row.model" @blur="validateDraft(row)" /></template>
                </ElTableColumn>
                <ElTableColumn label="重复处理" min-width="180">
                  <template #default="{ row }">
                    <ElSelect v-model="row.duplicateStrategy" style="width: 100%" @change="validateDraft(row)">
                      <ElOption label="作为新商品创建" value="create_new" />
                      <ElOption label="更新已有商品" value="update_existing" />
                      <ElOption label="只新增报价" value="only_quote" />
                      <ElOption label="跳过该商品" value="skip" />
                    </ElSelect>
                  </template>
                </ElTableColumn>
                <ElTableColumn label="商品名称" min-width="220">
                  <template #default="{ row }"><ElInput v-model="row.name" @blur="validateDraft(row)" /></template>
                </ElTableColumn>
                <ElTableColumn label="分类" min-width="180">
                  <template #default="{ row }"><ElInput v-model="row.category" @blur="validateDraft(row)" /></template>
                </ElTableColumn>
                <ElTableColumn label="公司" min-width="180">
                  <template #default="{ row }">
                    <ElSelect v-model="row.companyId" clearable filterable style="width: 100%">
                      <ElOption v-for="company in companies" :key="company.id" :label="company.name" :value="company.id" />
                    </ElSelect>
                  </template>
                </ElTableColumn>
                <ElTableColumn label="已有商品" min-width="260">
                  <template #default="{ row }"><span class="text-xs text-gray-500">{{ existingProductInfo(row.model) || '-' }}</span></template>
                </ElTableColumn>
                <ElTableColumn label="报价阶梯" min-width="240">
                  <template #default="{ row }">{{ formatQuoteTiers(row.quoteTiers) }}</template>
                </ElTableColumn>
                <ElTableColumn label="提示" min-width="300">
                  <template #default="{ row }">
                    <ElSpace wrap>
                      <ElTag v-for="error in row.errors" :key="error" type="danger">{{ error }}</ElTag>
                      <ElTag v-for="warning in row.warnings" :key="warning" type="warning">{{ warning }}</ElTag>
                    </ElSpace>
                  </template>
                </ElTableColumn>
              </ElTable>
              <ElEmpty v-else description="请先上传 Excel" />
            </ElCard>

            <ElCard shadow="never">
              <template #header>4. 入库确认</template>
              <ElSpace wrap>
                <ElTag>选中 {{ selectedDrafts.length }} 条</ElTag>
                <ElTag type="success">当前将导入 {{ importTargets.length }} 条</ElTag>
                <ElTag type="warning">产品状态：停用</ElTag>
                <ElTag type="warning">报价状态：{{ defaults.status === 'draft' ? '草稿' : '启用' }}</ElTag>
              </ElSpace>
              <div class="mt-4">
                <ElButton :disabled="!isAdmin || importTargets.length === 0" :loading="importing || parsing" type="primary" @click="openImportConfirm">
                  确认入库
                </ElButton>
                <span class="ml-3 text-sm text-gray-500">确认后会先写商品和报价，再把本次结果写入导入历史。</span>
              </div>
            </ElCard>
          </div>
        </div>
      </ElTabPane>

      <ElTabPane label="快速建档" name="manual-entry">
        <ManualEntryPanel />
      </ElTabPane>

      <ElTabPane label="导入模板" name="import-templates">
        <ImportTemplatesPanel @changed="handleImportTemplateChanged" />
      </ElTabPane>

      <ElTabPane label="导入历史" name="import-history">
        <ImportHistoryPanel ref="historyPanelRef" />
      </ElTabPane>
    </ElTabs>

    <ElDialog v-model="anomalyDialogVisible" title="异常行明细" width="1080px">
      <ElTable v-if="anomalyRows.length" :data="anomalyRows" max-height="460" stripe>
        <ElTableColumn label="状态" width="90">
          <template #default="{ row }"><ElTag :type="statusType(row.status)">{{ statusLabel(row.status) }}</ElTag></template>
        </ElTableColumn>
        <ElTableColumn label="型号" min-width="140" prop="model" />
        <ElTableColumn label="重复策略" min-width="130">
          <template #default="{ row }">{{ duplicateStrategyLabel(row.duplicateStrategy) }}</template>
        </ElTableColumn>
        <ElTableColumn label="已有商品" min-width="260">
          <template #default="{ row }">{{ existingProductInfo(row.model) || '-' }}</template>
        </ElTableColumn>
        <ElTableColumn label="来源 Sheet" min-width="140" prop="sourceSheetName" />
        <ElTableColumn label="错误/警告" min-width="320">
          <template #default="{ row }">
            <ElSpace wrap>
              <ElTag v-for="error in row.errors" :key="error" type="danger">{{ error }}</ElTag>
              <ElTag v-for="warning in row.warnings" :key="warning" type="warning">{{ warning }}</ElTag>
            </ElSpace>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElEmpty v-else description="当前没有异常行" />
    </ElDialog>

    <ElDialog v-model="importConfirmVisible" title="确认本次导入计划" width="660px">
      <div class="leading-7 text-sm text-gray-600">
        <p>商品：新增 {{ preflightReport.newProductCount }} 个，更新 {{ preflightReport.updateProductCount }} 个，跳过 {{ preflightReport.skippedCount }} 个</p>
        <p>报价：新增批次 {{ preflightReport.quoteBatchCount }} 个，只新增报价 {{ preflightReport.quoteOnlyCount }} 条，新增阶梯价 {{ preflightReport.quoteTierCount }} 条</p>
        <p>风险：重复型号 {{ preflightReport.duplicateExistingCount + preflightReport.duplicateInFileCount }} 个，缺公司 {{ preflightReport.missingCompanyCount }} 个，缺报价 {{ preflightReport.missingQuoteCount }} 个</p>
        <p>当前策略：{{ importOnlyNormal ? '只导入无错误且无警告的正常行' : '导入无错误行，警告行按管理员所选重复策略执行' }}</p>
      </div>
      <template #footer>
        <ElButton @click="importConfirmVisible = false">取消</ElButton>
        <ElButton :loading="importing" type="primary" @click="executeImport">确认执行入库</ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
