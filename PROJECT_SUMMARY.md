# 报价系统项目简要总结

## 项目定位

该项目本质上不是传统电商、ERP、新闻站或单纯报价系统，而是一个面向 B2B 内部协作的产品信息操作系统。核心目标是把公司的产品资料、报价文件和更新动态结构化、可检索化、可同步化。

可以理解为一个轻量级的内部产品信息平台，融合了 PIM、DMS 和信息流能力。

## 核心能力

1. 产品信息库
   - 管理产品分类、型号、名称和规格参数。
   - 用结构化数据替代零散资料，形成可查询的产品数据库。

2. 文档中心
   - 管理报价单、规格书、图片、PDF 和技术资料。
   - 文件需要和产品型号、分类、标签建立关联，而不是只作为网盘附件存放。

3. 动态系统
   - 承载报价更新、新品发布和内部通知。
   - 重点不是做新闻，而是让销售信息、产品变化和价格变化及时同步。

## 推荐技术架构

本项目定位为内部后台管理系统，不需要拆分独立前台和后台，也没有强 SEO 或 SSR 需求。因此最终推荐采用 Vue 后台技术栈：

- 前端框架：Vue 3
- 构建工具：Vite
- 开发语言：TypeScript
- 后台框架：Vben Admin
- UI 组件：Element Plus
- 后端与数据库：Supabase
- 文件存储：Supabase Storage
- 登录认证：Supabase Auth
- 实时更新：Supabase Realtime

这套方案中，Vben Admin 负责后台页面框架、菜单、路由、布局、主题和前端权限骨架；Supabase 负责真实的数据、认证、文件存储和数据库级权限控制。

整体结构为：

```text
Admin App - Vue 3 + Vite + TypeScript
  -> Vben Admin + Element Plus
  -> Supabase Client
  -> Supabase Backend
     -> products table
     -> documents table
     -> updates table
     -> auth
     -> storage
```

## 登录与权限方案

Vben Admin 自带登录页、动态路由、菜单权限和按钮权限等后台常用能力，但真实账号体系和数据权限需要接入 Supabase。

推荐采用简化权限模型：

- `admin`：可维护产品、上传文件、编辑文件、发布动态、删除数据。
- `user`：只读查询产品资料、查看动态、下载文件。

建议建立用户资料表：

```text
profiles
- id
- email
- name
- role
- created_at
```

登录与权限流程：

```text
用户登录
  -> Supabase Auth 验证账号
  -> 查询 profiles.role
  -> Vben Admin 根据 role 加载菜单、路由和按钮权限
  -> Supabase RLS 控制数据库读写权限
  -> Supabase Storage Policy 控制文件上传、下载和删除权限
```

MVP 阶段不建议做复杂的多级组织、客户分级、字段级权限，先用 `admin` 和 `user` 两类角色即可。

## MVP 数据模型

第一阶段最关键的是先把数据结构定好，主要包括三张表：

- `products`：产品表，包含分类、型号、名称、规格参数等。
- `documents`：文件表，包含标题、关联产品型号、文件类型、分类、文件地址、标签等。
- `updates`：动态表，包含动态类型、标题、内容、关联型号、旧值、新值、创建时间等。

其中 `product_model`、`category` 和 `tags` 必须尽早统一规范，否则后续搜索、关联和权限扩展都会受影响。

## 页面规划

建议的后台页面包括：

- 工作台：首页总览、搜索入口、最新动态。
- 产品管理：维护产品分类、型号、名称和规格参数。
- 文件资料管理：上传、分类、标签、关联产品、下载和预览。
- 产品详情：查看单个产品及其全部相关文件。
- 动态管理：发布和查看报价更新、新品发布、内部通知。
- 用户与权限：维护内部用户和角色。

## 核心功能优先级

1. 文件上传与分类关联
   - 文件上传到 Supabase Storage。
   - 文件 URL、类型、标签和关联产品保存到数据库。

2. 搜索系统
   - 优先支持按产品型号、标签、标题、分类搜索。
   - 可先用 Supabase SQL LIKE 或全文搜索实现。

3. 动态系统
   - 手动发布公告。
   - 上传报价单后可自动生成价格更新动态。
   - 后续可通过数据库 trigger 实现 `documents insert -> updates insert`。

4. 简化权限
   - `admin`：可上传、管理和发布。
   - `user`：只读查看和检索。

## 开发节奏

建议按 7 天 MVP 推进：

- Day 1：建立 Supabase 数据库和三张核心表。
- Day 2：初始化 Vue 3 + Vite + Vben Admin，完成工作台和基础布局。
- Day 3：接入文件上传和 Supabase Storage。
- Day 4：完成搜索功能和文件列表页。
- Day 5：完成动态系统和动态页。
- Day 6：完成管理后台的上传、产品管理和发布动态。
- Day 7：UI 优化、联调和测试。

## 后续演进

- V1：文件库、分类、搜索、动态。
- V2：AI 搜索、自动资料推荐、最近使用。
- V3：客户分级权限、销售行为分析、CRM 轻集成。

## 关键风险

- 不要把系统做成普通文件网盘，否则后期难以检索和复用。
- 不要一开始加入复杂权限，容易显著增加开发成本。
- 不要做成 ERP 流程系统，否则会偏离资料管理和信息同步的核心目标。
- 搜索不是附属功能，而是这个系统的核心体验。

