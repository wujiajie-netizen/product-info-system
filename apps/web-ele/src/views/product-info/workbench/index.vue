<script lang="ts" setup>
import type {
  BrandRecord,
  CategoryRecord,
  CompanyRecord,
  ProductRecord,
  SaveProductInput,
  SaveQuoteTierInput,
} from '#/api';
import type { UploadFile } from 'element-plus';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElCard,
  ElCheckbox,
  ElDatePicker,
  ElDivider,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElProgress,
  ElSelect,
  ElSpace,
  ElStep,
  ElSteps,
  ElTable,
  ElTableColumn,
  ElTag,
  ElUpload,
} from 'element-plus';
import { read, utils } from 'xlsx';

import {
  createProduct,
  createQuote,
  listBrands,
  listCategories,
  listCompanies,
  listProducts,
} from '#/api';

type QuoteTierDraft = SaveQuoteTierInput;

type ImportStatus = 'error' | 'imported' | 'ready' | 'skipped' | 'warning';

interface DraftProduct {
  brandId: string;
  brightnessNits?: number;
  category: string;
  categoryId: string;
  chipset: string;
  companyId: string;
  description: string;
  errors: string[];
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

const userStore = useUserStore();
const isAdmin = computed(() => userStore.userRoles.includes('admin'));

const categories = ref<CategoryRecord[]>([]);
const brands = ref<BrandRecord[]>([]);
const companies = ref<CompanyRecord[]>([]);
const existingProducts = ref<ProductRecord[]>([]);
const drafts = ref<DraftProduct[]>([]);
const parsing = ref(false);
const importing = ref(false);
const fileName = ref('');
const workbookSheetNames = ref<string[]>([]);
const quoteSheetName = ref('');
const quoteBatchTitle = ref('');
const detectedCompanyName = ref('');
const parseSummary = ref('尚未上传 Excel');

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

const activeStep = computed(() => {
  if (importing.value) {
    return 3;
  }

  if (drafts.value.some((item) => item.status === 'imported')) {
    return 4;
  }

  if (drafts.value.length > 0) {
    return 2;
  }

  if (fileName.value) {
    return 1;
  }

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
  if (drafts.value.length === 0) {
    return 0;
  }

  return Math.round((importedCount.value / drafts.value.length) * 100);
});

function normalizeText(value: unknown) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function lower(value: unknown) {
  return normalizeText(value).toLowerCase();
}

function parseNumber(value: unknown) {
  const matched = normalizeText(value).match(/-?\d+(?:\.\d+)?/);
  return matched ? Number(matched[0]) : undefined;
}

function parseBoolean(value: unknown) {
  const text = lower(value);
  if (!text) {
    return undefined;
  }

  if (['no', 'none', '否', '不支持', 'n/a'].some((item) => text.includes(item))) {
    return false;
  }

  if (['yes', 'support', '支持', '802.3', 'poe'].some((item) => text.includes(item))) {
    return true;
  }

  return undefined;
}

function parseResolution(value: unknown) {
  const text = normalizeText(value);
  const matched = text.match(/(\d{3,5})\s*[xX*×]\s*(\d{3,5})/);
  if (!matched) {
    return {};
  }

  return {
    resolutionHeight: Number(matched[2]),
    resolutionWidth: Number(matched[1]),
  };
}

function splitTags(value: string) {
  return value
    .split(/[,，/|]/)
    .map((item) => item.trim())
    .filter(Boolean);
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

function findCompanyName(rows: unknown[][]) {
  const allText = rows
    .slice(0, 8)
    .flat()
    .map((cell) => normalizeText(cell))
    .filter(Boolean);

  return (
    allText.find((text) => /co\.?\s*,?\s*ltd|company|公司/i.test(text)) || ''
  );
}

function findQuoteSheet(sheetNames: string[]) {
  return (
    sheetNames.find((name) => name.includes('报价')) ||
    sheetNames.find((name) => /quote/i.test(name)) ||
    sheetNames[0] ||
    ''
  );
}

function getSheetRows(workbook: ReturnType<typeof read>, sheetName: string) {
  return utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
    defval: '',
    header: 1,
    raw: false,
  });
}

