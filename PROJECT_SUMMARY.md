# 项目摘要

## 产品定位

产品资料系统是一个面向 B2B 内部协作的轻量级产品信息平台。它不是电商、ERP、新闻站或普通网盘，而是把产品资料、报价文件和更新动态结构化管理起来，帮助销售、产品和管理人员快速查找、同步和维护信息。

一句话目标：让产品、报价和资料从零散文件变成结构化、可检索、可同步的公司信息资产。

## MVP 范围

- 产品信息库：分类、型号、名称、规格参数、标签、启停状态。
- 文档中心：报价单、规格书、图片、PDF、技术资料上传与关联。
- 动态系统：报价更新、新品发布、内部通知。
- 用户权限：`admin` 管理数据，`user` 只读查询和下载。
- 搜索体验：优先支持型号、标题、分类、标签等关键词检索。

## 技术决策

当前项目采用 Vue 3 + Vite + TypeScript + Vben Admin + Element Plus 作为后台应用技术栈。后端使用 Supabase，覆盖 Auth、PostgreSQL、Storage 和 RLS。

开发阶段优先接入 Supabase Cloud，不强制先跑本地 Docker。未来如果有内网部署、数据合规或成本要求，再迁移到本地或自托管 Supabase。

关键约束：

- 前端只使用 `VITE_SUPABASE_ANON_KEY`，不得写入 service role key。
- 业务数据访问统一封装在 `apps/web-ele/src/api/product-info`。
- Supabase Client 只在 `apps/web-ele/src/lib/supabase.ts` 创建。
- 所有表结构、索引、RLS、Storage Policy、触发器和函数都通过 `supabase/migrations` 管理。
- 文件资料必须结构化落表，不能只把文件丢进 Storage。

## 当前阶段

已完成：

- Supabase 核心 migration 草案：`profiles`、`products`、`documents`、`updates`。
- Storage bucket 和 policy 草案：`product-documents`。
- Supabase Auth 登录、会话恢复、登出和 profile 角色读取。
- 产品、文档、动态、用户、工作台的数据服务层。
- 产品管理基础 CRUD：新增、编辑、启用/停用、搜索。
- 云端接入检查脚本：`pnpm run check:supabase`。
- Codex 开发约束文档：`AGENTS.md`。

待完成：

- 创建并配置真实 Supabase Cloud 项目。
- 执行 migration、seed，并创建测试账号。
- 验证 RLS：匿名不可读写，登录用户可读，管理员可写。
- 文档管理补齐编辑、删除、上传失败回滚。
- 动态管理补齐编辑/删除策略。
- 工作台补齐真实待整理资料统计。
- 云端环境完整联调和上线前迁移演练。

## 开发优先级

1. 云端 Supabase 初始化与权限验证。
2. 产品管理和文档管理的真实业务闭环。
3. 搜索与工作台统计体验完善。
4. 交付验证：`typecheck`、`build`、云端联调。
5. 本地或自托管迁移演练。

详细执行计划见 [TECHNICAL_PLAN.md](./TECHNICAL_PLAN.md)，后端初始化说明见 [supabase/README.md](./supabase/README.md)。
