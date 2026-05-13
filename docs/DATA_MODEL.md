# 数据模型设计

## 目的

本文档用于沉淀真实报价包驱动的新数据模型，作为后续 migration、API、类型定义、后台录入页和前台展示页的共同真源。  
当前阶段只做文档设计，不直接编写数据库脚本。

## 设计原则

- 产品采用“系列 + 变体”两层。
- 报价采用“批次 + 报价行 + 阶梯价 + 选配项”四层。
- 完整规格以 `product_spec_items` 为真源，常用筛选字段再投影到变体表。
- 原始 Excel 作为文档对象保存，不直接等同于结构化报价记录。
- 文档、图片、图纸、规格资料与报价记录并列建模，不互相混用。

## 核心对象关系

```text
companies
  ├─ product_series
  │    └─ product_variants
  │         └─ product_spec_items
  │
  ├─ documents
  │    ├─ 原始报价工作簿
  │    ├─ 规格资料
  │    ├─ 产品图片
  │    └─ 尺寸图/结构图
  │
  └─ quote_batches
       └─ quote_lines
            ├─ quote_price_tiers
            └─ quote_options
```

## 表设计

### `categories`

用途：商品分类，支持层级导航。

建议字段：

- `id`
- `parent_id`
- `name`
- `slug`
- `description`
- `sort_order`
- `status`
- `created_at`
- `updated_at`

### `brands`

用途：品牌或产品线。

建议字段：

- `id`
- `name`
- `slug`
- `aliases`
- `description`
- `website_url`
- `status`
- `created_at`
- `updated_at`

### `companies`

用途：供应商、品牌方、报价来源公司。

建议字段：

- `id`
- `name`
- `slug`
- `type`
- `contact_name`
- `contact_phone`
- `contact_email`
- `website_url`
- `address`
- `description`
- `status`
- `created_at`
- `updated_at`

说明：

- 当前真实样本中，`SHENZHEN HOPESTAR SCI-TECH CO.,LTD` 应作为供应商公司记录。

### `product_series`

用途：系列主对象，承载前台详情页与后台管理页的主入口。

建议字段：

- `id`
- `company_id`
- `category_id`
- `brand_id`
- `series_code`
- `series_name`
- `product_type`
- `base_description`
- `default_material`
- `status`
- `created_at`
- `updated_at`

说明：

- 一个系列对应多个变体。
- 前台详情页主对象是系列，而不是单个型号。

### `product_variants`

用途：型号级变体，承载筛选、对比、报价和资料关联。

建议字段：

- `id`
- `series_id`
- `model_code`
- `display_name`
- `size_inch`
- `chipset`
- `ram_gb`
- `storage_gb`
- `os_name`
- `os_version`
- `camera_mp`
- `brightness_nits`
- `resolution_width`
- `resolution_height`
- `touch_type`
- `touch_interface`
- `wifi_spec`
- `bluetooth_version`
- `ethernet_spec`
- `poe_supported`
- `poe_standard`
- `material`
- `vesa_spec`
- `speaker_spec`
- `summary_config_text`
- `status`
- `created_at`
- `updated_at`

约束建议：

- `model_code` 全局唯一。
- `series_id + display_name` 应保持唯一或接近唯一，避免页面展示冲突。

说明：

- 该表只保存高频筛选和对比字段。
- 不能试图把所有规格都塞进变体表。

### `product_spec_items`

用途：完整规格真源，支持前台分组展示和后续多模板导入。

建议字段：

- `id`
- `variant_id`
- `section_key`
- `section_label`
- `spec_key`
- `spec_label`
- `spec_value_text`
- `spec_value_number`
- `unit`
- `value_json`
- `is_filterable`
- `sort_order`
- `created_at`
- `updated_at`

约束建议：

- `variant_id + section_key + sort_order` 建索引，保证按组有序读取。

说明：

- `section_label` 例如：`System`、`Display`、`Touch`、`Network`。
- `spec_label` 例如：`CPU`、`RAM`、`Resolution`、`POE`。
- 允许同一 `spec_label` 在一个分组内重复出现，例如两个 `USB`。
- 原始展示顺序必须保留。