function extractQuoteRows(workbook: ReturnType<typeof read>) {
  const sheetName = findQuoteSheet(workbook.SheetNames);
  const rows = getSheetRows(workbook, sheetName);
  const headerIndex = findHeaderIndex(rows);
  const headers = rows[headerIndex] || [];
  const modelColumn = findColumn(headers, ['机型', '型号', 'model']);
  const sizeColumn = findColumn(headers, ['尺寸', 'size']);
  const configColumn = findColumn(headers, ['标准配置', '配置', 'config']);
  const imageColumn = findColumn(headers, ['产品图片', '图片', 'image']);
  const remarkColumn = findColumn(headers, ['备注', '选配', 'remark']);
  const tierColumns = headers
    .map((header, index) => ({ header: normalizeText(header), index }))
    .map((item) => {
      const quantity = parseNumber(item.header);
      const isPriceColumn = /价|price|usd|cny/i.test(item.header);
      return quantity && isPriceColumn
        ? { index: item.index, minQuantity: quantity }
        : null;
    })
    .filter(Boolean) as Array<{ index: number; minQuantity: number }>;

  const dataRows = headerIndex >= 0 ? rows.slice(headerIndex + 1) : [];
  const quoteMap = new Map<string, Partial<DraftProduct>>();

  for (const row of dataRows) {
    const model = getByColumn(row, modelColumn);
    if (!model || !/[a-z0-9]/i.test(model)) {
      continue;
    }

    const tiers = tierColumns
      .map((column) => ({
        currency: defaults.currency,
        minQuantity: column.minQuantity,
        unitPrice: parseNumber(row[column.index]),
      }))
      .filter((tier) => typeof tier.unitPrice === 'number') as QuoteTierDraft[];

    const sizeValue = getByColumn(row, sizeColumn);
    const configText = getByColumn(row, configColumn);
    const remarks = [
      getByColumn(row, remarkColumn),
      imageColumn >= 0 ? getByColumn(row, imageColumn) : '',
    ]
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
      if (!text) {
        continue;
      }

      if (normalizedLabels.some((label) => text === label || text.includes(label))) {
        for (let offset = 1; offset <= 4; offset += 1) {
          const value = normalizeText(row[index + offset]);
          if (value && !normalizedLabels.includes(value.toLowerCase())) {
            return value;
          }
        }
      }
    }
  }

  return '';
}

function extractSpecFromSheet(workbook: ReturnType<typeof read>, sheetName: string) {
  const rows = getSheetRows(workbook, sheetName);
  const model = findValue(rows, ['model no', 'model', '型号']) || sheetName;
  const productType = findValue(rows, ['product type', '产品类型']);
  const description = findValue(rows, ['product description', 'description', '产品描述']);
  const cpu = findValue(rows, ['cpu', 'chipset', '芯片']);
  const ram = findValue(rows, ['ram', 'memory', '内存']);
  const storage = findValue(rows, ['internal memory', 'storage', '存储']);
  const os = findValue(rows, ['operation system', 'os', '系统']);
  const panelSize = findValue(rows, ['panel size', 'size', '尺寸']);
  const resolution = findValue(rows, ['resolution', '分辨率']);
  const luminance = findValue(rows, ['luminance', 'brightness', '亮度']);
  const poe = findValue(rows, ['poe']);
  const productName = description || `${model} ${productType || ''}`.trim();
  const resolutionResult = parseResolution(resolution);

  const specJson: Record<string, unknown> = {};
  for (const row of rows) {
    const key = normalizeText(row[0] || row[1]);
    const value = normalizeText(row[1] || row[2]);
    if (key && value && key !== value) {
      specJson[key] = value;
    }
  }

  return {
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
    specJson: {
      ...specJson,
      luminance,
      os,
      panel_size: panelSize,
      poe,
      resolution,
      storage,
    },
    storageGb: parseNumber(storage),
    brightnessNits: parseNumber(luminance),
  } as Partial<DraftProduct>;
}

