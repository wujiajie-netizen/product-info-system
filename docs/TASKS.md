# 开发任务清单

本文档用于维护当前项目的实施任务、迭代顺序和验收标准。后续每完成一项任务，都在本文件中同步更新状态，避免任务进度散落在对话或临时记录中。

## 状态约定

- `[x]` 已完成
- `[ ]` 待开发
- `[-]` 明确暂缓，不进入当前首批范围

## 当前迭代目标

首批开发围绕核心商品信息链路推进，并补齐首页热门产品、首页最新动态和独立动态页，目标是先打通：

- 管理员维护分类、品牌、商品、公司、文档、报价
- 登录用户搜索、浏览、筛选并查看商品详情
- 用户查看规格参数、相关资料、报价记录和关联公司

以下能力已纳入本版本开发内容，不再暂缓：

- `[ ]` 首页热门产品
- `[ ]` 首页最新动态
- `[ ]` 独立动态页 / 动态信息流

以下能力当前明确暂缓：
- `[-]` 收藏、历史、对比、工作台
- `[-]` 前台上传资料
- `[-]` 申请报价 / 联系公司

## 设计稿差异清单

按当前设计图和已开发功能对比，当前仍未落地的内容主要有：

- 首页热门产品模块：当前首页只有快速入口、分类入口和侧边聚合入口，未按 `home.png` 展示热门产品卡片区。
- 首页最新动态模块：当前首页未按 `home.png` 展示动态列表，也未接通首页动态跳转。
- 独立动态页 / 动态信息流：`apps/web-front/src/views/update/index.vue` 已有页面骨架，但前台路由尚未挂载，无法从主导航进入。
- 产品列表页增强筛选：当前缺少设计稿里的树形分类筛选、品牌筛选深度、价格区间、已选条件标签、导出与视图切换。
- 分类 / 品牌导航页增强内容：当前缺少热门品牌条、字母索引、行业热点和平台数据概览。
- 商品详情页增强内容：当前缺少产品动态区块，以及“加入项目”“导出数据”等右侧快捷操作。
- 公司库页面增强内容：当前缺少公司类型 / 主营分类筛选、报价总览、平台动态和平台数据区。
- 搜索结果页：当前尚未落地独立 `/search` 页面。

## 最近验收记录

### 2026-05-04 分类 / 品牌 slug 链路复核与二次视觉验收

- `[x]` 分类页、品牌页继续使用 `slug` 命中聚合数据，并兼容旧名称参数
- `[x]` 分类页、品牌页进入产品列表时改传 `categoryId/categorySlug`、`brandId/brandSlug`
- `[x]` 产品列表页支持按 `id + slug + 旧名称` 回填分类 / 品牌筛选，避免改名后跳转失效
- `[x]` 前台 `Naive UI` 主题色覆盖已对齐项目蓝绿主色与橙色强调色
- `[x]` 分类 / 品牌页面按 `design/frontend-ui/category-navigation.png`、`design/frontend-ui/mobile-design-board-v1.png` 完成桌面 / 移动端微调
- `[x]` 已用有头 Chromium 完成桌面 / 手机验收，截图保存在 `output/playwright/`

验收截图：

- `output/playwright/category-review-desktop-viewport.png`
- `output/playwright/brand-review-desktop-viewport.png`
- `output/playwright/category-review-mobile-viewport.png`
- `output/playwright/brand-review-mobile-viewport.png`

验证命令：

```bash
pnpm -F @product-info/web-front run typecheck
pnpm -F @product-info/web-front run build
pnpm -F @vben/web-ele run typecheck
pnpm run build
```

### 2026-05-04 详情真实关联链路与产品列表移动入口

- `[x]` 前台 API 补齐 `product_companies`、`quote_documents` 只读链路
- `[x]` 商品详情“关联公司”合并后台维护的商品公司关系与报价公司
- `[x]` 商品详情报价记录展示报价附件、起订量、有效期、备注和报价公司
- `[x]` 产品图片优先使用关联 `file_type = image` 的资料，缺省再回落占位图
- `[x]` 产品列表移动端卡片补“报价 / 资料 / 关联公司”明确入口
- `[x]` 已用有头 Chromium 打开本地前台验收，截图保存在 `output/playwright/`

验证命令：

```bash
pnpm -F @product-info/web-front run typecheck
pnpm -F @product-info/web-front run build
pnpm -F @vben/web-ele run typecheck
pnpm run build
```

### 2026-05-04 首页回归与前台数据过滤

- `[x]` 首页按 `design/frontend-ui/home.png` 和 `mobile-design-board-v1.png` 回归首批范围
- `[x]` 首页保留搜索、分类入口、资料中心、报价中心、公司库入口
- `[x]` 首页不恢复热门产品和最新动态模块
- `[x]` 前台默认过滤非 `active` 数据：产品、分类、品牌、公司和报价
- `[x]` 分类 / 品牌前台入口改用 `slug`，并兼容旧名称参数
- `[x]` 已用可见 Chromium 打开本地前台验收，截图保存在 `output/playwright/`

