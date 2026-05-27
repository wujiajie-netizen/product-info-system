# 商品入库工作台剩余接线说明

本文档记录 `feature-workbench` 分支中已经补齐但尚未完全接入 `workbench/index.vue` 主页面的能力，便于在 Codex 额度较少时只执行最小修改。

## 已完成的可复用能力

### 2.4 原始 Excel 保存为报价附件

文件：

- `apps/web-ele/src/api/product-info/import-attachments.ts`

可用函数：

```ts
saveQuoteWorkbookAttachments({
  file,
  quoteBatchIds,
  companyId,
  sourceSheetName,
  title,
});
```

用途：把原始 Excel 作为 `fileType = quote`、`documentKind = quote_workbook` 上传到 `documents`，并关联到 `quote_batch_id`。

### 2.5 Excel 嵌入图片提取与产品图片关联

文件：

- `apps/web-ele/src/views/product-info/workbench/utils/excel-image-extractor.ts`
- `apps/web-ele/src/views/product-info/workbench/components/excel-image-import-panel.vue`

能力：

- 从 Excel 的 `xl/media/*` 提取图片；
- 按图片文件名匹配产品型号或产品名称；
- 提供图片预览、手动选择关联产品、上传为 `product_image`。

### 2.6 快速创建分类 / 品牌 / 公司

文件：

- `apps/web-ele/src/views/product-info/workbench/components/quick-create-dictionaries.vue`

能力：

- 快速新建分类、品牌、公司；
- 创建成功后触发 `created` 事件；
- 主页面接 `@created="loadOptions"` 即可刷新下拉选项。

## 需要在 `workbench/index.vue` 中接入的最小修改

目标文件：

- `apps/web-ele/src/views/product-info/workbench/index.vue`

### 1. import 区补充

在 `import type { ... } from '#/api';` 中加入：

```ts
DocumentRecord,
```

新增类型导入：

```ts
import type { ExcelImageCandidate } from './utils/excel-image-extractor';
```

在 `#/api` 函数导入中加入：

```ts
saveQuoteWorkbookAttachments,
```

新增组件/工具导入：

```ts
import ExcelImageImportPanel from './components/excel-image-import-panel.vue';
import QuickCreateDictionaries from './components/quick-create-dictionaries.vue';
import { extractExcelEmbeddedImages } from './utils/excel-image-extractor';
```

### 2. state 区补充

在 `fileName` 附近增加：

```ts
const sourceExcelFile = ref<File>();
const excelImageCandidates = ref<ExcelImageCandidate[]>([]);
const uploadedExcelImageDocuments = ref<DocumentRecord[]>([]);
```

### 3. `handleExcelChange()` 接图片提取和原始文件保存

在 `fileName.value = rawFile.name;` 后增加：

```ts
sourceExcelFile.value = rawFile;
excelImageCandidates.value = [];
uploadedExcelImageDocuments.value = [];
```

在 `buildDrafts(workbook);` 后增加：

```ts
excelImageCandidates.value = await extractExcelEmbeddedImages(rawFile, existingProducts.value);
```

建议最终结构：

```ts
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
```

### 4. 新增图片上传回调

在 `handleImportTemplateChanged()` 附近增加：

```ts
function handleExcelImagesUploaded(documents: DocumentRecord[]) {
  uploadedExcelImageDocuments.value = documents;
  ElMessage.success(`已关联 ${documents.length} 张 Excel 图片`);
}
```

### 5. `executeImport()` 接原始 Excel 附件

在计数变量附近增加：

```ts
const quoteBatchIds = new Set<string>();
```

在 `createQuote()` 后，当前已有：

```ts
quoteLineId = quote.id;
newQuoteCount += 1;
```

在其后增加：

```ts
if (quote.batch_id) {
  quoteBatchIds.add(quote.batch_id);
}
```

在 `createImportHistory()` 之前或之后增加：

```ts
if (sourceExcelFile.value && quoteBatchIds.size > 0) {
  await saveQuoteWorkbookAttachments({
    companyId: defaults.companyId || undefined,
    file: sourceExcelFile.value,
    quoteBatchIds: [...quoteBatchIds],
    sourceSheetName: quoteSheetName.value,
    title: fileName.value || sourceExcelFile.value.name,
  });
}
```

建议放在 `createImportHistory()` 之前，这样历史记录前附件已创建；如果担心附件失败影响导入，可放在 `createImportHistory()` 后，并用单独 try/catch 只提示警告。

### 6. template 中挂快速创建面板

在左侧上传与默认设置卡片结束后、右侧解析结果前，或者默认设置按钮下面增加：

```vue
<QuickCreateDictionaries class="mt-4" @created="loadOptions" />
```

推荐位置：`应用默认设置到草稿` 按钮后面。

### 7. template 中挂 Excel 图片面板

在右侧 `2. 解析结果` 卡片之后、`2.1 导入预检报告` 之前增加：

```vue
<ExcelImageImportPanel
  :candidates="excelImageCandidates"
  :products="existingProducts"
  @uploaded="handleExcelImagesUploaded"
/>
```

如果担心空状态占空间，可以加：

```vue
<ExcelImageImportPanel
  v-if="fileName || excelImageCandidates.length"
  :candidates="excelImageCandidates"
  :products="existingProducts"
  @uploaded="handleExcelImagesUploaded"
/>
```

## 验收命令

```bash
pnpm run check:type
pnpm run build:ele
```

## 验收场景

1. 上传 Excel 后仍能正常生成商品草稿。
2. 页面显示 Excel 图片确认区。
3. 有内嵌图片时可预览、选择产品并上传。
4. 缺分类、品牌、公司时，可在工作台直接新建，并刷新下拉框。
5. 确认入库后，原始 Excel 能作为报价附件关联到报价批次。
6. 导入历史、报价详情、文件资料页面均不报错。