## 正式开发后端接入方案

当前项目进入正式开发阶段后，后端方案确定为 Supabase，不再单独搭建传统 REST 后端服务。前端使用 `apps/web-ele` 作为唯一交付应用，通过 `@supabase/supabase-js` 访问 Supabase Auth、PostgreSQL、Storage 和 Realtime。

后端职责边界如下：

- Supabase Auth：负责真实登录、会话、登出、用户身份。
- PostgreSQL：负责产品、文档、动态、用户资料等业务数据。
- Row Level Security：负责数据库真实读写权限，是权限安全的最终边界。
- Supabase Storage：负责报价单、规格书、图片、PDF、技术资料等文件存储。
- Storage Policy：负责文件上传、下载、删除权限。
- Edge Functions：仅在后续出现复杂服务端逻辑时使用，MVP 阶段不优先引入。

前端职责边界如下：

- Vben Admin：负责后台布局、路由、菜单、主题、基础权限框架。
- Element Plus：负责业务页面 UI 组件。
- `apps/web-ele/src/api/product-info`：作为统一业务数据服务层，页面不直接散落写 Supabase 查询。
- `apps/web-ele/src/lib/supabase.ts`：只负责创建 Supabase Client 和判断环境变量是否配置。

安全约定：

- 前端只能使用 `VITE_SUPABASE_ANON_KEY`，不得写入 service role key。
- 所有 public schema 业务表必须启用 RLS。
- 前端菜单和按钮权限只用于体验控制，不能作为真实安全边界。
- 管理员权限以 `profiles.role = 'admin'` 为准，普通用户为 `profiles.role = 'user'`。
- 文件 bucket 暂定为私有 bucket `product-documents`，下载和预览优先使用受控 URL。

环境变量约定：

```ini
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 正式开发任务清单

### 第一阶段：后端与数据库落地

- [ ] 初始化 Supabase 本地或云端项目。
- [ ] 执行并校验 `supabase/migrations/001_initial_schema.sql`。
- [ ] 完善 `profiles`、`products`、`documents`、`updates` 表字段、索引和约束。
- [ ] 建立 `product-documents` Storage bucket。
- [ ] 增加 Storage Policy，限制上传、下载、删除权限。
- [ ] 准备 seed 数据：管理员账号、普通账号、样例产品、样例文档、样例动态。
- [ ] 验证 RLS：匿名用户不可读写，登录用户可读，管理员可写。

### 第二阶段：真实登录与权限

- [ ] 替换 Vben mock 登录为 Supabase Auth 登录。
- [ ] 实现登录、登出、会话恢复、登录态刷新。
- [ ] 登录后读取 `profiles` 表，拿到用户名称、邮箱和角色。
- [ ] 根据角色接入 Vben 菜单、路由和按钮权限。
- [ ] 管理员可访问管理页面，普通用户只能查看和检索资料。

### 第三阶段：前端数据服务层

- [ ] 新建 `apps/web-ele/src/api/product-info/products.ts`。
- [ ] 新建 `apps/web-ele/src/api/product-info/documents.ts`。
- [ ] 新建 `apps/web-ele/src/api/product-info/updates.ts`。
- [ ] 新建 `apps/web-ele/src/api/product-info/users.ts`。
- [ ] 统一封装分页、筛选、排序、错误处理和空状态。
- [ ] 页面只调用服务层，不直接操作 Supabase Client。

### 第四阶段：业务页面接真实数据

- [ ] 工作台接真实统计：产品数量、文档数量、本周动态、待整理资料。
- [ ] 产品管理接真实 CRUD：新增、编辑、停用、筛选、搜索。
- [ ] 文档管理接真实上传：Storage 上传、数据库落表、关联产品、标签、下载、预览。
- [ ] 动态管理接真实数据：发布公告、查看更新记录、报价文档上传后自动生成动态。
- [ ] 用户权限接真实用户资料：查看用户、修改角色、限制普通用户写操作。

### 第五阶段：交付验证

- [ ] 本地环境完整跑通：登录、产品、文档、动态、权限。
- [ ] 云端 Supabase 环境完整跑通。
- [ ] `pnpm -F @vben/web-ele run typecheck` 通过。
- [ ] `pnpm run build` 通过。
- [ ] 验证生产包只依赖 Element Plus 版本。
- [ ] 整理部署说明和账号初始化说明。

## 后续开发原则

- 数据结构先行，页面跟随数据库字段和权限模型开发。
- 每个业务页面都先接真实 Supabase 数据，再补交互优化。
- 权限必须同时做前端体验控制和数据库 RLS 控制。
- 文件资料必须结构化落表，不能只把文件丢进 Storage。
- 后续新增字段或表必须通过 migration 管理，不直接手改远程库。

参考依据：

- Supabase 官方建议使用 CLI 和 migrations 管理本地开发与远程部署：https://supabase.com/docs/guides/cli/local-development
- Supabase 官方建议暴露给浏览器访问的 public 表启用 RLS：https://supabase.com/docs/guides/database/postgres/row-level-security

## 一句话总结

这个项目的核心是建设一个内部产品资料库、文件管理中心和动态更新系统，让产品、报价和资料从零散文件变成结构化、可检索、可同步的公司信息资产。