验证命令：

```bash
pnpm -F @product-info/web-front run typecheck
pnpm -F @product-info/web-front run build
pnpm -F @vben/web-ele run typecheck
pnpm run build
```

## 迭代 0：基础纠偏

### 0.1 项目文档重整

- `[x]` 重写项目定位、技术计划、路由规划与 Supabase 使用边界
- `[x]` 补充前台设计基线、移动端设计稿和前台实现 / 验收规则文档

验收标准：

- `docs/PRD.md`、`docs/ARCHITECTURE.md`、`docs/ROUTES.md`、`supabase/README.md` 已对齐当前方向
- 文档明确前台展示与后台管理双场景
- 文档明确 Supabase Cloud 优先和后续可迁移约束
- `design/frontend-ui/mobile-design-board-v1.png` 已纳入项目设计目录
- `design/frontend-ui/IMPLEMENTATION_RULES.md` 已明确前台开发规则、移动端适配规则和验收标准

### 0.2 Supabase 核心数据模型重审

- `[x]` 补齐或重构 `categories`、`brands`、`companies`、`quotes` 及必要关联表

验收标准：

- 报价作为独立业务对象建模，而不是仅依赖 `documents.file_type = 'quote'`
- 商品可关联分类、品牌、公司、资料、报价
- 设计保留后续本地或私有化迁移能力

### 0.3 Migration 与权限策略整理

- `[x]` 将新增表结构、索引、RLS、Storage policy 全部落入 `supabase/migrations`

验收标准：

- `supabase/migrations` 可从空库顺序执行
- 匿名用户不可读写业务表
- 登录用户可读产品、文档、报价、公司
- `profiles.role = 'admin'` 可写产品、文档、报价、动态和角色

### 0.4 路由体系重构

- `[x]` 建立前台和后台两套路由骨架

验收标准：

- 前台具备 `/`、`/products`、`/categories`、`/brands`、`/products/:productId`
- 后台具备 `/admin/dashboard`、`/admin/products`、`/admin/categories`、`/admin/brands`、`/admin/companies`、`/admin/documents`、`/admin/quotes`
- 不再继续围绕 `/product-info/*` 扩展新功能

### 0.5 API 边界统一

- `[x]` 将新增业务访问统一收口到 `apps/web-ele/src/api/product-info`

验收标准：

- 页面中不散落直接 Supabase 业务查询
- 前后台页面复用统一 API 能力
- 与路由和数据模型调整保持一致

## 迭代 1：前台首批主链路

### 1.1 前台公共布局与导航

- `[x]` 实现前台顶部导航、搜索区、页面容器和基础响应式结构

验收标准：

- 布局结构对齐 `design/frontend-ui/home.png` 的主导航方向
- 同时满足 `design/frontend-ui/mobile-design-board-v1.png` 的移动端表达
- 支持桌面端与移动端可操作，不是仅“基本可用”
- 导航可进入首页、产品、分类、品牌、资料、报价、公司库
- 手机端主导航采用折叠菜单、抽屉或等价可落地交互，不保留拥挤横排链接

### 1.2 首页首批版本

- `[x]` 实现首页搜索入口和聚合入口

验收标准：

- 首页具备统一搜索框
- 首页展示分类入口、资料中心入口、报价中心入口、公司库入口
- 首页补齐“热门产品”“最新动态”模块，并可跳转到独立动态页
- 桌面端参考 `design/frontend-ui/home.png`
- 移动端参考 `design/frontend-ui/mobile-design-board-v1.png`

### 1.3 产品列表页

- `[x]` 实现产品总列表和首批筛选能力

验收标准：

- 支持关键词、分类、品牌、标签或关键参数的首批筛选
- 列表展示产品基础信息、资料入口、报价摘要、关联公司、更新时间
- 结构和信息密度参考 `design/frontend-ui/product-list.png`
- 移动端采用卡片式列表，不直接复用桌面宽表格
- 移动端筛选使用抽屉、底部弹层或等价可落地交互

### 1.4 分类导航页

- `[x]` 实现目录式分类浏览页

验收标准：

- 可按分类分组浏览
- 可进入分类结果页或分类筛选后的产品列表
- 页面结构参考 `design/frontend-ui/category-navigation.png`
- 移动端支持纵向浏览分类和品牌入口，避免依赖横向宽布局

### 1.5 品牌导航页

- `[x]` 实现品牌聚合浏览页

验收标准：

- 展示品牌入口、品牌聚合信息和品牌筛选结果
- 可进入品牌结果页或品牌产品列表
- 与分类导航页保持一致的前台交互风格
- 移动端展示方式与 `design/frontend-ui/mobile-design-board-v1.png` 保持一致的堆叠逻辑

### 1.6 商品详情页

- `[x]` 实现商品详情核心信息区

验收标准：