function buildDrafts(workbook: ReturnType<typeof read>) {
  const quoteMap = extractQuoteRows(workbook);
  const draftMap = new Map<string, DraftProduct>();

  for (const [model, quoteDraft] of quoteMap) {
    draftMap.set(model, createEmptyDraft(model, quoteDraft));
  }

  for (const sheetName of workbook.SheetNames) {
    if (sheetName === quoteSheetName.value) {
      continue;
    }

    const specDraft = extractSpecFromSheet(workbook, sheetName);
    const model = normalizeText(specDraft.model || sheetName);
    const existing = draftMap.get(model) || createEmptyDraft(model, {});
    draftMap.set(model, mergeDraft(existing, specDraft));
  }

  const records = [...draftMap.values()].map(validateDraft);
  drafts.value = records;
  parseSummary.value = `识别 ${workbook.SheetNames.length} 个工作表，生成 ${records.length} 条商品草稿，报价表：${quoteSheetName.value || '未识别'}`;
}

function createEmptyDraft(model: string, partial: Partial<DraftProduct>): DraftProduct {
  return {
    brandId: defaults.brandId,
    category: defaults.category,
    categoryId: defaults.categoryId,
    chipset: '',
    companyId: defaults.companyId,
    description: '',
    errors: [],
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
    quoteRemarks: partial.quoteRemarks || base.quoteRemarks,
    quoteTiers: partial.quoteTiers?.length ? partial.quoteTiers : base.quoteTiers,
    specJson: {
      ...base.specJson,
      ...partial.specJson,
    },
    summaryConfigText: partial.summaryConfigText || base.summaryConfigText,
  } satisfies DraftProduct;
}

function validateDraft(draft: DraftProduct) {
  draft.errors = [];
  draft.warnings = [];

  if (!draft.model) {
    draft.errors.push('缺少型号');
  }

  if (!draft.name) {
    draft.errors.push('缺少产品名称');
  }

  if (!draft.category && !draft.categoryId) {
    draft.errors.push('缺少分类');
  }

  if (
    existingProducts.value.some(
      (item) => item.model.toLowerCase() === draft.model.toLowerCase(),
    )
  ) {
    draft.warnings.push('型号已存在，导入会尝试新建，建议人工确认');
  }

  if (!draft.quoteTiers.length) {
    draft.warnings.push('缺少报价阶梯');
  }

  if (!draft.sourceSheetName) {
    draft.warnings.push('缺少详情 Sheet');
  }

  draft.status = draft.errors.length ? 'error' : draft.warnings.length ? 'warning' : 'ready';
  return draft;
}

async function handleExcelChange(file: UploadFile) {
  const rawFile = file.raw;
  if (!rawFile) {
    return;
  }

  fileName.value = rawFile.name;
  parsing.value = true;

  try {
    const buffer = await rawFile.arrayBuffer();
    const workbook = read(buffer, { cellDates: true, type: 'array' });
    workbookSheetNames.value = workbook.SheetNames;
    buildDrafts(workbook);
    ElMessage.success('Excel 解析完成，请确认草稿后入库');
  } catch (error) {
    ElMessage.error((error as Error).message || 'Excel 解析失败');
  } finally {
    parsing.value = false;
  }
}