### `documents`

用途：统一保存原始工作簿、规格资料、产品图、图纸和其他技术文件。

建议字段：

- `id`
- `company_id`
- `series_id`
- `variant_id`
- `quote_batch_id`
- `title`
- `document_kind`
- `file_type`
- `storage_path`
- `file_url`
- `source_sheet_name`
- `sort_order`
- `is_primary`
- `tags`
- `created_by`
- `created_at`
- `updated_at`

`document_kind` 建议枚举：

- `quote_workbook`
- `spec_sheet`
- `product_image`
- `drawing`
- `certificate`
- `manual`
- `technical`
- `other`

说明：

- 原始 Excel 作为 `quote_workbook`。
- 产品图和尺寸图必须可单独作为文档对象展示和关联。

### `quote_batches`

用途：表达“这一次报价发布”。

建议字段：

- `id`
- `company_id`
- `source_document_id`
- `batch_title`
- `published_at`
- `effective_from`
- `currency`
- `status`
- `entry_mode`
- `global_note`
- `created_by`
- `created_at`
- `updated_at`

约束建议：

- `currency` 使用三位大写币种。
- `status` 至少支持：`draft`、`active`、`expired`、`archived`。

说明：

- 一份报价工作簿对应一个或多个批次时，以批次为正式业务对象。
- 首批手工录入时，批次也必须存在，不能直接跳过。

### `quote_lines`

用途：批次内某个变体的一行报价。

建议字段：

- `id`
- `quote_batch_id`
- `variant_id`
- `standard_config_text`
- `row_note`
- `firmware_note`
- `sort_order`
- `status`
- `created_at`
- `updated_at`

说明：

- `standard_config_text` 保存总报价页中的“标准配置”原文。
- `row_note` 适合保存“外壳换成镀锌板底价少 $11”这类行级说明。
- `firmware_note` 适合保存“可选 google-EDLA 固件包，关闭 root 权限”。

### `quote_price_tiers`

用途：表达数量阶梯价。

建议字段：

- `id`
- `quote_line_id`
- `min_quantity`
- `max_quantity`
- `unit_price`
- `currency`
- `sort_order`
- `created_at`
- `updated_at`

说明：

- 当前样本固定有 4 档：`10 / 100 / 500 / 1000`。
- 若业务后续只记录起始数量，可先允许 `max_quantity` 为空。

### `quote_options`

用途：表达选配、加价、减价、固件包、支架等附加信息。

建议字段：

- `id`
- `scope_type`
- `quote_batch_id`
- `quote_line_id`
- `option_type`
- `option_name`
- `delta_type`
- `price_delta`
- `currency`
- `description`
- `sort_order`
- `created_at`
- `updated_at`

`scope_type` 建议枚举：

- `batch`
- `line`

`option_type` 建议枚举：

- `accessory`
- `firmware`
- `material_change`
- `other`

`delta_type` 建议枚举：

- `increase`
- `decrease`
- `text_only`

说明：

- 批次级适合保存全局支架选配。
- 行级适合保存型号专属减价或特殊备注。

### `updates`

用途：前台动态唯一来源。

建议保留并调整写入口径：

- 新品发布
- 报价有效更新
- 资料可见更新
- 管理员通知

说明：

- 报价动态应由 `quote_batches` 或有效报价变更触发。
- 附件上传本身不直接生成报价动态。

## 旧模型兼容策略

- 现有 `products` 可视为过渡层，不再作为长期主模型。
- 现有 `products.spec_json` 保留为兼容或缓存字段。
- 现有 `quotes` 单表模型不再满足真实业务，后续应迁移到：
  - `quote_batches`
  - `quote_lines`
  - `quote_price_tiers`
  - `quote_options`
- 现有 `documents` 继续保留，但扩展为统一文档中心，而不是只保存普通附件。

## Excel 字段映射

### 总报价页到系统字段