- 展示规格参数、相关资料、报价记录、关联公司四大区块
- 支持基础图片或资料展示区
- 页面主体结构参考 `design/frontend-ui/product-detail.png`
- 移动端采用纵向信息堆叠，不保留桌面双栏结构
- 移动端详情表达参考 `design/frontend-ui/mobile-design-board-v1.png`

## 迭代 2：后台核心维护闭环

### 2.1 后台商品管理

- `[x]` 完善商品管理页

验收标准：

- 管理员可新增、编辑、启停商品
- 可维护型号、名称、分类、品牌、参数、标签、状态

### 2.2 后台分类管理

- `[x]` 新增分类管理页

验收标准：

- 管理员可维护分类名称、层级、排序和启停状态
- 前台分类导航和筛选直接消费分类数据

### 2.3 后台品牌管理

- `[x]` 新增品牌管理页

验收标准：

- 管理员可维护品牌名称、别名、展示信息和状态
- 前台品牌导航和筛选直接消费品牌数据

### 2.4 后台公司管理

- `[x]` 新增公司管理页

验收标准：

- 管理员可维护供应商、制造商、报价来源公司
- 商品和报价可与公司建立关联

### 2.5 后台文档管理

- `[x]` 完善文档上传与关联管理

验收标准：

- 支持上传并关联商品、公司或报价
- `documents.storage_path` 保存 bucket 内对象路径
- 登录用户可读取文档元数据并打开或下载文件

### 2.6 后台报价管理

- `[x]` 新增报价管理页

验收标准：

- 管理员可维护报价主体、关联商品、关联公司、币种、单价、有效期、状态、备注
- 支持报价附件或报价单关联
- 前台详情页可读取报价记录摘要

## 迭代 3：联调、验证与收口

### 3.1 前后台联调

- `[ ]` 打通前台浏览与后台维护的数据链路
- `[x]` 前台默认只消费 active 状态的产品、分类、品牌、公司和报价
- `[x]` 前台产品详情补齐 `product_companies` 关联公司链路
- `[x]` 前台读取 `quote_documents`，在报价记录或详情页展示报价附件
- `[x]` 产品图片优先使用关联 `file_type = image` 的资料，不再只使用占位图
- `[x]` 产品列表移动端补明确资料入口，避免只有资料数量

验收标准：

- 后台新增或修改的分类、品牌、商品、公司、文档、报价可在前台正确呈现
- 前台搜索、筛选、详情展示与后台数据保持一致
- 后台归档、草稿、过期报价不会进入前台报价摘要
- 后台停用的数据不会进入前台默认浏览链路

### 3.2 权限回归验证

- `[ ]` 验证匿名、普通用户、管理员三类角色权限

验收标准：

- 匿名不可读写业务表
- 普通 `user` 可读不可写
- `admin` 写操作完整可用

### 3.3 类型与构建校验

- `[x]` 执行前端类型检查与构建

验收标准：

- `pnpm -F @vben/web-ele run typecheck` 通过
- `pnpm run build` 通过

### 3.4 首批链路验收

- `[ ]` 完成首批 MVP 业务链路验收
- `[x]` 首页设计稿回归与前台 active 数据过滤验收
- `[x]` 产品列表页按设计稿做桌面 / 移动端二次视觉验收
- `[x]` 分类 / 品牌导航页按设计稿做桌面 / 移动端二次视觉验收
- `[x]` 商品详情页按设计稿做桌面 / 移动端二次视觉验收

验收标准：

- 可完成“登录 -> 首页搜索/入口 -> 产品列表筛选 -> 商品详情查看 -> 资料查看 -> 报价查看 -> 后台维护”的完整流程
- 首批范围内页面与数据链路可稳定运行
- 首页桌面端保持搜索、分类入口、资料中心、报价中心、公司库入口，并补齐热门产品和最新动态
- 前台默认不展示停用产品、停用分类、停用品牌、停用公司和非 active 报价

## 下一轮开发清单

建议下一轮优先围绕“详情页真实关联链路”和“产品列表验收缺口”推进：

1. `[x]` 前台 API 补 `product_companies` 读取能力，并在商品详情页“关联公司”区块展示后台维护的公司关系。
2. `[x]` 前台 API 补 `quote_documents` 读取能力，报价记录展示已绑定报价附件。
3. `[x]` 产品图片链路改造：优先取关联商品的 `file_type = image` 文档生成可访问图片，缺省时再用占位图。
4. `[x]` 产品列表页移动端卡片补“资料入口”按钮或链接，并重新截桌面 / 手机验收图。
5. `[x]` 分类 / 品牌页面继续按 `slug -> id -> products` 链路复核，确保改名后前台链接稳定。
6. `[ ]` 执行权限回归验证：匿名不可读写、普通用户只读、管理员可写。

## 更新规则

- 新任务进入开发前，先补充到本文件对应迭代下。
- 每完成一项任务，将对应状态从 `[ ]` 改为 `[x]`。
- 若任务确认不进入首批范围，统一移到“明确暂缓”并标记为 `[-]`。