async function loadOptions() {
  const [categoryRecords, brandRecords, companyRecords, productRecords] =
    await Promise.all([
      listCategories(),
      listBrands(),
      listCompanies(),
      listProducts(),
    ]);

  categories.value = categoryRecords;
  brands.value = brandRecords;
  companies.value = companyRecords;
  existingProducts.value = productRecords;
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

function toggleAll(value: boolean) {
  for (const draft of drafts.value) {
    if (draft.status !== 'imported') {
      draft.selected = value;
    }
  }
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

async function confirmImport() {
  if (!isAdmin.value) {
    ElMessage.warning('只有管理员可以执行入库');
    return;
  }

  const targets = selectedDrafts.value.filter((draft) => draft.errors.length === 0);
  if (!targets.length) {
    ElMessage.warning('没有可入库的商品草稿');
    return;
  }

  try {
    importing.value = true;
    for (const draft of targets) {
      const product = await createProduct(buildProductInput(draft));
      draft.importedProductId = product.id;

      if (draft.quoteTiers.length && draft.companyId) {
        await createQuote({
          batchTitle: quoteBatchTitle.value || `${draft.model} Excel 报价批次`,
          companyId: draft.companyId,
          currency: defaults.currency,
          productId: product.id,
          publishedAt: defaults.publishedAt || undefined,
          remarks: [draft.quoteRemarks, `来源文件：${fileName.value}`]
            .filter(Boolean)
            .join('\n'),
          standardConfigText: draft.summaryConfigText || undefined,
          status: defaults.status,
          tiers: draft.quoteTiers,
          validFrom: defaults.validFrom || undefined,
        });
      }

      draft.status = 'imported';
      draft.selected = false;
    }

    ElMessage.success('入库完成');
    await loadOptions();
  } catch (error) {
    ElMessage.error((error as Error).message || '入库失败');
  } finally {
    importing.value = false;
  }
}

function statusType(status: ImportStatus) {
  if (status === 'imported') {
    return 'success';
  }

  if (status === 'error') {
    return 'danger';
  }

  if (status === 'warning') {
    return 'warning';
  }

  if (status === 'skipped') {
    return 'info';
  }

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

onMounted(loadOptions);
</script>

<template>
  <Page
    description="上传真实报价 Excel，自动解析商品、规格和阶梯价，确认后批量入库"
    title="Excel 商品快速入库工作台"
  >
    <ElAlert
      class="mb-4"
      :closable="false"
      show-icon
      title="适配结构：报价总表 + 多个型号详情 Sheet。Excel 属于结构化解析，不依赖 AI；AI 仅用于后续 PDF、图片报价单等非结构化资料。"
      type="info"
    />

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
      <ElCard shadow="never">
        <template #header>1. 上传与默认设置</template>

        <ElUpload
          :auto-upload="false"
          :limit="1"
          :on-change="handleExcelChange"
          accept=".xlsx,.xls"
          drag
        >
          <div class="py-6">
            <div class="text-base font-medium">拖拽或选择 Excel</div>
            <div class="mt-2 text-sm text-gray-500">支持报价 Sheet + 型号详情 Sheet</div>
          </div>
        </ElUpload>

        <ElDivider />

        <ElForm label-width="88px">
          <ElFormItem label="默认分类">
            <ElSelect v-model="defaults.categoryId" clearable filterable style="width: 100%">
              <ElOption
                v-for="category in categories"
                :key="category.id"
                :label="category.name"
                :value="category.id"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="备用分类">
            <ElInput v-model="defaults.category" placeholder="匹配不到分类时使用" />
          </ElFormItem>
          <ElFormItem label="默认品牌">
            <ElSelect v-model="defaults.brandId" clearable filterable style="width: 100%">
              <ElOption
                v-for="brand in brands"
                :key="brand.id"
                :label="brand.name"
                :value="brand.id"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="默认公司">
            <ElSelect v-model="defaults.companyId" clearable filterable style="width: 100%">
              <ElOption
                v-for="company in companies"
                :key="company.id"
                :label="company.name"
                :value="company.id"
              />
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
            <ElDatePicker
              v-model="defaults.validFrom"
              placeholder="报价生效日期"
              style="width: 100%"
              type="date"
              value-format="YYYY-MM-DD"
            />
          </ElFormItem>
        </ElForm>

        <ElButton class="w-full" type="primary" @click="applyDefaults">
          应用默认设置到草稿
        </ElButton>
      </ElCard>

      <div class="grid gap-4">
        <ElCard shadow="never">
          <template #header>2. 解析结果</template>
          <ElSpace wrap>
            <ElTag type="primary">文件：{{ fileName || '-' }}</ElTag>
            <ElTag type="success">报价表：{{ quoteSheetName || '-' }}</ElTag>
            <ElTag type="info">Sheet：{{ workbookSheetNames.length }}</ElTag>
            <ElTag type="warning">公司：{{ detectedCompanyName || '待选择' }}</ElTag>
          </ElSpace>
          <p class="mt-3 text-sm text-gray-500">{{ parseSummary }}</p>
          <ElProgress v-if="importedCount" class="mt-3" :percentage="completionPercent" />
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

          <ElTable v-if="drafts.length" :data="drafts" max-height="520" stripe>
            <ElTableColumn width="54">
              <template #default="{ row }">
                <ElCheckbox v-model="row.selected" :disabled="row.status === 'imported'" />
              </template>
            </ElTableColumn>
            <ElTableColumn label="状态" width="90">
              <template #default="{ row }">
                <ElTag :type="statusType(row.status)">{{ statusLabel(row.status) }}</ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn label="型号" min-width="150">
              <template #default="{ row }">
                <ElInput v-model="row.model" @blur="validateDraft(row)" />
              </template>
            </ElTableColumn>
            <ElTableColumn label="产品名称" min-width="220">
              <template #default="{ row }">
                <ElInput v-model="row.name" @blur="validateDraft(row)" />
              </template>
            </ElTableColumn>
            <ElTableColumn label="系列" min-width="180">
              <template #default="{ row }">
                <ElInput v-model="row.seriesName" />
              </template>
            </ElTableColumn>
            <ElTableColumn label="分类" min-width="180">
              <template #default="{ row }">
                <ElInput v-model="row.category" @blur="validateDraft(row)" />
              </template>
            </ElTableColumn>
            <ElTableColumn label="公司" min-width="180">
              <template #default="{ row }">
                <ElSelect v-model="row.companyId" clearable filterable style="width: 100%">
                  <ElOption
                    v-for="company in companies"
                    :key="company.id"
                    :label="company.name"
                    :value="company.id"
                  />
                </ElSelect>
              </template>
            </ElTableColumn>
            <ElTableColumn label="尺寸" width="120">
              <template #default="{ row }">
                <ElInputNumber v-model="row.sizeInch" :min="0" controls-position="right" />
              </template>
            </ElTableColumn>
            <ElTableColumn label="芯片" min-width="140">
              <template #default="{ row }">
                <ElInput v-model="row.chipset" />
              </template>
            </ElTableColumn>
            <ElTableColumn label="RAM/存储" min-width="190">
              <template #default="{ row }">
                <ElSpace>
                  <ElInputNumber v-model="row.ramGb" :min="0" controls-position="right" />
                  <ElInputNumber v-model="row.storageGb" :min="0" controls-position="right" />
                </ElSpace>
              </template>
            </ElTableColumn>
            <ElTableColumn label="分辨率" min-width="190">
              <template #default="{ row }">
                <ElSpace>
                  <ElInputNumber v-model="row.resolutionWidth" :min="0" controls-position="right" />
                  <ElInputNumber v-model="row.resolutionHeight" :min="0" controls-position="right" />
                </ElSpace>
              </template>
            </ElTableColumn>
            <ElTableColumn label="报价阶梯" min-width="240">
              <template #default="{ row }">
                <div>{{ row.quoteTiers.map((tier) => `${tier.minQuantity}+/${tier.currency} ${tier.unitPrice}`).join(' | ') || '-' }}</div>
              </template>
            </ElTableColumn>
            <ElTableColumn label="提示" min-width="260">
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
            <ElTag type="success">可入库 {{ readyCount }} 条</ElTag>
            <ElTag type="warning">默认商品状态：停用</ElTag>
            <ElTag type="warning">报价状态：{{ defaults.status === 'draft' ? '草稿' : '启用' }}</ElTag>
          </ElSpace>
          <div class="mt-4">
            <ElButton
              :disabled="!isAdmin || readyCount === 0"
              :loading="importing || parsing"
              type="primary"
              @click="confirmImport"
            >
              确认入库
            </ElButton>
            <span class="ml-3 text-sm text-gray-500">
              入库会复用现有产品和报价接口；Excel 原始文件、图片提取和复杂选配项结构化将在下一阶段补齐。
            </span>
          </div>
        </ElCard>
      </div>
    </div>
  </Page>
</template>
