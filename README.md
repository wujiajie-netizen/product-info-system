# 产品资料系统

面向 B2B 内部协作的产品资料、报价文件和动态更新管理系统。项目目标是把零散的产品资料、报价单、规格书、图片和内部通知整理成结构化、可检索、可同步的公司信息资产。

当前项目基于 Vben Admin 改造，交付应用为 `apps/web-ele`，后端优先使用 Supabase Cloud。未来如有内网部署、合规或成本要求，可迁移到本地或自托管 Supabase。

## 核心能力

- 产品信息库：维护产品分类、型号、名称、规格参数、标签和启停状态。
- 文档中心：上传报价单、规格书、图片、PDF 和技术资料，并关联产品型号、分类和标签。
- 动态系统：发布报价更新、新品发布和内部通知，报价类文档上传后可自动生成动态。
- 权限控制：`admin` 可管理数据，`user` 只读查询和下载；真实边界由 Supabase RLS 和 Storage Policy 控制。

## 技术栈

- 前端：Vue 3、Vite、TypeScript、Vben Admin、Element Plus
- 后端：Supabase Auth、PostgreSQL、Storage、Row Level Security
- 数据服务层：`apps/web-ele/src/api/product-info`
- Supabase Client：`apps/web-ele/src/lib/supabase.ts`
- 数据库迁移：`supabase/migrations`

## 文档入口

- [AGENTS.md](./AGENTS.md)：Codex 和后续 coding agent 的项目级开发规则，会被 Codex 优先读取。
- [TECHNICAL_PLAN.md](./TECHNICAL_PLAN.md)：开发路线、云端接入、未来本地迁移和任务拆分。
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)：产品定位、MVP 范围和当前阶段摘要。
- [supabase/README.md](./supabase/README.md)：Supabase 初始化、迁移、权限、Storage 和管理员初始化说明。

Vben 模板内部包仍保留各自 README，用于维护框架源码时参考；业务开发通常不需要先阅读这些内部 README。

## 开发环境

项目使用 pnpm workspace。推荐 Node 版本满足 `package.json` 中的 engines 要求：

```bash
pnpm install
pnpm dev
```

当前前端开发服务默认由 Vben 配置选择端口，常见为：

```text
http://localhost:5666/
```

## Supabase 云端接入

开发阶段优先使用 Supabase Cloud，不强制先跑本地 Docker。创建云端项目后，按顺序执行：

```text
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_backend_requirements.sql
```

可选执行：

```text
supabase/seed.sql
```

复制环境变量示例：

```bash
Copy-Item apps/web-ele/.env.local.example apps/web-ele/.env.local
```

填写云端项目 URL 和 anon key：

```ini
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

检查云端连接：

```bash
pnpm run check:supabase
```

不要把 `service_role` key、数据库密码或真实密钥提交到仓库。

## 常用命令

```bash
pnpm -F @vben/web-ele run typecheck
pnpm run build
pnpm run check:supabase
```

## 当前开发重点

1. 云端 Supabase 项目接入与真实账号验证。
2. 产品管理、文档管理、动态管理接真实数据并补齐管理闭环。
3. RLS、Storage Policy、管理员/普通用户权限完整验证。
4. 上线前做一次 Cloud 到本地或自托管环境的迁移演练。
