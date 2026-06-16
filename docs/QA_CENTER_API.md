# 问答中心接口与字段契约

## 业务定位

问答中心用于沉淀商品信息平台中的结构化知识问答，问题方向围绕商品、技术、规格、报价采购、交付售后，不做网址使用帮助、页面操作说明或普通 FAQ。

目标是在后端表结构完成前，先固定前后台字段口径，前端使用 mock 数据开发页面；后续后端按本文接口实现后，可将 `apps/web-front/src/api/qa-center.ts` 中的生成逻辑替换为真实请求。

## 前台功能边界

- 搜索商品型号、商品名称、规格参数、技术资料和采购问题。
- 按问题方向筛选：商品问题、技术问题、规格参数、报价采购、交付售后。
- 按回答状态筛选：已回答、待补充。
- 展示关联商品、核心规格、关联资料、浏览量、帮助数、更新时间。
- 支持前台提交待补充问题，状态默认为 `pending`。

## 后台功能边界

- 维护问题标题、问题描述、标准回答和状态。
- 关联商品变体、规格字段、资料、报价批次或报价行。
- 将问题发布为前台可见，或设为待补充、归档。
- 后台写操作必须登录，前台只读接口可匿名访问公开数据。

## 字段模型

### qa_questions

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | uuid | 是 | 问题 ID |
| question_no | text | 是 | 展示编号，如 `QA-10001` |
| title | text | 是 | 问题标题 |
| question | text | 是 | 问题描述 |
| answer | text | 否 | 标准回答 |
| category | text | 是 | `product` / `technical` / `spec` / `quote` / `after_sales` |
| status | text | 是 | `pending` / `answered` / `archived` |
| priority | text | 是 | `high` / `medium` / `low` |
| product_id | uuid | 否 | 关联商品变体 ID |
| product_model | text | 否 | 冗余展示型号，便于搜索 |
| product_name | text | 否 | 冗余展示商品名称 |
| source | text | 是 | `manual` / `product_generated` / `imported` |
| tags | text[] | 否 | 商品、规格、技术标签 |
| view_count | integer | 是 | 浏览量，默认 0 |
| helpful_count | integer | 是 | 有帮助数，默认 0 |
| asked_by | uuid | 否 | 提问用户 |
| asker_role | text | 否 | 提问来源角色，如销售/采购/技术 |
| answered_by | uuid | 否 | 回答人 |
| answered_at | timestamptz | 否 | 回答时间 |
| created_at | timestamptz | 是 | 创建时间 |
| updated_at | timestamptz | 是 | 更新时间 |

### qa_question_specs

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | uuid | 是 | 记录 ID |
| question_id | uuid | 是 | 关联问题 |
| spec_key | text | 是 | 规格键 |
| spec_label | text | 是 | 规格展示名 |
| spec_value | text | 是 | 规格展示值 |
| sort_order | integer | 是 | 排序 |

### qa_question_documents

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| question_id | uuid | 是 | 关联问题 |
| document_id | uuid | 是 | 关联资料 |
| relation_type | text | 是 | `spec` / `technical` / `quote` / `image` / `other` |

## 接口约定

### GET /api/qa/categories

返回问题分类和每类数量。

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "key": "technical",
      "label": "技术问题",
      "description": "接口、系统、芯片、供电、通信和结构等技术方向",
      "count": 18
    }
  ]
}
```

### GET /api/qa/questions

查询问题列表。

请求参数：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| keyword | string | 搜索标题、问题、回答、商品型号、规格 |
| category | string | 问题方向 |
| status | string | 回答状态 |
| productId | uuid | 关联商品 |
| sortBy | string | `hot` / `latest` / `answered` |
| page | number | 页码，默认 1 |
| pageSize | number | 每页条数，默认 8 |

返回结构：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "qa_xxx",
        "questionNo": "QA-10001",
        "title": "KDS2189T 的核心规格参数有哪些？",
        "question": "KDS2189T 需要优先确认哪些规格参数？",
        "answer": "核心规格包括尺寸、分辨率、亮度、接口和系统版本。",
        "category": "spec",
        "categoryName": "规格参数",
        "status": "answered",
        "priority": "high",
        "productId": "variant_xxx",
        "productModel": "KDS2189T",
        "productName": "21.5 寸厨房显示屏",
        "tags": ["规格", "参数", "厨房系列"],
        "relatedSpecs": [
          { "key": "resolution", "label": "分辨率", "value": "1920×1080" }
        ],
        "relatedDocuments": [
          {
            "id": "doc_xxx",
            "title": "KDS2189T 规格书",
            "fileType": "spec",
            "fileTypeLabel": "规格书",
            "url": "https://example.com/spec.pdf"
          }
        ],
        "viewCount": 128,
        "helpfulCount": 24,
        "createdAt": "2026-06-16T00:00:00.000Z",
        "updatedAt": "2026-06-16T00:00:00.000Z",
        "answeredAt": "2026-06-16T00:00:00.000Z"
      }
    ],
    "page": 1,
    "pageSize": 8,
    "total": 1,
    "totalPages": 1
  }
}
```

### GET /api/qa/overview

返回概览统计，用于页面顶部指标和热门问题。

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalQuestions": 120,
    "answeredQuestions": 108,
    "pendingQuestions": 12,
    "productCoverage": 24,
    "relatedDocumentCount": 36,
    "categoryCounts": {
      "product": 24,
      "technical": 24,
      "spec": 24,
      "quote": 24,
      "after_sales": 24
    },
    "featuredQuestions": []
  }
}
```

### POST /api/qa/questions

提交新问题，前台写入后默认 `pending`。

请求体：

```json
{
  "title": "KDS2189T 是否支持 EDLA 固件包？",
  "question": "客户需要确认是否可以出厂预装 EDLA 固件包，以及是否影响报价。",
  "category": "technical",
  "productModel": "KDS2189T",
  "tags": ["EDLA", "固件", "报价"],
  "contact": "销售A"
}
```

返回提交后的问题对象。

## 当前前端实现说明

- 当前页面位于 `/qa-center`。
- 前端接口封装位于 `apps/web-front/src/api/qa-center.ts`。
- 在真实后端接口完成前，前端会从现有商品、资料和报价数据中生成 mock 问答，方向严格限制在商品、技术、规格、报价采购和交付售后。
- 后续替换真实接口时，应保持字段名与本文一致，减少页面返工。