| Excel 字段 | 系统对象 | 系统字段 |
| --- | --- | --- |
| 尺寸 | `product_variants` | `size_inch` |
| 机型 | `product_variants` | `model_code` |
| 标准配置 | `quote_lines` | `standard_config_text` |
| 10台单价（USD） | `quote_price_tiers` | `min_quantity=10`, `unit_price` |
| 100台单价（USD） | `quote_price_tiers` | `min_quantity=100`, `unit_price` |
| 500台单价（USD） | `quote_price_tiers` | `min_quantity=500`, `unit_price` |
| 1000台单价（USD） | `quote_price_tiers` | `min_quantity=1000`, `unit_price` |
| 可选配件摇臂支架 | `quote_options` | `option_type=accessory`, `scope_type=batch or line` |
| 可选配件立柱支架 | `quote_options` | `option_type=accessory`, `scope_type=batch or line` |
| 备注/选配 | `quote_lines` 或 `quote_options` | `row_note` / `description` |
| 发布日期说明 | `quote_batches` | `published_at` 或 `global_note` |

### 规格页到系统字段

| Excel 分组/字段 | 系统对象 | 系统字段 |
| --- | --- | --- |
| Model No | `product_variants` | `model_code` |
| Product type | `product_series` | `product_type` |
| Product Description | `product_variants` | `display_name` |
| CPU | `product_variants` + `product_spec_items` | `chipset` + 原始规格项 |
| RAM | `product_variants` + `product_spec_items` | `ram_gb` + 原始规格项 |
| Internal memory | `product_variants` + `product_spec_items` | `storage_gb` + 原始规格项 |
| Operation system | `product_variants` + `product_spec_items` | `os_name/os_version` + 原始规格项 |
| Panel Size | `product_variants` + `product_spec_items` | `size_inch` + 原始规格项 |
| Resolution | `product_variants` + `product_spec_items` | `resolution_width/resolution_height` + 原始规格项 |
| Luminance | `product_variants` + `product_spec_items` | `brightness_nits` + 原始规格项 |
| POE | `product_variants` + `product_spec_items` | `poe_supported/poe_standard` + 原始规格项 |
| 其余规格 | `product_spec_items` | 分组和键值原样保存 |

## KDS 样例落库

### 系列

- `series_name`: `KDS 厨房系列`
- `product_type`: `Kitchen Digital Signage`
- `company`: `SHENZHEN HOPESTAR SCI-TECH CO.,LTD`

### 变体

- `KDS1589T`
- `KDS1585T`
- `KDS2189T`
- `KDS2185T`
- `KDS2489T`
- `KDS2485T`

### 批次

- `batch_title`: `KDS厨房系列 2026-04-28 报价批次`
- `currency`: `USD`
- `source_document`: 原始 Excel 工作簿

### 阶梯价

每个变体一条 `quote_line`，每条至少包含以下 `quote_price_tiers`：

- `10`
- `100`
- `500`
- `1000`

### 选配与减价

- “外壳换成镀锌板底价少 $11 / $14”
  - 建议落 `quote_options`
  - `option_type=material_change`
  - `delta_type=decrease`
- “可选 google-EDLA 固件包，关闭 root 权限”
  - 建议落 `quote_options`
  - `option_type=firmware`
  - `delta_type=text_only`
- “摇臂支架 / 立柱支架”
  - 建议落 `quote_options`
  - `option_type=accessory`

## 索引建议

- `product_series(company_id, category_id, status)`
- `product_variants(series_id, status)`
- `product_variants(model_code)` 唯一索引
- `product_spec_items(variant_id, section_key, sort_order)`
- `documents(company_id, document_kind, created_at desc)`
- `documents(series_id, variant_id, document_kind)`
- `quote_batches(company_id, status, published_at desc)`
- `quote_lines(quote_batch_id, variant_id)`
- `quote_price_tiers(quote_line_id, min_quantity)`
- `quote_options(quote_batch_id, quote_line_id, scope_type, option_type)`

## 开发前验收标准

- 任一开发者只看本文档，就能明确：
  - 哪些是主表
  - 哪些是关系表或明细表
  - 原始 Excel 哪些字段进系列、变体、规格项、批次、报价行、阶梯价、选配项
  - 前台列表页、详情页、报价中心分别该读哪些对象
- 文档中的对象命名与 `PRD`、`ARCHITECTURE`、`ROUTES`、`UI_SPEC` 保持一致。
