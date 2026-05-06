# 路由规划

## 目的

本文档用于沉淀当前项目的前后台路由规划，作为后续页面开发、菜单调整和权限设计的参考。

## 当前路由现状

当前业务路由主要集中在后台管理侧，定义位置参考：

- `apps/web-ele/src/router/routes/modules/product-info.ts`
- `apps/web-ele/src/router/routes/core.ts`
- `apps/web-ele/src/router/routes/modules/dashboard.ts`

当前已有的业务后台路由：

- `/product-info/dashboard`
- `/product-info/products`
- `/product-info/documents`
- `/product-info/updates`
- `/product-info/users`

当前已有的认证路由：

- `/auth/login`
- `/auth/register`
- `/auth/forget-password`
- `/auth/code-login`
- `/auth/qrcode-login`

当前仍存在的框架或演示类路由：

- `/analytics`
- `/workspace`
- `/demos/*`
- `/vben-admin/*`
- `/profile`

## 现状评估

当前路由结构更接近“后台原型”，不符合最终“前台展示 + 后台管理”的项目目标，主要问题如下：

- 已具备部分后台管理路由，但缺少前台展示路由体系。
- 缺少首页、产品列表、分类导航、品牌导航、资料中心、报价中心、公司库、搜索结果和商品详情等前台核心页面。
- 当前业务路由没有独立的 `companies`、`quotes`、`categories`、`brands` 模块。
- 框架默认路由和演示路由仍混在项目中，后续应清理或隐藏。

## 建议目标路由

### 前台主链路路由

- `/`
  - 前台首页，承担统一搜索入口，并聚合分类入口、热门商品、资料中心、报价中心、公司库和最新动态。
- `/products`
  - 商品总列表页，支持分类、品牌、标签、关键参数、资料数量和报价状态等多维筛选。
- `/categories`
  - 分类导航页，提供目录式浏览入口。
- `/categories/:categoryId`
  - 分类商品列表页，承接分类结果筛选和排序。
- `/brands`
  - 品牌导航页，提供品牌聚合浏览入口。
- `/brands/:brandId`
  - 品牌商品列表页。
- `/documents`
  - 资料中心，独立展示规格书、图片、PDF、认证文件和技术资料。
- `/quotes`
  - 报价中心，独立展示报价记录并支持结构化筛选。
- `/companies`
  - 公司库，展示供应商/品牌方列表，并联动报价总览与平台动态。
- `/updates`
  - 动态信息流页。
- `/search`
  - 综合搜索结果页，统一承接商品、资料、报价和公司等检索结果。
- `/products/:productId`
  - 商品详情页，集中展示规格参数、相关资料、报价记录、关联公司和最近动态。

### 可派生的详情或聚合路由

- `/companies/:companyId`
  - 公司详情页。
- `/products/:productId/documents`
  - 商品资料聚合页。
- `/products/:productId/quotes`
  - 商品报价聚合页。
- `/products/:productId/updates`
  - 商品动态聚合页。

### 后台路由

- `/admin`
  - 后台入口，建议重定向到 `/admin/dashboard`。
- `/admin/dashboard`
  - 后台看板。
- `/admin/products`
  - 商品管理。
- `/admin/categories`
  - 分类管理。
- `/admin/brands`
  - 品牌管理。
- `/admin/companies`
  - 公司管理。
- `/admin/documents`
  - 文档管理。
- `/admin/quotes`
  - 报价管理。
- `/admin/updates`
  - 动态管理。
- `/admin/users`
  - 用户与角色管理。
- `/admin/settings`
  - 系统配置，可作为后置模块。

### 后置阶段协作路由

- `/favorites`
  - 收藏 / 我的关注。
- `/history`
  - 浏览历史。
- `/compare`
  - 参数对比。
- `/workspace`
  - 个人工作台。
- `/upload`
  - 前台上传资料入口。
- `/quote-request`
  - 申请报价 / 联系公司。

### 认证与通用路由

- `/auth/login`
- `/auth/register`
- `/auth/forget-password`
- `/403`
- `/404`

## 与现有路由的对应建议

### 可直接迁移或重命名

- `/product-info/dashboard` -> `/admin/dashboard`
- `/product-info/products` -> `/admin/products`
- `/product-info/documents` -> `/admin/documents`
- `/product-info/updates` -> `/admin/updates`
- `/product-info/users` -> `/admin/users`

### 需要新增

- `/`
- `/products`
- `/categories`
- `/categories/:categoryId`
- `/brands`
- `/brands/:brandId`
- `/documents`
- `/quotes`
- `/companies`
- `/updates`
- `/search`
- `/products/:productId`
- `/companies/:companyId`
- `/products/:productId/documents`
- `/products/:productId/quotes`
- `/products/:productId/updates`
- `/admin/categories`
- `/admin/brands`
- `/admin/companies`
- `/admin/quotes`
- `/admin/settings`

### 需要清理或隐藏

- `/analytics`
- `/workspace`
- `/demos/*`
- `/vben-admin/*`

## 当前结论

当前项目路由不应继续围绕 `/product-info/*` 单独扩展，而应尽快转为两套路由体系：

- 前台展示路由
- 后台管理路由
- 后置阶段再补个人协作路由

后续如果进入代码实施阶段，建议先完成：

1. 后台路由重命名到 `/admin/*`。
2. 前台首页、产品列表、分类/品牌导航、商品详情页的首批路由落地。
3. 本版本同步补齐首页热门产品、首页最新动态和 `/updates` 动态流，其余聚合页再补资料中心、报价中心、公司库和搜索结果页。
4. 清理演示和框架无关路由。
