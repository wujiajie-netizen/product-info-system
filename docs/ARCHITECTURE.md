# 技术架构

## 1. 架构定位

项目采用“前台展示 + 后台管理 + Supabase 后端”的架构。

- `apps/web-front`：前台公开站点，负责商品、资料、报价、公司和动态展示。
- `apps/web-ele`：后台管理站点，负责数据录入、上传、发布、权限和治理。
- Supabase Cloud：负责数据库、鉴权、RLS、Storage 和业务数据访问。

前后台独立构建、独立部署，共用同一套业务数据模型和权限口径。

## 2. 权限边界

- 匿名用户：可访问前台公开数据。
- 登录 `user`：只读访问授权数据。
- 登录 `admin`：可维护商品、资料、报价、动态、公司和用户角色。
- 后台页面、上传入口和写操作必须登录并校验角色。
- RLS 权限必须与页面行为一致。

## 3. 前端约束

- 前台目录：`apps/web-front/src`
- 后台目录：`apps/web-ele/src`
- Supabase Client 统一封装在各应用的 `src/lib/supabase.ts`
- 业务请求必须封装在 `src/api/`
- 组件、请求、hooks、store 分层规则统一遵循 `docs/VUE3_FRONTEND_RULES.md`

## 4. 核心数据模型

当前核心业务对象：

- `categories`：商品分类，支持层级。
- `brands`：品牌或产品线。
- `companies`：供应商、品牌方、报价来源公司。
- `product_series`：产品系列，保存系列级公共信息。
- `product_variants`：产品变体，保存型号和常用筛选字段。
- `product_spec_items`：完整规格，支持分组、排序和原样展示。
- `documents`：资料、图片、图纸、规格书、原始报价包等文件对象。
- `quote_batches`：报价批次，表达一次报价发布。
- `quote_lines`：批次内的变体报价行。
- `quote_price_tiers`：阶梯价。
- `quote_options`：选配项、减价项、固件包、支架等附加信息。
- `updates`：新品、报价更新、资料更新和内部通知。

核心结论：

- 产品采用“系列 + 变体”两层。
- 报价采用“批次 + 报价行 + 阶梯价 + 选配项”四层。
- 完整规格以 `product_spec_items` 为真源，常用筛选字段投影到变体表。
- 原始 Excel 只作为文档对象保存，不直接等同于结构化报价记录。

## 5. 页面模块

前台核心页面：

- 首页
- 产品列表
- 分类导航
- 产品详情
- 资料中心
- 报价中心
- 公司库
- 动态页
- 问答中心

后台核心模块：

- 统计看板
- 系列与变体管理
- 分类与品牌管理
- 公司管理
- 文档管理
- 报价批次管理
- 动态管理
- 问答中心管理
- 用户与角色管理

## 6. 动态口径

- 动态统一来自 `updates` 表。
- 只记录新品发布、有效报价更新、资料可见更新和管理员通知。
- 草稿保存、备注修改、排序调整、附件上传等后台噪音不写入动态。
- 前台只展示有效、可见、未停用对象关联的动态。

## 7. 迁移与交付要求

- 表结构、索引、RLS policy、Storage policy、触发器和函数必须通过 `supabase/migrations` 管理。
- 不允许只在 Supabase Dashboard 手工改表后不落 migration。
- Storage bucket 保持为 `product-documents`，除非同步更新 migration、API 层和文档。
- 文档文件必须保存 `storage_path`，不得依赖短期签名 URL 作为长期地址。
- 上线前需要完成 Supabase Cloud 到本地或自托管环境的迁移演练。
