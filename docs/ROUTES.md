# 路由规划

## 目的

本文档用于沉淀当前项目的前后台路由规划，作为后续页面开发、菜单调整和权限设计的参考。  
当前阶段以路由规划驱动实际实现和验收，文档必须与代码落地保持同步。

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
- 当前详情语义仍偏“单产品”，未体现“系列详情 + 变体切换”的最终结构。
- 当前业务路由没有完整承载 `companies`、`quotes`、`categories`、`brands`、`quote batches` 等模块。
- 框架默认路由和演示路由仍混在项目中，后续应清理或隐藏。

## 建议目标路由

### 前台主链路路由

- `/`
  - 前台首页，承担统一入口和按对象搜索入口；搜索默认对象为产品。
  - 首页模块至少包括：热门系列、资料入口、最新报价批次、最新动态。
- `/products`
  - 系列总列表页，同时承接普通浏览、产品关键词检索、分类结果和品牌结果。
  - 支持分类、品牌、尺寸、芯片、RAM、存储、亮度、POE、报价状态等多维筛选。
- `/categories`
  - 分类导航页，统一提供产品分类入口和品牌导航入口；点击后跳转 `/products` 并回显筛选参数。
- `/documents`
  - 资料中心，独立展示原始报价工作簿、规格书、产品图、尺寸图、PDF、认证文件和技术资料。
- `/quotes`
  - 报价中心，独立展示报价批次和变体报价行。
  - 页面应承载批次维度、变体维度、阶梯价和选配说明，不再只做单价列表。
- `/companies`
  - 公司库，展示供应商/品牌方列表，并联动报价总览与平台动态。
- `/updates`
  - 动态信息流页，并承接动态关键词检索。
- `/products/:seriesId`
  - 系列详情页，集中展示：
    - 系列头部信息
    - 变体切换
    - 核心参数对比
    - 完整规格
    - 阶梯报价
    - 选配说明
    - 图片/图纸
    - 相关资料
    - 最近动态

### 可派生的详情或聚合路由

- `/companies/:companyId`
  - 公司详情页。
- `/quotes/:batchId`
  - 报价批次详情页，适合查看本次发布涉及的所有变体报价行、阶梯价和选配项。
- `/products/:seriesId/documents`
  - 系列资料聚合页。
- `/products/:seriesId/quotes`
  - 系列报价聚合页。
- `/products/:seriesId/updates`
  - 系列动态聚合页。

### 后台路由

- `/admin`
  - 后台入口，建议重定向到 `/admin/dashboard`。
- `/admin/dashboard`
  - 后台看板。
- `/admin/products`
  - 系列管理。
- `/admin/products/:seriesId`
  - 系列详情页，内含变体管理和规格维护入口。
- `/admin/categories`
  - 分类管理。
- `/admin/brands`
  - 品牌管理。
- `/admin/companies`
  - 公司管理。
- `/admin/documents`
  - 文档管理，负责原始 workbook、图片、图纸、规格文件分类关联。
- `/admin/quotes`
  - 报价批次管理。
- `/admin/quotes/:batchId`
  - 报价批次详情页，负责报价行、阶梯价、选配项和来源文件维护。
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

## 页面职责补充

### 前台产品详情

- 不再规划为“单型号单页”。
- 详情页主对象是系列，型号作为变体切换器存在于页内。
- 页面中的报价区应能展示：
  - 报价批次头信息
  - 当前变体报价行
  - `10 / 100 / 500 / 1000` 等阶梯价
  - 支架、固件包、减价项等选配说明

### 前台报价中心

- 主列表对象不是单个 `unit_price` 记录，而是报价批次和批次内的报价行。
- 详情层级必须支持从“批次”下钻到“变体报价行”。

### 后台商品管理

- 主列表对象是系列。
- 变体、规格项、媒体资料在系列详情页中维护。

### 后台报价管理

- 主列表对象是报价批次。
- 报价批次详情页内维护：
  - 报价行
  - 阶梯价
  - 选配项
  - 来源文件

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
- `/documents`
- `/quotes`
- `/quotes/:batchId`
- `/companies`
- `/updates`
- `/products/:seriesId`
- `/companies/:companyId`
- `/products/:seriesId/documents`
- `/products/:seriesId/quotes`
- `/products/:seriesId/updates`
- `/admin/products/:seriesId`
- `/admin/categories`
- `/admin/brands`
- `/admin/companies`
- `/admin/quotes`
- `/admin/quotes/:batchId`
- `/admin/settings`

### 需要清理或隐藏

- `/analytics`
- `/workspace`
- `/demos/*`
- `/vben-admin/*`

## 当前结论

当前项目路由不应继续围绕 `/product-info/*` 单独扩展，而应尽快转为三层结构：

- 前台展示路由
- 后台管理路由
- 后置阶段个人协作路由

后续如果进入代码实施阶段，建议先完成：

1. 后台路由重命名到 `/admin/*`。
2. 前台首页、产品列表、分类导航、系列详情页的首批路由落地。
3. 本版本同步补齐报价中心、资料中心、公司库和动态页。
4. 清理演示和框架无关路由。
